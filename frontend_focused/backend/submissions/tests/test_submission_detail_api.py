from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone

from submissions.tests.factories import (
    ContactFactory,
    DocumentFactory,
    NoteFactory,
    SubmissionFactory,
)

pytestmark = pytest.mark.django_db


def detail_url(submission_id):
    return reverse("submission-detail", args=[submission_id])


def test_detail_includes_contacts_documents_and_notes(api_client):
    submission = SubmissionFactory()
    contact = ContactFactory(submission=submission)
    document = DocumentFactory(submission=submission)
    NoteFactory.create_batch(2, submission=submission)

    response = api_client.get(detail_url(submission.id))

    assert response.status_code == 200
    body = response.json()
    assert body["company"]["legalName"] == submission.company.legal_name
    assert body["contacts"] == [
        {
            "id": contact.id,
            "name": contact.name,
            "role": contact.role,
            "email": contact.email,
            "phone": contact.phone,
        }
    ]
    assert body["documents"][0]["docType"] == document.doc_type
    assert body["documents"][0]["fileUrl"] == document.file_url
    assert len(body["notes"]) == 2
    assert "documentCount" not in body


def test_detail_notes_are_newest_first(api_client):
    submission = SubmissionFactory()
    now = timezone.now()
    older = NoteFactory(submission=submission, created_at=now - timedelta(hours=3))
    newer = NoteFactory(submission=submission, created_at=now)

    notes = api_client.get(detail_url(submission.id)).json()["notes"]

    assert [note["id"] for note in notes] == [newer.id, older.id]


def test_detail_uses_a_fixed_number_of_queries(api_client, django_assert_num_queries):
    submission = SubmissionFactory()
    ContactFactory.create_batch(3, submission=submission)
    DocumentFactory.create_batch(3, submission=submission)
    NoteFactory.create_batch(3, submission=submission)

    with django_assert_num_queries(4):
        api_client.get(detail_url(submission.id))


def test_unknown_submission_returns_404(api_client):
    assert api_client.get(detail_url(999_999)).status_code == 404
