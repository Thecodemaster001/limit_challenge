from rest_framework import viewsets

from fleet.models import MaintenanceRecord, Mechanic, Office, Vehicle
from fleet.serializers import (
    MaintenanceRecordSerializer,
    MechanicSerializer,
    OfficeSerializer,
    VehicleSerializer,
)


class OfficeViewSet(viewsets.ModelViewSet):
    queryset = Office.objects.all()
    serializer_class = OfficeSerializer
    filterset_fields = ["city"]
    ordering_fields = ["name", "city"]


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    ordering_fields = ["make", "model", "year", "license_plate"]


class MechanicViewSet(viewsets.ModelViewSet):
    queryset = Mechanic.objects.all()
    serializer_class = MechanicSerializer
    filterset_fields = ["is_active"]
    ordering_fields = ["name", "certification_number"]


class MaintenanceRecordViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceRecord.objects.all()
    serializer_class = MaintenanceRecordSerializer
    filterset_fields = ["vehicle", "mechanic", "maintenance_type"]
    ordering_fields = ["maintenance_date", "cost"]
