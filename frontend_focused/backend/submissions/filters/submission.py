from django.db.models import Case, Exists, IntegerField, OuterRef, Value, When
from django_filters import rest_framework as filters

from submissions import models

PRIORITY_RANK = {
    models.Submission.Priority.LOW: 1,
    models.Submission.Priority.MEDIUM: 2,
    models.Submission.Priority.HIGH: 3,
}

STATUS_RANK = {
    models.Submission.Status.NEW: 1,
    models.Submission.Status.IN_REVIEW: 2,
    models.Submission.Status.CLOSED: 3,
    models.Submission.Status.LOST: 4,
}


def rank(field_name, ranks):
    return Case(
        *(When(**{field_name: value}, then=Value(position)) for value, position in ranks.items()),
        output_field=IntegerField(),
    )


class ChoiceInFilter(filters.BaseInFilter, filters.ChoiceFilter):
    """Comma-separated values, each validated against the field's choices."""


class SubmissionOrderingFilter(filters.OrderingFilter):
    """Orders priority and status by workflow rank, and breaks ties by id for stable paging."""

    def filter(self, queryset, value):
        if not value:
            return queryset
        queryset = queryset.annotate(
            priority_rank=rank("priority", PRIORITY_RANK),
            status_rank=rank("status", STATUS_RANK),
        )
        ordered = super().filter(queryset, value)
        return ordered.order_by(*ordered.query.order_by, "-id")


class SubmissionFilter(filters.FilterSet):
    status = ChoiceInFilter(choices=models.Submission.Status.choices)
    priority = ChoiceInFilter(choices=models.Submission.Priority.choices)
    broker_id = filters.NumberFilter(field_name="broker_id")
    owner_id = filters.NumberFilter(field_name="owner_id")
    company_search = filters.CharFilter(field_name="company__legal_name", lookup_expr="icontains")
    created_from = filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    created_to = filters.DateFilter(field_name="created_at", lookup_expr="date__lte")
    has_documents = filters.BooleanFilter(method="filter_has_related", label="Has documents")
    has_notes = filters.BooleanFilter(method="filter_has_related", label="Has notes")
    ordering = SubmissionOrderingFilter(
        fields=(
            ("created_at", "createdAt"),
            ("company__legal_name", "company"),
            ("status_rank", "status"),
            ("priority_rank", "priority"),
        )
    )

    class Meta:
        model = models.Submission
        fields = []

    def filter_has_related(self, queryset, name, value):
        if value is None:
            return queryset
        related_model = models.Document if name == "has_documents" else models.Note
        related_exists = Exists(related_model.objects.filter(submission=OuterRef("pk")))
        return queryset.filter(related_exists if value else ~related_exists)
