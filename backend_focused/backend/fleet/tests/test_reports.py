from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework import status

from fleet.models import Mechanic, Office, Vehicle
from fleet.tests.factories import (
    MaintenanceRecordFactory,
    MechanicFactory,
    OfficeFactory,
    VehicleFactory,
)

pytestmark = pytest.mark.django_db

TODAY = date(2026, 6, 30)


def days_ago(days: int) -> date:
    return TODAY - timedelta(days=days)


class TestOfficeSummary:
    def summary_for(self, office: Office) -> Office:
        return Office.objects.with_summary(today=TODAY).get(pk=office.pk)

    def test_totals_are_not_inflated_by_multiple_vehicles_and_records(self):
        office = OfficeFactory()
        for _ in range(2):
            vehicle = VehicleFactory(office=office)
            for cost in (10, 20, 30):
                MaintenanceRecordFactory(vehicle=vehicle, cost=cost, maintenance_date=days_ago(5))

        summary = self.summary_for(office)

        assert summary.active_vehicle_count == 2
        assert summary.maintenance_cost_last_year == Decimal("120.00")

    def test_cost_window_covers_the_last_365_days(self):
        vehicle = VehicleFactory()
        MaintenanceRecordFactory(vehicle=vehicle, cost=1, maintenance_date=days_ago(364))
        MaintenanceRecordFactory(vehicle=vehicle, cost=1000, maintenance_date=days_ago(365))

        assert self.summary_for(vehicle.office).maintenance_cost_last_year == Decimal("1.00")

    def test_inactive_vehicles_count_toward_cost_and_last_maintenance_only(self):
        office = OfficeFactory()
        VehicleFactory(office=office)
        retired = VehicleFactory(office=office, is_active=False)
        MaintenanceRecordFactory(vehicle=retired, cost=50, maintenance_date=days_ago(2))

        summary = self.summary_for(office)

        assert summary.active_vehicle_count == 1
        assert summary.maintenance_cost_last_year == Decimal("50.00")
        assert summary.last_maintenance == days_ago(2)

    def test_office_without_vehicles_has_zero_totals(self):
        summary = self.summary_for(OfficeFactory())

        assert summary.active_vehicle_count == 0
        assert summary.maintenance_cost_last_year == Decimal("0")
        assert summary.last_maintenance is None

    def test_endpoint_returns_readme_fields_in_a_single_query(
        self, api_client, django_assert_num_queries
    ):
        MaintenanceRecordFactory.create_batch(3)

        with django_assert_num_queries(1):
            response = api_client.get("/api/offices/summary/")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3
        assert set(response.data[0]) == {
            "id",
            "name",
            "city",
            "active_vehicle_count",
            "maintenance_cost_last_year",
            "last_maintenance",
        }


class TestMechanicWorkload:
    def test_counts_only_records_inside_the_year(self):
        mechanic = MechanicFactory()
        for maintenance_date in [date(2025, 12, 31), date(2026, 1, 1), date(2026, 12, 31)]:
            MaintenanceRecordFactory(mechanic=mechanic, maintenance_date=maintenance_date, cost=10)

        workload = Mechanic.objects.with_workload(year=2026).get(pk=mechanic.pk)

        assert workload.maintenance_record_count == 2
        assert workload.total_maintenance_cost == Decimal("20.00")

    def test_orders_busiest_first_then_by_cost_then_name(self):
        in_year = date(2026, 3, 1)
        busiest = MechanicFactory(name="Zed")
        MaintenanceRecordFactory.create_batch(3, mechanic=busiest, maintenance_date=in_year)
        cheaper = MechanicFactory(name="Amy")
        MaintenanceRecordFactory.create_batch(
            2, mechanic=cheaper, cost=10, maintenance_date=in_year
        )
        pricier = MechanicFactory(name="Bea")
        MaintenanceRecordFactory.create_batch(
            2, mechanic=pricier, cost=99, maintenance_date=in_year
        )
        idle_b, idle_a = MechanicFactory(name="Idle B"), MechanicFactory(name="Idle A")

        ranking = list(Mechanic.objects.with_workload(year=2026))

        assert ranking == [busiest, pricier, cheaper, idle_a, idle_b]
        assert ranking[-1].maintenance_record_count == 0
        assert ranking[-1].total_maintenance_cost == Decimal("0")

    def test_endpoint_defaults_to_current_year(self, api_client):
        MaintenanceRecordFactory(maintenance_date=timezone.localdate())

        response = api_client.get("/api/mechanics/workload/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data[0]["maintenance_record_count"] == 1

    @pytest.mark.parametrize("year", ["abc", "1800", str(timezone.localdate().year + 1)])
    def test_endpoint_rejects_invalid_year(self, api_client, year):
        response = api_client.get(f"/api/mechanics/workload/?year={year}")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "year" in response.data


class TestVehiclesNeedingMaintenance:
    def test_lists_never_serviced_first_then_oldest_service(self):
        never_serviced = VehicleFactory()
        stale = VehicleFactory()
        MaintenanceRecordFactory(vehicle=stale, maintenance_date=days_ago(366))
        stalest = VehicleFactory()
        MaintenanceRecordFactory(vehicle=stalest, maintenance_date=days_ago(900))

        vehicles = list(Vehicle.objects.needing_maintenance(today=TODAY))

        assert vehicles == [never_serviced, stalest, stale]
        assert vehicles[0].last_maintenance_date is None
        assert vehicles[1].last_maintenance_date == days_ago(900)

    def test_excludes_recently_serviced_boundary_and_inactive_vehicles(self):
        exactly_365_days = VehicleFactory()
        MaintenanceRecordFactory(vehicle=exactly_365_days, maintenance_date=days_ago(365))
        old_and_recent = VehicleFactory()
        MaintenanceRecordFactory(vehicle=old_and_recent, maintenance_date=days_ago(900))
        MaintenanceRecordFactory(vehicle=old_and_recent, maintenance_date=days_ago(10))
        VehicleFactory(is_active=False)

        assert list(Vehicle.objects.needing_maintenance(today=TODAY)) == []

    def test_endpoint_is_paginated_with_last_maintenance_date(self, api_client):
        VehicleFactory()

        response = api_client.get("/api/vehicles/needing-maintenance/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["last_maintenance_date"] is None
