import pytest
from django.db import IntegrityError

from fleet.models import Vehicle
from fleet.tests.factories import MaintenanceRecordFactory, OfficeFactory, VehicleFactory

pytestmark = pytest.mark.django_db


class TestVehicleConstraints:
    def test_vin_must_be_unique(self):
        VehicleFactory(vin="1HGCM82633A000001")
        with pytest.raises(IntegrityError):
            VehicleFactory(vin="1HGCM82633A000001")

    def test_two_active_vehicles_cannot_share_a_license_plate(self):
        VehicleFactory(license_plate="ABC-123")
        with pytest.raises(IntegrityError):
            VehicleFactory(license_plate="ABC-123")

    def test_inactive_vehicle_may_reuse_an_active_vehicles_plate(self):
        VehicleFactory(license_plate="ABC-123")
        VehicleFactory(license_plate="ABC-123", is_active=False)

        assert Vehicle.objects.filter(license_plate="ABC-123").count() == 2


def test_maintenance_cost_cannot_be_negative():
    with pytest.raises(IntegrityError):
        MaintenanceRecordFactory(cost=-1)


class TestConflictingFields:
    @pytest.fixture(autouse=True)
    def existing_vehicles(self):
        self.active = VehicleFactory(vin="1HGCM82633A000001", license_plate="ACTIVE")
        VehicleFactory(vin="1HGCM82633A000002", license_plate="RETIRED", is_active=False)

    @pytest.mark.parametrize(
        ("lookup", "expected_conflicts"),
        [
            ({"vin": "1HGCM82633A000001"}, ["vin"]),
            ({"vin": "1HGCM82633A000002"}, ["vin"]),
            ({"license_plate": "ACTIVE"}, ["license_plate"]),
            ({"license_plate": "RETIRED"}, []),
            ({"vin": "1HGCM82633A000001", "license_plate": "ACTIVE"}, ["vin", "license_plate"]),
            ({"vin": "1HGCM82633A999999", "license_plate": "FREE"}, []),
        ],
    )
    def test_reports_taken_fields(self, lookup, expected_conflicts):
        assert Vehicle.objects.conflicting_fields(**lookup) == expected_conflicts

    def test_excluded_vehicle_does_not_conflict_with_itself(self):
        conflicts = Vehicle.objects.conflicting_fields(
            vin="1HGCM82633A000001", license_plate="ACTIVE", exclude_id=self.active.pk
        )

        assert conflicts == []


def test_assign_to_office_writes_only_the_office():
    vehicle = VehicleFactory(make="Ford")
    new_office = OfficeFactory()
    vehicle.make = "Unsaved change"

    vehicle.assign_to_office(new_office)

    vehicle.refresh_from_db()
    assert vehicle.office == new_office
    assert vehicle.make == "Ford"
