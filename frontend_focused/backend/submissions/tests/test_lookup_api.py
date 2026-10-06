import pytest
from django.urls import reverse

from submissions.tests.factories import BrokerFactory, TeamMemberFactory

pytestmark = pytest.mark.django_db


def test_brokers_are_an_unpaginated_list_sorted_by_name(api_client):
    BrokerFactory(name="Zenith Brokers")
    BrokerFactory(name="Atlas Brokers")

    response = api_client.get(reverse("broker-list"))

    assert response.status_code == 200
    assert [broker["name"] for broker in response.json()] == ["Atlas Brokers", "Zenith Brokers"]
    assert set(response.json()[0]) == {"id", "name", "primaryContactEmail"}


def test_team_members_are_an_unpaginated_list_sorted_by_name(api_client):
    TeamMemberFactory(full_name="Sam Ortiz")
    TeamMemberFactory(full_name="Alex Chen")

    response = api_client.get(reverse("team-member-list"))

    assert response.status_code == 200
    assert [member["fullName"] for member in response.json()] == ["Alex Chen", "Sam Ortiz"]
    assert set(response.json()[0]) == {"id", "fullName", "email"}
