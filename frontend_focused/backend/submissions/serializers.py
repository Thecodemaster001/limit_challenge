from django.utils.text import Truncator
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from submissions import models

NOTE_PREVIEW_LENGTH = 140
NOTE_MAX_LENGTH = 5000


class BrokerSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Broker
        fields = ["id", "name", "primary_contact_email"]


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Company
        fields = ["id", "legal_name", "industry", "headquarters_city"]


class TeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.TeamMember
        fields = ["id", "full_name", "email"]


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Contact
        fields = ["id", "name", "role", "email", "phone"]


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Document
        fields = ["id", "title", "doc_type", "uploaded_at", "file_url"]


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Note
        fields = ["id", "author_name", "body", "created_at"]


class NoteCreateSerializer(serializers.ModelSerializer):
    body = serializers.CharField(max_length=NOTE_MAX_LENGTH)

    class Meta:
        model = models.Note
        fields = ["body"]


class SubmissionTriageSerializer(serializers.ModelSerializer):
    """The only submission fields an underwriter can change from the workspace."""

    owner_id = serializers.PrimaryKeyRelatedField(
        source="owner", queryset=models.TeamMember.objects.all()
    )

    class Meta:
        model = models.Submission
        fields = ["status", "priority", "owner_id"]


class StatusCountSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=models.Submission.Status.choices)
    count = serializers.IntegerField()


class LatestNoteSerializer(serializers.Serializer):
    author_name = serializers.CharField()
    body_preview = serializers.CharField()
    created_at = serializers.DateTimeField()


class SubmissionSerializer(serializers.ModelSerializer):
    company = CompanySerializer()
    broker = BrokerSerializer()
    owner = TeamMemberSerializer()

    class Meta:
        model = models.Submission
        fields = [
            "id",
            "status",
            "priority",
            "summary",
            "created_at",
            "updated_at",
            "company",
            "broker",
            "owner",
        ]


class SubmissionListSerializer(SubmissionSerializer):
    """Expects the queryset annotations added by `SubmissionViewSet` for the list action."""

    document_count = serializers.IntegerField()
    note_count = serializers.IntegerField()
    latest_note = serializers.SerializerMethodField()

    class Meta(SubmissionSerializer.Meta):
        fields = [*SubmissionSerializer.Meta.fields, "document_count", "note_count", "latest_note"]

    @extend_schema_field(LatestNoteSerializer(allow_null=True))
    def get_latest_note(self, submission):
        if submission.latest_note_created_at is None:
            return None
        return LatestNoteSerializer(
            {
                "author_name": submission.latest_note_author_name,
                "body_preview": Truncator(submission.latest_note_body).chars(NOTE_PREVIEW_LENGTH),
                "created_at": submission.latest_note_created_at,
            }
        ).data


class SubmissionDetailSerializer(SubmissionSerializer):
    contacts = ContactSerializer(many=True)
    documents = DocumentSerializer(many=True)
    notes = NoteSerializer(many=True)

    class Meta(SubmissionSerializer.Meta):
        fields = [*SubmissionSerializer.Meta.fields, "contacts", "documents", "notes"]
