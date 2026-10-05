from datetime import date

import pytest
from rest_framework import status

from fleet.tests.factories import MaintenanceRecordFactory, VehicleFactory

pytestmark = pytest.mark.django_db


class TestVehicleDetail:
    def test_includes_office_and_full_history_with_mechanics_newest_first(self, api_client):
        vehicle = VehicleFactory()
        older = MaintenanceRecordFactory(vehicle=vehicle, maintenance_date=date(2025, 1, 1))
        newer = MaintenanceRecordFactory(vehicle=vehicle, maintenance_date=date(2026, 1, 1))

        response = api_client.get(f"/api/vehicles/{vehicle.pk}/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["office"]["name"] == vehicle.office.name
        assert [record["id"] for record in response.data["maintenance_records"]] == [
            newer.pk,
            older.pk,
        ]
        assert response.data["maintenance_records"][0]["mechanic"]["name"] == newer.mechanic.name

    @pytest.mark.parametrize("record_count", [1, 300])
    def test_query_count_does_not_grow_with_history(
        self, api_client, django_assert_num_queries, record_count
    ):
        vehicle = VehicleFactory()
        MaintenanceRecordFactory.create_batch(record_count, vehicle=vehicle)  # one mechanic each

        with django_assert_num_queries(2):
            response = api_client.get(f"/api/vehicles/{vehicle.pk}/")

        assert len(response.data["maintenance_records"]) == record_count


class TestMaintenanceHistory:
    def test_is_paginated_newest_first(self, api_client):
        vehicle = VehicleFactory()
        for maintenance_date in [date(2025, 1, 1), date(2026, 1, 1), date(2025, 6, 1)]:
            MaintenanceRecordFactory(vehicle=vehicle, maintenance_date=maintenance_date)
        MaintenanceRecordFactory()  # another vehicle's record must not appear

        response = api_client.get(f"/api/vehicles/{vehicle.pk}/maintenance-history/?page_size=2")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 3
        assert [record["maintenance_date"] for record in response.data["results"]] == [
            "2026-01-01",
            "2025-06-01",
        ]
        assert response.data["next"] is not None

    def test_unknown_vehicle_returns_404(self, api_client):
        response = api_client.get("/api/vehicles/999999/maintenance-history/")

        assert response.status_code == status.HTTP_404_NOT_FOUND
