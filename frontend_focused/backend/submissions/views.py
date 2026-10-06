from django.db.models import Count, IntegerField, OuterRef, Prefetch, Subquery
from django.db.models.functions import Coalesce
from rest_framework import mixins, viewsets

from submissions import models, serializers


def related_count(model):
    """Count a submission's related rows in a subquery, avoiding join fan-out between counts."""
    counts = (
        model.objects.filter(submission=OuterRef("pk"))
        .order_by()
        .values("submission")
        .annotate(total=Count("pk"))
        .values("total")
    )
    return Coalesce(Subquery(counts, output_field=IntegerField()), 0)


def latest_note_field(field_name):
    latest_notes = models.Note.objects.filter(submission=OuterRef("pk")).order_by(
        "-created_at", "-pk"
    )
    return Subquery(latest_notes.values(field_name)[:1])


class SubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.Submission.objects.select_related("company", "broker", "owner")

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == "list":
            return queryset.annotate(
                document_count=related_count(models.Document),
                note_count=related_count(models.Note),
                latest_note_author_name=latest_note_field("author_name"),
                latest_note_body=latest_note_field("body"),
                latest_note_created_at=latest_note_field("created_at"),
            )
        return queryset.prefetch_related(
            "contacts",
            "documents",
            Prefetch("notes", queryset=models.Note.objects.order_by("-created_at", "-pk")),
        )

    def get_serializer_class(self):
        if self.action == "list":
            return serializers.SubmissionListSerializer
        return serializers.SubmissionDetailSerializer


class BrokerViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = models.Broker.objects.all()
    serializer_class = serializers.BrokerSerializer
    pagination_class = None


class TeamMemberViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = models.TeamMember.objects.all()
    serializer_class = serializers.TeamMemberSerializer
    pagination_class = None
