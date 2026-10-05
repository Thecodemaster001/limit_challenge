import random
from collections.abc import Callable
from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from django.core.management.base import BaseCommand, CommandError, CommandParser
from django.db import transaction
from django.utils import timezone
from faker import Faker

from fleet.models import MAINTENANCE_DUE_AFTER, MaintenanceRecord, Mechanic, Office, Vehicle

VEHICLE_MODELS_BY_MAKE = {
    "Ford": ["Transit", "F-150", "Focus", "Ranger"],
    "Toyota": ["Corolla", "Camry", "Hilux", "RAV4"],
    "Honda": ["Civic", "Accord", "CR-V"],
    "Chevrolet": ["Silverado", "Express", "Malibu"],
    "Nissan": ["NV200", "Altima", "Frontier"],
    "Mercedes-Benz": ["Sprinter", "Vito"],
}
OFFICE_NAME_SUFFIXES = ["Depot", "Hub", "Yard", "Branch"]
VIN_CHARACTERS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789"
COST_RANGE_BY_MAINTENANCE_TYPE = {
    MaintenanceRecord.MaintenanceType.OIL_CHANGE: (40, 120),
    MaintenanceRecord.MaintenanceType.TIRE_ROTATION: (30, 90),
    MaintenanceRecord.MaintenanceType.BRAKE_SERVICE: (150, 600),
    MaintenanceRecord.MaintenanceType.INSPECTION: (50, 150),
    MaintenanceRecord.MaintenanceType.ENGINE_REPAIR: (500, 4000),
    MaintenanceRecord.MaintenanceType.TRANSMISSION_SERVICE: (200, 2500),
    MaintenanceRecord.MaintenanceType.BATTERY: (100, 300),
    MaintenanceRecord.MaintenanceType.OTHER: (20, 500),
}

HISTORY_SPAN_DAYS = 3 * 365
HEAVY_HISTORY_RECORD_COUNT = 500
INACTIVE_SHARE = 0.1
NEVER_SERVICED_SHARE = 0.1
OVERDUE_SHARE = 0.1
NOTES_SHARE = 0.3
BULK_BATCH_SIZE = 1000


