from io import StringIO

import pytest
from django.contrib.auth import authenticate
from django.core.management import call_command
from django.utils import timezone

from submissions import models
from submissions.management.commands.seed_submissions import (
    DEMO_PASSWORD,
    DEMO_USERNAME,
    OUTCOME_NOTE_BODIES,
    SUBMISSION_COUNT,
)

pytestmark = pytest.mark.django_db


def run_seed(*arguments):
    output = StringIO()
    call_command("seed_submissions", *arguments, stdout=output)
    return output.getvalue()


def test_creates_submissions_with_related_records():
    run_seed()

    assert models.Submission.objects.count() == SUBMISSION_COUNT
    assert not models.Submission.objects.filter(contacts__isnull=True).exists()
    assert models.Submission.objects.filter(documents__isnull=True).exists()
    assert models.Submission.objects.filter(notes__isnull=True).exists()
    assert models.Document.objects.exists()
    assert models.Note.objects.exists()


def test_demo_user_can_sign_in_and_is_linked_to_a_team_member():
    output = run_seed()

    demo_user = authenticate(username=DEMO_USERNAME, password=DEMO_PASSWORD)
    assert demo_user is not None
    assert demo_user.team_member.submissions.exists()
    assert DEMO_USERNAME in output


def test_related_timestamps_are_not_in_the_future():
    run_seed()
    now = timezone.now()

    assert not models.Document.objects.filter(uploaded_at__gt=now).exists()
    assert not models.Note.objects.filter(created_at__gt=now).exists()


def test_rerun_without_force_keeps_existing_data():
    run_seed()
    first_ids = set(models.Submission.objects.values_list("id", flat=True))

    output = run_seed()

    assert "already exist" in output
    assert set(models.Submission.objects.values_list("id", flat=True)) == first_ids


def test_force_rebuilds_data_and_relinks_the_demo_user():
    run_seed()
    first_ids = set(models.Submission.objects.values_list("id", flat=True))

    run_seed("--force")

    assert models.Submission.objects.count() == SUBMISSION_COUNT
    assert first_ids.isdisjoint(models.Submission.objects.values_list("id", flat=True))
    assert models.TeamMember.objects.filter(user__username=DEMO_USERNAME).count() == 1


def test_closed_and_lost_submissions_end_with_an_outcome_note():
    run_seed()

    finished = models.Submission.objects.filter(
        status__in=OUTCOME_NOTE_BODIES, notes__isnull=False
    ).distinct()
    assert finished.exists()
    for submission in finished:
        latest_note = submission.notes.first()
        assert latest_note.body in OUTCOME_NOTE_BODIES[submission.status]
