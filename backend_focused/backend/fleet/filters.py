from typing import Any

import django_filters
from django import forms
from django.db.models import Exists, OuterRef, QuerySet
from rest_framework.filters import OrderingFilter
from rest_framework.request import Request
from rest_framework.views import APIView

from fleet.models import MaintenanceRecord, Vehicle


class StableOrderingFilter(OrderingFilter):
    """OrderingFilter that adds the primary key as a tie-breaker so pages never overlap."""

    def filter_queryset(self, request: Request, queryset: QuerySet, view: APIView) -> QuerySet:
        queryset = super().filter_queryset(request, queryset, view)
        ordering = list(queryset.query.order_by) or list(queryset.model._meta.ordering)
        ordered_field_names = {field.lstrip("-") for field in ordering if isinstance(field, str)}
        if ordered_field_names.isdisjoint({"pk", "id"}):
            queryset = queryset.order_by(*ordering, "pk")
        return queryset


class VehicleFilterForm(forms.Form):
    def clean(self) -> dict[str, Any]:
        cleaned_data = super().clean()
        date_from = cleaned_data.get("maintenance_date_from")
        date_to = cleaned_data.get("maintenance_date_to")
        if date_from and date_to and date_from > date_to:
            raise forms.ValidationError(
                {"maintenance_date_to": "Must be on or after maintenance_date_from."}
            )
        return cleaned_data


class VehicleFilterSet(django_filters.FilterSet):
    """Vehicle search. All filters are optional and can be combined."""

    MAINTENANCE_RECORD_LOOKUPS = {
        "maintenance_date_from": "maintenance_date__gte",
        "maintenance_date_to": "maintenance_date__lte",
        "mechanic_certification": "mechanic__certification_number__iexact",
    }

    office = django_filters.NumberFilter(field_name="office_id")
    is_active = django_filters.BooleanFilter()
    make = django_filters.CharFilter(lookup_expr="iexact")
    model = django_filters.CharFilter(lookup_expr="iexact")
    maintenance_date_from = django_filters.DateFilter(
        label="Has maintenance on or after this date (YYYY-MM-DD)."
    )
    maintenance_date_to = django_filters.DateFilter(
        label="Has maintenance on or before this date (YYYY-MM-DD)."
    )
    mechanic_certification = django_filters.CharFilter(
        label="Has maintenance performed by the mechanic with this certification number."
    )

    class Meta:
        model = Vehicle
        fields = ["office", "is_active", "make", "model"]
        form = VehicleFilterForm

    def filter_queryset(self, queryset: QuerySet) -> QuerySet:
        maintenance_record_conditions = {}
        for filter_name, value in self.form.cleaned_data.items():
            if filter_name in self.MAINTENANCE_RECORD_LOOKUPS:
                if value not in (None, ""):
                    lookup = self.MAINTENANCE_RECORD_LOOKUPS[filter_name]
                    maintenance_record_conditions[lookup] = value
            else:
                queryset = self.filters[filter_name].filter(queryset, value)

        if maintenance_record_conditions:
            matching_records = MaintenanceRecord.objects.filter(
                vehicle=OuterRef("pk"), **maintenance_record_conditions
            )
            queryset = queryset.filter(Exists(matching_records))
        return queryset


class MaintenanceRecordFilterSet(django_filters.FilterSet):
    vehicle = django_filters.NumberFilter(field_name="vehicle_id")
    mechanic = django_filters.NumberFilter(field_name="mechanic_id")

    class Meta:
        model = MaintenanceRecord
        fields = ["vehicle", "mechanic", "maintenance_type"]
