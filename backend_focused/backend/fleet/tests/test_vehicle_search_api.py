from datetime import date

import pytest
from rest_framework import status

from fleet.tests.factories import (
    MaintenanceRecordFactory,
    MechanicFactory,
    OfficeFactory,
    VehicleFactory,
)

pytestmark = pytest.mark.django_db


@pytest.fixture
def fleet():
    """Two offices, three vehicles and two mechanics with known maintenance history."""
    north, south = OfficeFactory(), OfficeFactory()
    ann = MechanicFactory(certification_number="CERT-ANN")
    bob = MechanicFactory(certification_number="CERT-BOB")
    civic = VehicleFactory(license_plate="CIVIC", make="Honda", model="Civic", office=north)
    accord = VehicleFactory(
        license_plate="ACCORD", make="Honda", model="Accord", office=south, is_active=False
    )
    transit = VehicleFactory(license_plate="TRANSIT", make="Ford", model="Transit", office=north)
    MaintenanceRecordFactory(vehicle=civic, mechanic=ann, maintenance_date=date(2026, 1, 10))
    MaintenanceRecordFactory(vehicle=civic, mechanic=bob, maintenance_date=date(2025, 3, 1))
    MaintenanceRecordFactory(vehicle=accord, mechanic=bob, maintenance_date=date(2026, 2, 1))
    return {"north": north, "south": south, "transit": transit}


def search(api_client, query: str) -> list[str]:
    response = api_client.get(f"/api/vehicles/?{query}")
    assert response.status_code == status.HTTP_200_OK
    return sorted(vehicle["license_plate"] for vehicle in response.data["results"])


@pytest.mark.parametrize(
    ("query", "expected_plates"),
    [
        ("", ["ACCORD", "CIVIC", "TRANSIT"]),
        ("make=hONDA", ["ACCORD", "CIVIC"]),
        ("model=civic", ["CIVIC"]),
        ("is_active=false", ["ACCORD"]),
        ("maintenance_date_from=2026-01-01", ["ACCORD", "CIVIC"]),
        ("maintenance_date_to=2025-12-31", ["CIVIC"]),
        ("mechanic_certification=cert-bob", ["ACCORD", "CIVIC"]),
        ("make=Honda&is_active=true&mechanic_certification=CERT-ANN", ["CIVIC"]),
        ("office=999999", []),
    ],
)
def test_filters(api_client, fleet, query, expected_plates):
    assert search(api_client, query) == expected_plates


def test_office_filter_combines_with_active_flag(api_client, fleet):
    query = f"office={fleet['north'].pk}&is_active=true"

    assert search(api_client, query) == ["CIVIC", "TRANSIT"]


def test_maintenance_filters_must_match_the_same_record(api_client, fleet):
    # Civic was serviced by Ann in 2026 and by Bob in 2025, but never by Ann in 2025.
    query = "mechanic_certification=CERT-ANN&maintenance_date_to=2025-12-31"

    assert search(api_client, query) == []


def test_vehicle_with_many_matching_records_is_listed_once(api_client, fleet):
    MaintenanceRecordFactory.create_batch(
        5, vehicle=fleet["transit"], maintenance_date=date(2026, 3, 1)
    )

    assert search(api_client, "maintenance_date_from=2026-03-01") == ["TRANSIT"]


@pytest.mark.parametrize(
    ("query", "invalid_parameter"),
    [
        ("maintenance_date_from=2026-02-01&maintenance_date_to=2026-01-01", "maintenance_date_to"),
        ("maintenance_date_from=not-a-date", "maintenance_date_from"),
    ],
)
def test_invalid_date_filters_are_rejected(api_client, query, invalid_parameter):
    response = api_client.get(f"/api/vehicles/?{query}")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert invalid_parameter in response.data


def test_ordering_breaks_ties_by_id(api_client):
    vehicles = VehicleFactory.create_batch(3, make="Ford")

    response = api_client.get("/api/vehicles/?ordering=make")

    assert [vehicle["id"] for vehicle in response.data["results"]] == [v.pk for v in vehicles]


@pytest.mark.parametrize(
    "url", ["/api/vehicles/?page_size=20", "/api/vehicles/needing-maintenance/?page_size=20"]
)
def test_lists_include_office_name_without_extra_queries(
    api_client, django_assert_num_queries, url
):
    VehicleFactory.create_batch(5)  # each vehicle in its own office

    with django_assert_num_queries(2):  # count + page
        response = api_client.get(url)

    assert len(response.data["results"]) == 5
    assert all(vehicle["office_name"] for vehicle in response.data["results"])
