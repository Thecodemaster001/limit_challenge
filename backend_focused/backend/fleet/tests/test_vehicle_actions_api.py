import pytest
from rest_framework import status

from fleet.tests.factories import OfficeFactory, VehicleFactory

pytestmark = pytest.mark.django_db


class TestAssignVehicle:
    def test_moves_vehicle_to_the_new_office(self, api_client):
        vehicle = VehicleFactory()
        new_office = OfficeFactory()

        response = api_client.post(
            f"/api/vehicles/{vehicle.pk}/assign/", {"office": new_office.pk}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["office"] == new_office.pk
        vehicle.refresh_from_db()
        assert vehicle.office == new_office

    def test_ignores_other_fields_in_the_request(self, api_client):
        vehicle = VehicleFactory(make="Ford")

        api_client.post(
            f"/api/vehicles/{vehicle.pk}/assign/",
            {"office": OfficeFactory().pk, "make": "Changed"},
            format="json",
        )

        vehicle.refresh_from_db()
        assert vehicle.make == "Ford"

    def test_rejects_the_current_office(self, api_client):
        vehicle = VehicleFactory()

        response = api_client.post(
            f"/api/vehicles/{vehicle.pk}/assign/", {"office": vehicle.office_id}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["office"] == ["The vehicle is already assigned to this office."]

    @pytest.mark.parametrize("payload", [{"office": 999999}, {}])
    def test_rejects_missing_or_unknown_office(self, api_client, payload):
        vehicle = VehicleFactory()

        response = api_client.post(f"/api/vehicles/{vehicle.pk}/assign/", payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "office" in response.data

    def test_unknown_vehicle_returns_404(self, api_client):
        response = api_client.post(
            "/api/vehicles/999999/assign/", {"office": OfficeFactory().pk}, format="json"
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestDuplicateCheck:
    @pytest.fixture(autouse=True)
    def existing_vehicles(self):
        self.vehicle = VehicleFactory(vin="1HGCM82633A000001", license_plate="TAKEN")
        VehicleFactory(vin="1HGCM82633A000002", license_plate="RETIRED", is_active=False)

    @pytest.mark.parametrize(
        ("query", "expected_conflicts"),
        [
            ("vin=1hgcm82633a000001&license_plate=taken", ["vin", "license_plate"]),
            ("vin=1HGCM82633A000002", ["vin"]),
            ("license_plate=RETIRED", []),
            ("vin=1HGCM82633A999999&license_plate=FREE", []),
        ],
    )
    def test_reports_conflicting_fields(self, api_client, query, expected_conflicts):
        response = api_client.get(f"/api/vehicles/duplicate-check/?{query}")

        assert response.status_code == status.HTTP_200_OK
        assert response.data == {"conflicts": expected_conflicts}

    def test_vehicle_being_edited_does_not_conflict_with_itself(self, api_client):
        query = f"vin=1HGCM82633A000001&license_plate=TAKEN&exclude_id={self.vehicle.pk}"

        response = api_client.get(f"/api/vehicles/duplicate-check/?{query}")

        assert response.data == {"conflicts": []}

    def test_requires_vin_or_license_plate(self, api_client):
        response = api_client.get("/api/vehicles/duplicate-check/")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