class Command(BaseCommand):
    help = "Fill the database with realistic dummy fleet data for manual testing."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--offices", type=int, default=8)
        parser.add_argument("--mechanics", type=int, default=20)
        parser.add_argument("--vehicles", type=int, default=150)
        parser.add_argument(
            "--records",
            type=int,
            default=2000,
            help="Maintenance records spread across regular vehicles, on top of the "
            f"{HEAVY_HISTORY_RECORD_COUNT} records of the vehicle with a long history.",
        )
        parser.add_argument("--seed", type=int, default=42, help="Seed for reproducible data.")
        parser.add_argument(
            "--clear", action="store_true", help="Delete existing fleet data before seeding."
        )

    def handle(self, *args: Any, **options: Any) -> None:
        if options["offices"] < 1 or options["mechanics"] < 2 or options["vehicles"] < 10:
            raise CommandError("Use at least 1 office, 2 mechanics and 10 vehicles.")

        self.random = random.Random(options["seed"])
        self.fake = Faker()
        self.fake.seed_instance(options["seed"])
        self.today = timezone.localdate()

        with transaction.atomic():
            if options["clear"]:
                self._clear_fleet_data()
            elif Office.objects.exists() or Mechanic.objects.exists():
                raise CommandError("Fleet data already exists. Re-run with --clear to replace it.")

            offices = self._create_offices(options["offices"])
            mechanics = self._create_mechanics(options["mechanics"])
            vehicles = self._create_vehicles(options["vehicles"], offices)
            record_count = self._create_maintenance_records(vehicles, mechanics, options["records"])

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {len(offices)} offices, {len(mechanics)} mechanics, "
                f"{len(vehicles)} vehicles and {record_count} maintenance records."
            )
        )

    def _clear_fleet_data(self) -> None:
        MaintenanceRecord.objects.all().delete()
        Vehicle.objects.all().delete()
        Mechanic.objects.all().delete()
        Office.objects.all().delete()

    def _create_offices(self, count: int) -> list[Office]:
        offices = []
        for _ in range(count):
            city = self.fake.unique.city()
            name = f"{city} {self.random.choice(OFFICE_NAME_SUFFIXES)}"
            offices.append(Office(name=name, city=city))
        return Office.objects.bulk_create(offices)

    def _create_mechanics(self, count: int) -> list[Mechanic]:
        mechanics = [
            Mechanic(
                name=self.fake.name(),
                certification_number=f"MC-{self.fake.unique.random_number(digits=6, fix_len=True)}",
            )
            for _ in range(count)
        ]
        mechanics[-1].is_active = False
        return Mechanic.objects.bulk_create(mechanics)

    def _create_vehicles(self, count: int, offices: list[Office]) -> list[Vehicle]:
        vins: set[str] = set()
        license_plates: set[str] = set()
        vehicles = []
        for index in range(count):
            make = self.random.choice(list(VEHICLE_MODELS_BY_MAKE))
            vehicles.append(
                Vehicle(
                    vin=self._unique_value(self._random_vin, vins),
                    license_plate=self._unique_value(self._random_license_plate, license_plates),
                    make=make,
                    model=self.random.choice(VEHICLE_MODELS_BY_MAKE[make]),
                    year=self.random.randint(2010, self.today.year),
                    office=offices[index % len(offices)],
                    is_active=self.random.random() >= INACTIVE_SHARE,
                )
            )

        retired_vehicle, active_vehicle = vehicles[-1], vehicles[1]
        retired_vehicle.is_active = False
        retired_vehicle.license_plate = active_vehicle.license_plate
        active_vehicle.is_active = True
        return Vehicle.objects.bulk_create(vehicles)

    def _create_maintenance_records(
        self, vehicles: list[Vehicle], mechanics: list[Mechanic], record_count: int
    ) -> int:
        active_mechanics = [mechanic for mechanic in mechanics if mechanic.is_active]
        inactive_mechanics = [mechanic for mechanic in mechanics if not mechanic.is_active]
        overdue_after_days = MAINTENANCE_DUE_AFTER.days + 1

        # Edge cases use active vehicles so they show up in the needing-maintenance report.
        heavy_history_vehicle, *other_active_vehicles = [v for v in vehicles if v.is_active]
        never_serviced_count = max(1, int(len(vehicles) * NEVER_SERVICED_SHARE))
        overdue_count = max(1, int(len(vehicles) * OVERDUE_SHARE))
        overdue_end = never_serviced_count + overdue_count
        overdue_vehicles = other_active_vehicles[never_serviced_count:overdue_end]
        regular_vehicles = other_active_vehicles[overdue_end:] + [
            vehicle for vehicle in vehicles if not vehicle.is_active
        ]

        records = [
            self._build_record(heavy_history_vehicle, active_mechanics, 0, HISTORY_SPAN_DAYS)
            for _ in range(HEAVY_HISTORY_RECORD_COUNT)
        ]
        for vehicle in overdue_vehicles:
            records.extend(
                self._build_record(vehicle, mechanics, overdue_after_days, HISTORY_SPAN_DAYS)
                for _ in range(self.random.randint(1, 3))
            )
        for _ in range(record_count):
            records.append(
                self._build_record(
                    self.random.choice(regular_vehicles), active_mechanics, 0, HISTORY_SPAN_DAYS
                )
            )
        records.extend(
            self._build_record(self.random.choice(regular_vehicles), [mechanic], 400, 900)
            for mechanic in inactive_mechanics
            for _ in range(5)
        )

        MaintenanceRecord.objects.bulk_create(records, batch_size=BULK_BATCH_SIZE)
        return len(records)

    def _build_record(
        self,
        vehicle: Vehicle,
        mechanics: list[Mechanic],
        min_days_ago: int,
        max_days_ago: int,
    ) -> MaintenanceRecord:
        maintenance_type = self.random.choice(list(COST_RANGE_BY_MAINTENANCE_TYPE))
        min_cost, max_cost = COST_RANGE_BY_MAINTENANCE_TYPE[maintenance_type]
        return MaintenanceRecord(
            vehicle=vehicle,
            mechanic=self.random.choice(mechanics),
            maintenance_date=self._random_past_date(min_days_ago, max_days_ago),
            maintenance_type=maintenance_type,
            cost=Decimal(self.random.randint(min_cost * 100, max_cost * 100)) / 100,
            notes=self.fake.sentence() if self.random.random() < NOTES_SHARE else "",
        )

    def _random_past_date(self, min_days_ago: int, max_days_ago: int) -> date:
        return self.today - timedelta(days=self.random.randint(min_days_ago, max_days_ago))

    def _random_vin(self) -> str:
        return "".join(self.random.choices(VIN_CHARACTERS, k=17))

    def _random_license_plate(self) -> str:
        letters = "".join(self.random.choices("ABCDEFGHJKLMNPRSTUVWXYZ", k=3))
        return f"{letters}-{self.random.randint(1000, 9999)}"

    @staticmethod
    def _unique_value(generate: Callable[[], str], taken: set[str]) -> str:
        value = generate()
        while value in taken:
            value = generate()
        taken.add(value)
        return value
