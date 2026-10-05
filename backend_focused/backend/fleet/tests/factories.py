from decimal import Decimal

import factory
from django.utils import timezone
from factory.django import DjangoModelFactory

from fleet.models import MaintenanceRecord, Mechanic, Office, Vehicle


class OfficeFactory(DjangoModelFactory):
    class Meta:
        model = Office

    name = factory.Sequence(lambda number: f"Office {number}")
    city = factory.Faker("city")


class VehicleFactory(DjangoModelFactory):
    class Meta:
        model = Vehicle

    vin = factory.Sequence(lambda number: f"1HGCM82633A{number:06d}")
    license_plate = factory.Sequence(lambda number: f"PLT-{number:04d}")
    make = "Ford"
    model = "Transit"
    year = 2020
    office = factory.SubFactory(OfficeFactory)
    is_active = True


class MechanicFactory(DjangoModelFactory):
    class Meta:
        model = Mechanic

    name = factory.Faker("name")
    certification_number = factory.Sequence(lambda number: f"CERT-{number:05d}")
    is_active = True


class MaintenanceRecordFactory(DjangoModelFactory):
    class Meta:
        model = MaintenanceRecord

    vehicle = factory.SubFactory(VehicleFactory)
    mechanic = factory.SubFactory(MechanicFactory)
    maintenance_date = factory.LazyFunction(timezone.localdate)
    maintenance_type = MaintenanceRecord.MaintenanceType.OIL_CHANGE
    cost = Decimal("100.00")
    notes = ""
