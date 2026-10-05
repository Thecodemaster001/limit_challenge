from datetime import date
from typing import Any

from django.db import models
from django.utils import timezone
from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from fleet.models import MIN_VEHICLE_YEAR, MaintenanceRecord, Mechanic, Office, Vehicle


class UppercaseCharField(serializers.CharField):
    """CharField that stores identifiers in a canonical, upper-case form."""

    def to_internal_value(self, data: Any) -> str:
        return super().to_internal_value(data).upper()


class OfficeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Office
        fields = ["id", "name", "city"]
        validators = [
            UniqueTogetherValidator(
                queryset=Office.objects.all(),
                fields=["name", "city"],
                message="An office with this name already exists in this city.",
            )
        ]


class VehicleSerializer(serializers.ModelSerializer):
    UPPERCASE_FIELDS = ("vin", "license_plate")

    class Meta:
        model = Vehicle
        fields = ["id", "vin", "license_plate", "make", "model", "year", "office", "is_active"]
        # Plate uniqueness depends on the incoming is_active value, so it is checked in validate().
        extra_kwargs = {"license_plate": {"validators": []}}

    def build_standard_field(
        self, field_name: str, model_field: models.Field
    ) -> tuple[type[serializers.Field], dict[str, Any]]:
        field_class, field_kwargs = super().build_standard_field(field_name, model_field)
        if field_name in self.UPPERCASE_FIELDS:
            field_class = UppercaseCharField
        return field_class, field_kwargs

    def validate_year(self, year: int) -> int:
        max_year = timezone.localdate().year + 1
        if year > max_year:
            raise serializers.ValidationError(
                f"Ensure this value is less than or equal to {max_year}."
            )
        return year

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        license_plate = attrs.get("license_plate", getattr(self.instance, "license_plate", None))
        is_active = attrs.get("is_active", getattr(self.instance, "is_active", True))
        if is_active and license_plate:
            conflicting_vehicles = Vehicle.objects.filter(
                license_plate=license_plate, is_active=True
            )
            if self.instance is not None:
                conflicting_vehicles = conflicting_vehicles.exclude(pk=self.instance.pk)
            if conflicting_vehicles.exists():
                raise serializers.ValidationError(
                    {"license_plate": ["An active vehicle with this license plate already exists."]}
                )
        return attrs


class MechanicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mechanic
        fields = ["id", "name", "certification_number", "is_active"]


class MaintenanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceRecord
        fields = [
            "id",
            "vehicle",
            "mechanic",
            "maintenance_date",
            "maintenance_type",
            "cost",
            "notes",
        ]

    def validate_maintenance_date(self, maintenance_date: date) -> date:
        if maintenance_date > timezone.localdate():
            raise serializers.ValidationError("Maintenance date cannot be in the future.")
        return maintenance_date

    def validate_mechanic(self, mechanic: Mechanic) -> Mechanic:
        # Existing records may keep a now-inactive mechanic; new work needs an active one.
        is_mechanic_changing = self.instance is None or self.instance.mechanic_id != mechanic.pk
        if is_mechanic_changing and not mechanic.is_active:
            raise serializers.ValidationError(
                "Inactive mechanics cannot be assigned new maintenance."
            )
        return mechanic


class VehicleMaintenanceRecordSerializer(serializers.ModelSerializer):
    """A maintenance record shown in the context of its vehicle, with the mechanic expanded."""

    mechanic = MechanicSerializer(read_only=True)

    class Meta:
        model = MaintenanceRecord
        fields = ["id", "maintenance_date", "maintenance_type", "cost", "notes", "mechanic"]


class VehicleDetailSerializer(serializers.ModelSerializer):
    office = OfficeSerializer(read_only=True)
    maintenance_records = VehicleMaintenanceRecordSerializer(many=True, read_only=True)

    class Meta:
        model = Vehicle
        fields = [
            "id",
            "vin",
            "license_plate",
            "make",
            "model",
            "year",
            "is_active",
            "office",
            "maintenance_records",
        ]


class VehicleNeedingMaintenanceSerializer(VehicleSerializer):
    last_maintenance_date = serializers.DateField(read_only=True, allow_null=True)

    class Meta(VehicleSerializer.Meta):
        fields = [*VehicleSerializer.Meta.fields, "last_maintenance_date"]


class OfficeSummarySerializer(serializers.ModelSerializer):
    active_vehicle_count = serializers.IntegerField(read_only=True)
    maintenance_cost_last_year = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )
    last_maintenance = serializers.DateField(read_only=True, allow_null=True)

    class Meta:
        model = Office
        fields = [
            "id",
            "name",
            "city",
            "active_vehicle_count",
            "maintenance_cost_last_year",
            "last_maintenance",
        ]


class MechanicWorkloadSerializer(serializers.ModelSerializer):
    maintenance_record_count = serializers.IntegerField(read_only=True)
    total_maintenance_cost = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )

    class Meta:
        model = Mechanic
        fields = [
            "id",
            "name",
            "certification_number",
            "maintenance_record_count",
            "total_maintenance_cost",
        ]


class MechanicWorkloadQuerySerializer(serializers.Serializer):
    year = serializers.IntegerField(
        required=False,
        min_value=MIN_VEHICLE_YEAR,
        help_text="Calendar year to report on. Defaults to the current year.",
    )

    def validate_year(self, year: int) -> int:
        current_year = timezone.localdate().year
        if year > current_year:
            raise serializers.ValidationError(
                f"Ensure this value is less than or equal to {current_year}."
            )
        return year
