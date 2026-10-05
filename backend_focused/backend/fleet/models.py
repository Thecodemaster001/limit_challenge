from decimal import Decimal

from django.core.validators import MinValueValidator, RegexValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone

MIN_VEHICLE_YEAR = 1900

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


class Office(TimestampedModel):
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=255)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["name", "city"], name="office_name_city_unique"),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.city})"


class Vehicle(TimestampedModel):
    vin = models.CharField("VIN", max_length=17, unique=True, validators=[validate_vin])
    license_plate = models.CharField(max_length=20)
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveSmallIntegerField(validators=[MinValueValidator(MIN_VEHICLE_YEAR)])
    office = models.ForeignKey(Office, on_delete=models.PROTECT, related_name="vehicles")
    is_active = models.BooleanField(default=True)

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
            models.Index(fields=["make", "model"], name="vehicle_make_model_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.year} {self.make} {self.model} ({self.license_plate})"


class Mechanic(TimestampedModel):
    name = models.CharField(max_length=255)
    certification_number = models.CharField(max_length=50, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.certification_number})"


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
