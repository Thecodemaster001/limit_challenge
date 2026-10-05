from django.db.models import QuerySet
from drf_spectacular.utils import extend_schema
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from fleet.filters import MaintenanceRecordFilterSet, VehicleFilterSet
from fleet.models import MaintenanceRecord, Mechanic, Office, Vehicle
from fleet.serializers import (
    MaintenanceRecordSerializer,
    MechanicSerializer,
    OfficeSerializer,
    VehicleDetailSerializer,
    VehicleMaintenanceRecordSerializer,
    VehicleSerializer,
)


class OfficeViewSet(viewsets.ModelViewSet):
    """Offices that vehicles are assigned to."""

    queryset = Office.objects.all()
    serializer_class = OfficeSerializer
    filterset_fields = ["city"]
    ordering_fields = ["name", "city"]


class VehicleViewSet(viewsets.ModelViewSet):
    """Fleet vehicles. VIN and license plate are stored in upper case."""

    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    filterset_class = VehicleFilterSet
    ordering_fields = ["make", "model", "year", "license_plate"]

    def get_queryset(self) -> QuerySet[Vehicle]:
        if self.action == "retrieve":
            return Vehicle.objects.with_maintenance_history()
        return super().get_queryset()

    def get_serializer_class(self) -> type[serializers.BaseSerializer]:
        if self.action == "retrieve":
            return VehicleDetailSerializer
        if self.action == "maintenance_history":
            return VehicleMaintenanceRecordSerializer
        return super().get_serializer_class()

    @extend_schema(
        summary="Maintenance history of a vehicle, newest first",
        responses=VehicleMaintenanceRecordSerializer(many=True),
    )
    @action(detail=True, methods=["get"], url_path="maintenance-history", filter_backends=[])
    def maintenance_history(self, request: Request, pk: str | None = None) -> Response:
        vehicle = self.get_object()
        maintenance_records = vehicle.maintenance_records.select_related("mechanic").newest_first()
        page = self.paginate_queryset(maintenance_records)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)


class MechanicViewSet(viewsets.ModelViewSet):
    """Mechanics who perform maintenance. Inactive mechanics cannot take new work."""

    queryset = Mechanic.objects.all()
    serializer_class = MechanicSerializer
    filterset_fields = ["is_active"]
    ordering_fields = ["name", "certification_number"]


class MaintenanceRecordViewSet(viewsets.ModelViewSet):
    """Maintenance performed on a vehicle by a mechanic."""

    queryset = MaintenanceRecord.objects.all()
    serializer_class = MaintenanceRecordSerializer
    filterset_class = MaintenanceRecordFilterSet
    ordering_fields = ["maintenance_date", "cost"]
