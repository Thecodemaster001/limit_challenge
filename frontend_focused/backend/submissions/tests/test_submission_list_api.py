from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone

from submissions.serializers import NOTE_PREVIEW_LENGTH
from submissions.tests.factories import DocumentFactory, NoteFactory, SubmissionFactory

pytestmark = pytest.mark.django_db

LIST_URL = reverse("submission-list")


def test_list_returns_paginated_submissions_with_related_summaries(api_client):
    submission = SubmissionFactory()
    DocumentFactory.create_batch(2, submission=submission)
    NoteFactory.create_batch(3, submission=submission)

    response = api_client.get(LIST_URL)

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert set(body) == {"count", "next", "previous", "results"}
    result = body["results"][0]
    assert result["company"]["legalName"] == submission.company.legal_name
    assert result["broker"]["id"] == submission.broker.id
    assert result["owner"]["fullName"] == submission.owner.full_name
    assert result["documentCount"] == 2
    assert result["noteCount"] == 3


def test_counts_are_not_multiplied_by_other_related_rows(api_client):
    submission = SubmissionFactory()
    DocumentFactory.create_batch(3, submission=submission)
    NoteFactory.create_batch(4, submission=submission)

    result = api_client.get(LIST_URL).json()["results"][0]

    assert (result["documentCount"], result["noteCount"]) == (3, 4)


def test_latest_note_is_the_newest_note_with_a_truncated_preview(api_client):
    submission = SubmissionFactory()
    now = timezone.now()
    NoteFactory(submission=submission, body="Older note", created_at=now - timedelta(days=1))
    NoteFactory(
        submission=submission,
        author_name="Dana Reyes",
        body="Newest " + "x" * 300,
        created_at=now,
    )

    latest_note = api_client.get(LIST_URL).json()["results"][0]["latestNote"]

    assert latest_note["authorName"] == "Dana Reyes"
    assert latest_note["bodyPreview"].startswith("Newest")
    assert len(latest_note["bodyPreview"]) == NOTE_PREVIEW_LENGTH
    assert "createdAt" in latest_note


def test_submission_without_notes_has_null_latest_note_and_zero_counts(api_client):
    SubmissionFactory()

    result = api_client.get(LIST_URL).json()["results"][0]

    assert result["latestNote"] is None
    assert (result["documentCount"], result["noteCount"]) == (0, 0)


def test_list_is_ordered_newest_first(api_client):
    now = timezone.now()
    older = SubmissionFactory(created_at=now - timedelta(days=2))
    newer = SubmissionFactory(created_at=now)

    ids = [result["id"] for result in api_client.get(LIST_URL).json()["results"]]

    assert ids == [newer.id, older.id]


def test_page_size_can_be_chosen_and_is_capped(api_client):
    SubmissionFactory.create_batch(12)

    assert len(api_client.get(LIST_URL, {"pageSize": 5}).json()["results"]) == 5
    assert len(api_client.get(LIST_URL).json()["results"]) == 10
    assert len(api_client.get(LIST_URL, {"pageSize": 500}).json()["results"]) == 12


@pytest.mark.parametrize("submission_count", [1, 8])
def test_list_query_count_does_not_grow_with_rows(
    api_client, django_assert_num_queries, submission_count
):
    for submission in SubmissionFactory.create_batch(submission_count):
        DocumentFactory(submission=submission)
        NoteFactory.create_batch(2, submission=submission)

    with django_assert_num_queries(2):
        api_client.get(LIST_URL)
