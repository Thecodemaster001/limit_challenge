import pytest
from django.urls import reverse

from submissions.models import Submission
from submissions.serializers import NOTE_MAX_LENGTH
from submissions.tests.factories import NoteFactory, SubmissionFactory, TeamMemberFactory

pytestmark = pytest.mark.django_db


def detail_url(submission_id):
    return reverse("submission-detail", args=[submission_id])


def notes_url(submission_id):
    return reverse("submission-notes", args=[submission_id])


def test_patch_updates_triage_fields_and_returns_the_full_detail(api_client):
    submission = SubmissionFactory(status=Submission.Status.NEW, priority=Submission.Priority.LOW)
    NoteFactory(submission=submission)
    new_owner = TeamMemberFactory()

    response = api_client.patch(
        detail_url(submission.id),
        {"status": "in_review", "priority": "high", "ownerId": new_owner.id},
        format="json",
    )

    assert response.status_code == 200
    body = response.json()
    assert (body["status"], body["priority"]) == ("in_review", "high")
    assert body["owner"]["id"] == new_owner.id
    assert len(body["notes"]) == 1
    submission.refresh_from_db()
    assert submission.owner == new_owner
    assert submission.status == Submission.Status.IN_REVIEW


def test_patch_can_change_a_single_field(api_client):
    submission = SubmissionFactory(priority=Submission.Priority.LOW)

    response = api_client.patch(detail_url(submission.id), {"status": "closed"}, format="json")

    assert response.status_code == 200
    submission.refresh_from_db()
    assert submission.status == Submission.Status.CLOSED
    assert submission.priority == Submission.Priority.LOW


def test_patch_ignores_fields_outside_triage(api_client):
    submission = SubmissionFactory(summary="Original summary")

    api_client.patch(
        detail_url(submission.id), {"summary": "Changed", "status": "lost"}, format="json"
    )

    submission.refresh_from_db()
    assert submission.summary == "Original summary"
    assert submission.status == Submission.Status.LOST


@pytest.mark.parametrize(
    ("payload", "invalid_field"),
    [({"status": "archived"}, "status"), ({"ownerId": 999_999}, "ownerId")],
)
def test_patch_rejects_invalid_values(api_client, payload, invalid_field):
    submission = SubmissionFactory()

    response = api_client.patch(detail_url(submission.id), payload, format="json")

    assert response.status_code == 400
    assert invalid_field in response.json()


def test_put_is_not_allowed(api_client):
    submission = SubmissionFactory()

    response = api_client.put(detail_url(submission.id), {"status": "new"}, format="json")

    assert response.status_code == 405


def test_adding_a_note_uses_the_team_member_name_as_author(api_client, user):
    TeamMemberFactory(user=user, full_name="Dana Reyes")
    submission = SubmissionFactory()

    response = api_client.post(
        notes_url(submission.id),
        {"body": "  Broker confirmed the effective date.  ", "authorName": "Someone else"},
        format="json",
    )

    assert response.status_code == 201
    body = response.json()
    assert body["authorName"] == "Dana Reyes"
    assert body["body"] == "Broker confirmed the effective date."
    assert set(body) == {"id", "authorName", "body", "createdAt"}
    assert submission.notes.get().id == body["id"]


def test_note_author_falls_back_to_the_user_name(api_client, user):
    submission = SubmissionFactory()

    response = api_client.post(notes_url(submission.id), {"body": "Called the broker."})

    assert response.json()["authorName"] == user.get_full_name()


@pytest.mark.parametrize("body", ["", "   ", "x" * (NOTE_MAX_LENGTH + 1)])
def test_note_body_must_be_present_and_reasonably_sized(api_client, body):
    submission = SubmissionFactory()

    response = api_client.post(notes_url(submission.id), {"body": body}, format="json")

    assert response.status_code == 400
    assert not submission.notes.exists()


def test_new_note_becomes_the_latest_note_in_the_list(api_client):
    submission = SubmissionFactory()
    NoteFactory(submission=submission, body="Older note")

    api_client.post(notes_url(submission.id), {"body": "Fresh update"}, format="json")

    result = api_client.get(reverse("submission-list")).json()["results"][0]
    assert result["latestNote"]["bodyPreview"] == "Fresh update"
    assert result["noteCount"] == 2


def test_adding_a_note_to_an_unknown_submission_returns_404(api_client):
    assert api_client.post(notes_url(999_999), {"body": "Hello"}).status_code == 404


def test_writes_require_authentication(anonymous_client):
    submission = SubmissionFactory()

    assert anonymous_client.post(notes_url(submission.id), {"body": "Hi"}).status_code == 401
    patch_response = anonymous_client.patch(detail_url(submission.id), {"status": "lost"})
    assert patch_response.status_code == 401
