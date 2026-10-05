import pytest
from django.core.management import CommandError, call_command
from django.utils import timezone

from fleet.models import MaintenanceRecord, Mechanic, Office, Vehicle

pytestmark = pytest.mark.django_db

SMALL_FLEET = {"offices": 2, "mechanics": 3, "vehicles": 20, "records": 50}


def test_creates_fleet_data_with_testable_edge_cases():
    call_command("seed_fleet", **SMALL_FLEET)

    assert Office.objects.count() == 2
    assert Mechanic.objects.filter(is_active=False).exists()
    assert Vehicle.objects.count() == 20
    assert Vehicle.objects.filter(is_active=False).exists()
    assert MaintenanceRecord.objects.filter(vehicle__is_active=True).count() >= 500
    assert Vehicle.objects.needing_maintenance(today=timezone.localdate()).exists()


def test_refuses_to_seed_over_existing_data_without_clear():
    call_command("seed_fleet", **SMALL_FLEET)

    with pytest.raises(CommandError, match="--clear"):
        call_command("seed_fleet", **SMALL_FLEET)


def test_clear_replaces_existing_data():
    call_command("seed_fleet", **SMALL_FLEET)

    call_command("seed_fleet", clear=True, **SMALL_FLEET)

    assert Vehicle.objects.count() == 20
