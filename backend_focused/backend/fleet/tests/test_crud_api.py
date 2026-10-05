from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status

from fleet.models import Vehicle
from fleet.tests.factories import (
    MaintenanceRecordFactory,
    MechanicFactory,
    OfficeFactory,
    VehicleFactory,
)

pytestmark = pytest.mark.django_db


@pytest.fixture
def office():
    return OfficeFactory()


@pytest.fixture
def vehicle_payload(office):
    return {
        "vin": "1HGCM82633A004352",
        "license_plate": "ABC-123",
        "make": "Honda",
        "model": "Civic",
        "year": 2020,
        "office": office.pk,
    }


class TestVehicleEndpoints:
    def test_create_normalizes_vin_and_license_plate(self, api_client, vehicle_payload):
        vehicle_payload.update(vin=" 1hgcm82633a004352 ", license_plate="abc-123")

        response = api_client.post("/api/vehicles/", vehicle_payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["vin"] == "1HGCM82633A004352"
        assert response.data["license_plate"] == "ABC-123"

    def test_create_rejects_invalid_vin_and_future_year(self, api_client, vehicle_payload):
        vehicle_payload.update(vin="IOQ", year=timezone.localdate().year + 2)

        response = api_client.post("/api/vehicles/", vehicle_payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert set(response.data) == {"vin", "year"}

    def test_create_rejects_plate_of_another_active_vehicle(self, api_client, vehicle_payload):
        VehicleFactory(license_plate="ABC-123")

        response = api_client.post("/api/vehicles/", vehicle_payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["license_plate"] == [
            "An active vehicle with this license plate already exists."
        ]

    def test_create_allows_inactive_vehicle_with_a_taken_plate(self, api_client, vehicle_payload):
        VehicleFactory(license_plate="ABC-123")
        vehicle_payload["is_active"] = False

        response = api_client.post("/api/vehicles/", vehicle_payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED

    def test_reactivating_a_vehicle_whose_plate_was_reissued_is_rejected(self, api_client):
        VehicleFactory(license_plate="ABC-123")
        retired = VehicleFactory(license_plate="ABC-123", is_active=False)

        response = api_client.patch(
            f"/api/vehicles/{retired.pk}/", {"is_active": True}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "license_plate" in response.data

    def test_update_cannot_change_office(self, api_client):
        vehicle = VehicleFactory()
        original_office = vehicle.office

        response = api_client.patch(
            f"/api/vehicles/{vehicle.pk}/", {"office": OfficeFactory().pk}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        vehicle.refresh_from_db()
        assert vehicle.office == original_office

    def test_delete_vehicle_removes_its_maintenance_records(self, api_client):
        record = MaintenanceRecordFactory()

        response = api_client.delete(f"/api/vehicles/{record.vehicle_id}/")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Vehicle.objects.filter(pk=record.vehicle_id).exists()


class TestMaintenanceRecordEndpoints:
    @pytest.fixture
    def record_payload(self):
        return {
            "vehicle": VehicleFactory().pk,
            "mechanic": MechanicFactory().pk,
            "maintenance_date": str(timezone.localdate()),
            "maintenance_type": "oil_change",
            "cost": "99.90",
        }

    def test_create_returns_cost_as_a_number(self, api_client, record_payload):
        response = api_client.post("/api/maintenance-records/", record_payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["cost"] == 99.9

    def test_create_rejects_future_date_and_negative_cost(self, api_client, record_payload):
        tomorrow = timezone.localdate() + timedelta(days=1)
        record_payload.update(maintenance_date=str(tomorrow), cost="-1")

        response = api_client.post("/api/maintenance-records/", record_payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert set(response.data) == {"maintenance_date", "cost"}

    def test_inactive_mechanic_cannot_take_new_work(self, api_client, record_payload):
        record_payload["mechanic"] = MechanicFactory(is_active=False).pk

        response = api_client.post("/api/maintenance-records/", record_payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "mechanic" in response.data

    def test_existing_record_of_now_inactive_mechanic_stays_editable(self, api_client):
        record = MaintenanceRecordFactory(mechanic=MechanicFactory(is_active=False))

        response = api_client.patch(
            f"/api/maintenance-records/{record.pk}/",
            {"mechanic": record.mechanic_id, "notes": "Updated"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK

    def test_filtering_by_unknown_vehicle_returns_empty_page(self, api_client):
        MaintenanceRecordFactory()

        response = api_client.get("/api/maintenance-records/?vehicle=999999")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 0


class TestOfficeAndMechanicEndpoints:
    def test_duplicate_office_has_a_readable_message(self, api_client):
        OfficeFactory(name="HQ", city="Boston")

        response = api_client.post("/api/offices/", {"name": "HQ", "city": "Boston"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["non_field_errors"] == [
            "An office with this name already exists in this city."
        ]

    def test_deleting_office_with_vehicles_is_a_conflict(self, api_client):
        office = OfficeFactory()
        VehicleFactory.create_batch(2, office=office)

        response = api_client.delete(f"/api/offices/{office.pk}/")

        assert response.status_code == status.HTTP_409_CONFLICT
        assert response.data["detail"] == (
            "Cannot delete this office: it is still referenced by 2 vehicles."
        )

    def test_deleting_mechanic_with_records_is_a_conflict(self, api_client):
        record = MaintenanceRecordFactory()

        response = api_client.delete(f"/api/mechanics/{record.mechanic_id}/")

        assert response.status_code == status.HTTP_409_CONFLICT
