from django.db.models import QuerySet
from django.utils import timezone
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
    MechanicWorkloadQuerySerializer,
    MechanicWorkloadSerializer,
    OfficeSerializer,
    OfficeSummarySerializer,
    VehicleDetailSerializer,
    VehicleMaintenanceRecordSerializer,
    VehicleNeedingMaintenanceSerializer,
    VehicleSerializer,
)


class SerializerClassByActionMixin:
    """Pick the serializer from `serializer_class_by_action`, falling back to `serializer_class`."""

    serializer_class_by_action: dict[str, type[serializers.BaseSerializer]] = {}

    def get_serializer_class(self) -> type[serializers.BaseSerializer]:
        return self.serializer_class_by_action.get(self.action, super().get_serializer_class())


class OfficeViewSet(SerializerClassByActionMixin, viewsets.ModelViewSet):
    """Offices that vehicles are assigned to."""

    queryset = Office.objects.all()
    serializer_class = OfficeSerializer
    serializer_class_by_action = {"summary": OfficeSummarySerializer}
    filterset_fields = ["city"]
    ordering_fields = ["name", "city"]

    @extend_schema(
        summary="Fleet statistics for every office",
        description=(
            "Active vehicle count, maintenance cost over the last 365 days and the date of "
            "the most recent maintenance on any of the office's vehicles."
        ),
        responses=OfficeSummarySerializer(many=True),
    )
    @action(detail=False, methods=["get"], filter_backends=[], pagination_class=None)
    def summary(self, request: Request) -> Response:
        offices = Office.objects.with_summary(today=timezone.localdate())
        serializer = self.get_serializer(offices, many=True)
        return Response(serializer.data)


class VehicleViewSet(SerializerClassByActionMixin, viewsets.ModelViewSet):
    """Fleet vehicles. VIN and license plate are stored in upper case."""

    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    serializer_class_by_action = {
        "retrieve": VehicleDetailSerializer,
        "maintenance_history": VehicleMaintenanceRecordSerializer,
        "needing_maintenance": VehicleNeedingMaintenanceSerializer,
    }
    filterset_class = VehicleFilterSet
    ordering_fields = ["make", "model", "year", "license_plate"]

    def get_queryset(self) -> QuerySet[Vehicle]:
        if self.action == "retrieve":
            return Vehicle.objects.with_maintenance_history()
        return super().get_queryset()

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

    @extend_schema(
        summary="Active vehicles due for maintenance",
        description=(
            "Active vehicles that were never serviced or were last serviced more than 365 days "
            "ago, oldest maintenance first. Never-serviced vehicles are listed first."
        ),
        responses=VehicleNeedingMaintenanceSerializer(many=True),
    )
    @action(detail=False, methods=["get"], url_path="needing-maintenance", filter_backends=[])
    def needing_maintenance(self, request: Request) -> Response:
        vehicles = Vehicle.objects.needing_maintenance(today=timezone.localdate())
        page = self.paginate_queryset(vehicles)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)


class MechanicViewSet(SerializerClassByActionMixin, viewsets.ModelViewSet):
    """Mechanics who perform maintenance. Inactive mechanics cannot take new work."""

    queryset = Mechanic.objects.all()
    serializer_class = MechanicSerializer
    serializer_class_by_action = {"workload": MechanicWorkloadSerializer}
    filterset_fields = ["is_active"]
    ordering_fields = ["name", "certification_number"]

    @extend_schema(
        summary="Mechanic workload for a year, busiest first",
        description=(
            "Number of maintenance records and their total cost per mechanic for the given "
            "year (default: current year). Mechanics without work are included with zeros."
        ),
        parameters=[MechanicWorkloadQuerySerializer],
        responses=MechanicWorkloadSerializer(many=True),
    )
    @action(detail=False, methods=["get"], filter_backends=[], pagination_class=None)
    def workload(self, request: Request) -> Response:
        query = MechanicWorkloadQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        year = query.validated_data.get("year", timezone.localdate().year)
        mechanics = Mechanic.objects.with_workload(year=year)
        serializer = self.get_serializer(mechanics, many=True)
        return Response(serializer.data)


class MaintenanceRecordViewSet(viewsets.ModelViewSet):
    """Maintenance performed on a vehicle by a mechanic."""

    queryset = MaintenanceRecord.objects.all()
    serializer_class = MaintenanceRecordSerializer
    filterset_class = MaintenanceRecordFilterSet
    ordering_fields = ["maintenance_date", "cost"]
