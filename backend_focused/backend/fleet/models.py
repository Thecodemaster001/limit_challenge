from datetime import date, timedelta
from decimal import Decimal

from django.core.validators import MinValueValidator, RegexValidator
from django.db import models
from django.db.models import (
    Count,
    F,
    FilteredRelation,
    Max,
    OuterRef,
    Prefetch,
    Q,
    Subquery,
    Sum,
    Value,
)
from django.db.models.functions import Coalesce, Upper
from django.utils import timezone

MIN_VEHICLE_YEAR = 1900
COST_REPORTING_PERIOD = timedelta(days=365)
MAINTENANCE_DUE_AFTER = timedelta(days=365)

# 17 characters; I, O and Q are never used in VINs to avoid confusion with 1 and 0.
validate_vin = RegexValidator(
    regex=r"^[A-HJ-NPR-Z0-9]{17}$",
    message="VIN must be 17 characters (letters and digits, excluding I, O and Q).",
)


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


def money_field() -> models.DecimalField:
    return models.DecimalField(max_digits=14, decimal_places=2)


class OfficeQuerySet(models.QuerySet):
    def with_summary(self, today: date) -> "OfficeQuerySet":
        """Annotate fleet statistics using one subquery each, so joins cannot inflate totals."""
        office_vehicles = Vehicle.objects.filter(office=OuterRef("pk")).order_by()
        office_records = MaintenanceRecord.objects.filter(vehicle__office=OuterRef("pk")).order_by()
        active_vehicle_count = (
            office_vehicles.filter(is_active=True)
            .values("office")
            .annotate(count=Count("pk"))
            .values("count")
        )
        maintenance_cost_last_year = (
            office_records.filter(maintenance_date__gt=today - COST_REPORTING_PERIOD)
            .values("vehicle__office")
            .annotate(total=Sum("cost"))
            .values("total")
        )
        last_maintenance = (
            office_records.values("vehicle__office")
            .annotate(latest=Max("maintenance_date"))
            .values("latest")
        )
        return self.annotate(
            active_vehicle_count=Coalesce(Subquery(active_vehicle_count), 0),
            maintenance_cost_last_year=Coalesce(
                Subquery(maintenance_cost_last_year),
                Value(Decimal("0")),
                output_field=money_field(),
            ),
            last_maintenance=Subquery(last_maintenance),
        )


class Office(TimestampedModel):
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=255)

    objects = OfficeQuerySet.as_manager()

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["name", "city"], name="office_name_city_unique"),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.city})"


class VehicleQuerySet(models.QuerySet):
    def with_maintenance_history(self) -> "VehicleQuerySet":
        """Load the office and every maintenance record with its mechanic in two queries."""
        maintenance_records = MaintenanceRecord.objects.select_related("mechanic").newest_first()
        return self.select_related("office").prefetch_related(
            Prefetch("maintenance_records", queryset=maintenance_records)
        )

    def with_last_maintenance_date(self) -> "VehicleQuerySet":
        return self.annotate(last_maintenance_date=Max("maintenance_records__maintenance_date"))

    def needing_maintenance(self, today: date) -> "VehicleQuerySet":
        """Active vehicles never serviced or last serviced too long ago, oldest service first."""
        return (
            self.filter(is_active=True)
            .with_last_maintenance_date()
            .filter(
                Q(last_maintenance_date__isnull=True)
                | Q(last_maintenance_date__lt=today - MAINTENANCE_DUE_AFTER)
            )
            .order_by(F("last_maintenance_date").asc(nulls_first=True), "pk")
        )


class Vehicle(TimestampedModel):
    vin = models.CharField("VIN", max_length=17, unique=True, validators=[validate_vin])
    license_plate = models.CharField(max_length=20)
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveSmallIntegerField(validators=[MinValueValidator(MIN_VEHICLE_YEAR)])
    office = models.ForeignKey(Office, on_delete=models.PROTECT, related_name="vehicles")
    is_active = models.BooleanField(default=True)

    objects = VehicleQuerySet.as_manager()

    class Meta:
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(
                fields=["license_plate"],
                condition=Q(is_active=True),
                name="vehicle_active_license_plate_unique",
                violation_error_message="An active vehicle with this license plate already exists.",
            ),
            models.CheckConstraint(
                condition=Q(year__gte=MIN_VEHICLE_YEAR),
                name="vehicle_year_min",
            ),
        ]
        indexes = [
            models.Index(Upper("make"), Upper("model"), name="vehicle_upper_make_model_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.year} {self.make} {self.model} ({self.license_plate})"


class MechanicQuerySet(models.QuerySet):
    def with_workload(self, year: int) -> "MechanicQuerySet":
        """Annotate work done during `year`, busiest first. Mechanics without work count as 0."""
        records_in_year = FilteredRelation(
            "maintenance_records",
            condition=Q(
                maintenance_records__maintenance_date__gte=date(year, 1, 1),
                maintenance_records__maintenance_date__lt=date(year + 1, 1, 1),
            ),
        )
        return (
            self.annotate(records_in_year=records_in_year)
            .annotate(
                maintenance_record_count=Count("records_in_year"),
                total_maintenance_cost=Coalesce(
                    Sum("records_in_year__cost"),
                    Value(Decimal("0")),
                    output_field=money_field(),
                ),
            )
            .order_by("-maintenance_record_count", "-total_maintenance_cost", "name", "pk")
        )


class Mechanic(TimestampedModel):
    name = models.CharField(max_length=255)
    certification_number = models.CharField(max_length=50, unique=True)
    is_active = models.BooleanField(default=True)

    objects = MechanicQuerySet.as_manager()

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.certification_number})"


class MaintenanceRecordQuerySet(models.QuerySet):
    def newest_first(self) -> "MaintenanceRecordQuerySet":
        return self.order_by("-maintenance_date", "-id")


class MaintenanceRecord(TimestampedModel):
    class MaintenanceType(models.TextChoices):
        OIL_CHANGE = "oil_change", "Oil change"
        TIRE_ROTATION = "tire_rotation", "Tire rotation"
        BRAKE_SERVICE = "brake_service", "Brake service"
        INSPECTION = "inspection", "Inspection"
        ENGINE_REPAIR = "engine_repair", "Engine repair"
        TRANSMISSION_SERVICE = "transmission_service", "Transmission service"
        BATTERY = "battery", "Battery"
        OTHER = "other", "Other"

    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name="maintenance_records",
        db_index=False,
    )
    mechanic = models.ForeignKey(
        Mechanic,
        on_delete=models.PROTECT,
        related_name="maintenance_records",
        db_index=False,
    )
    maintenance_date = models.DateField()
    maintenance_type = models.CharField(max_length=32, choices=MaintenanceType.choices)
    cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
    )
    notes = models.TextField(blank=True)

    objects = MaintenanceRecordQuerySet.as_manager()

    class Meta:
        ordering = ["-maintenance_date", "-id"]
        constraints = [
            models.CheckConstraint(condition=Q(cost__gte=0), name="maintenance_cost_non_negative"),
        ]
        indexes = [
            models.Index(
                fields=["vehicle", "-maintenance_date"], name="maintenance_vehicle_date_idx"
            ),
            models.Index(
                fields=["mechanic", "maintenance_date"], name="maintenance_mechanic_date_idx"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.get_maintenance_type_display()} on {self.maintenance_date}"
