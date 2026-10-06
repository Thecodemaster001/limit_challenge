from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest
from django.urls import reverse
from django.utils import timezone

from submissions.models import Submission
from submissions.tests.factories import (
    BrokerFactory,
    CompanyFactory,
    DocumentFactory,
    NoteFactory,
    SubmissionFactory,
    TeamMemberFactory,
)

pytestmark = pytest.mark.django_db

LIST_URL = reverse("submission-list")
STATUS_COUNTS_URL = reverse("submission-status-counts")


def result_ids(api_client, params):
    response = api_client.get(LIST_URL, params)
    assert response.status_code == 200, response.json()
    return [result["id"] for result in response.json()["results"]]


def test_status_accepts_a_comma_separated_list(api_client):
    new = SubmissionFactory(status=Submission.Status.NEW)
    in_review = SubmissionFactory(status=Submission.Status.IN_REVIEW)
    SubmissionFactory(status=Submission.Status.CLOSED)

    assert set(result_ids(api_client, {"status": "new,in_review"})) == {new.id, in_review.id}


def test_priority_filter(api_client):
    high = SubmissionFactory(priority=Submission.Priority.HIGH)
    SubmissionFactory(priority=Submission.Priority.LOW)

    assert result_ids(api_client, {"priority": "high"}) == [high.id]


def test_unknown_choice_is_rejected(api_client):
    response = api_client.get(LIST_URL, {"status": "archived"})

    assert response.status_code == 400
    assert "status" in response.json()


def test_broker_and_owner_filters_use_camel_case_parameters(api_client):
    broker = BrokerFactory()
    owner = TeamMemberFactory()
    match = SubmissionFactory(broker=broker, owner=owner)
    SubmissionFactory(broker=broker)
    SubmissionFactory(owner=owner)

    assert result_ids(api_client, {"brokerId": broker.id, "ownerId": owner.id}) == [match.id]


def test_company_search_is_a_case_insensitive_partial_match(api_client):
    match = SubmissionFactory(company=CompanyFactory(legal_name="Harbor Freight Logistics"))
    SubmissionFactory(company=CompanyFactory(legal_name="Summit Foods"))

    assert result_ids(api_client, {"companySearch": "freight"}) == [match.id]


def test_created_date_range_includes_both_end_days(api_client):
    def created_on(day):
        return timezone.make_aware(datetime(2026, 3, day, 12))

    first_day = SubmissionFactory(created_at=created_on(10))
    last_day = SubmissionFactory(created_at=created_on(12))
    SubmissionFactory(created_at=created_on(9))
    SubmissionFactory(created_at=created_on(13))

    ids = result_ids(api_client, {"createdFrom": "2026-03-10", "createdTo": "2026-03-12"})

    assert set(ids) == {first_day.id, last_day.id}


def test_date_range_follows_the_business_time_zone(api_client, settings):
    settings.TIME_ZONE = "America/New_York"
    # 9pm in New York on March 10 is already March 11 in UTC.
    evening_in_new_york = SubmissionFactory(
        created_at=datetime(2026, 3, 11, 1, tzinfo=ZoneInfo("UTC"))
    )

    march_tenth = {"createdFrom": "2026-03-10", "createdTo": "2026-03-10"}
    march_eleventh = {"createdFrom": "2026-03-11", "createdTo": "2026-03-11"}

    assert result_ids(api_client, march_tenth) == [evening_in_new_york.id]
    assert result_ids(api_client, march_eleventh) == []


@pytest.mark.parametrize(
    ("parameter", "related_factory"),
    [("hasDocuments", DocumentFactory), ("hasNotes", NoteFactory)],
)
def test_has_related_filters_split_submissions(api_client, parameter, related_factory):
    with_related = SubmissionFactory()
    related_factory.create_batch(2, submission=with_related)
    without_related = SubmissionFactory()

    assert result_ids(api_client, {parameter: "true"}) == [with_related.id]
    assert result_ids(api_client, {parameter: "false"}) == [without_related.id]


def test_filters_combine(api_client):
    broker = BrokerFactory()
    match = SubmissionFactory(broker=broker, status=Submission.Status.NEW)
    NoteFactory(submission=match)
    SubmissionFactory(broker=broker, status=Submission.Status.NEW)
    SubmissionFactory(broker=broker, status=Submission.Status.LOST)

    ids = result_ids(api_client, {"brokerId": broker.id, "status": "new", "hasNotes": "true"})

    assert ids == [match.id]


def test_priority_ordering_uses_rank_not_alphabetical_order(api_client):
    low = SubmissionFactory(priority=Submission.Priority.LOW)
    high = SubmissionFactory(priority=Submission.Priority.HIGH)
    medium = SubmissionFactory(priority=Submission.Priority.MEDIUM)

    assert result_ids(api_client, {"ordering": "-priority"}) == [high.id, medium.id, low.id]
    assert result_ids(api_client, {"ordering": "priority"}) == [low.id, medium.id, high.id]


def test_status_ordering_follows_the_workflow(api_client):
    lost = SubmissionFactory(status=Submission.Status.LOST)
    new = SubmissionFactory(status=Submission.Status.NEW)
    in_review = SubmissionFactory(status=Submission.Status.IN_REVIEW)

    assert result_ids(api_client, {"ordering": "status"}) == [new.id, in_review.id, lost.id]


def test_ordering_by_company_and_oldest_first(api_client):
    now = timezone.now()
    beta = SubmissionFactory(
        company=CompanyFactory(legal_name="Beta"), created_at=now - timedelta(days=1)
    )
    alpha = SubmissionFactory(company=CompanyFactory(legal_name="Alpha"), created_at=now)

    assert result_ids(api_client, {"ordering": "company"}) == [alpha.id, beta.id]
    assert result_ids(api_client, {"ordering": "createdAt"}) == [beta.id, alpha.id]


def test_ties_are_broken_by_id_so_pages_do_not_overlap(api_client):
    created_at = timezone.now()
    SubmissionFactory.create_batch(6, priority=Submission.Priority.HIGH, created_at=created_at)

    first_page = result_ids(api_client, {"ordering": "-priority", "pageSize": 3})
    second_page = result_ids(api_client, {"ordering": "-priority", "pageSize": 3, "page": 2})

    assert set(first_page).isdisjoint(second_page)


def test_unknown_ordering_is_rejected(api_client):
    assert api_client.get(LIST_URL, {"ordering": "summary"}).status_code == 400


def test_status_counts_ignore_the_status_filter_but_respect_the_others(api_client):
    broker = BrokerFactory()
    SubmissionFactory.create_batch(2, broker=broker, status=Submission.Status.NEW)
    SubmissionFactory(broker=broker, status=Submission.Status.LOST)
    SubmissionFactory(status=Submission.Status.NEW)

    response = api_client.get(STATUS_COUNTS_URL, {"brokerId": broker.id, "status": "lost"})

    assert response.status_code == 200
    assert response.json() == [
        {"status": "new", "count": 2},
        {"status": "in_review", "count": 0},
        {"status": "closed", "count": 0},
        {"status": "lost", "count": 1},
    ]


def test_status_counts_reject_invalid_filters(api_client):
    assert api_client.get(STATUS_COUNTS_URL, {"createdFrom": "not-a-date"}).status_code == 400
