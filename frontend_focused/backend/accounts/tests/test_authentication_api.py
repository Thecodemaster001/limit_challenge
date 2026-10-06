import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken

from accounts.authentication import ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE
from accounts.throttling import LoginRateThrottle
from conftest import USER_PASSWORD
from submissions.tests.factories import TeamMemberFactory

pytestmark = pytest.mark.django_db

SUBMISSIONS_URL = reverse("submission-list")


@pytest.fixture
def browser_client():
    """A client that enforces CSRF like a real browser session would."""
    client = APIClient(enforce_csrf_checks=True)
    client.get(reverse("auth-csrf"))
    return client


def csrf_header(client):
    return {"HTTP_X_CSRFTOKEN": client.cookies["csrftoken"].value}


def log_in(client, username, password=USER_PASSWORD):
    return client.post(
        reverse("auth-login"),
        {"username": username, "password": password},
        format="json",
        **csrf_header(client),
    )


def test_csrf_endpoint_sets_a_readable_csrf_cookie(anonymous_client):
    response = anonymous_client.get(reverse("auth-csrf"))

    assert response.status_code == 204
    assert not response.cookies["csrftoken"]["httponly"]


def test_login_sets_http_only_token_cookies_and_returns_the_user(browser_client, user):
    TeamMemberFactory(user=user, full_name="Dana Reyes")

    response = log_in(browser_client, user.username)

    assert response.status_code == 200
    assert response.json() == {
        "id": user.id,
        "username": user.username,
        "fullName": "Dana Reyes",
        "teamMember": {
            "id": user.team_member.id,
            "fullName": "Dana Reyes",
            "email": user.team_member.email,
        },
    }
    for cookie_name in (ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE):
        cookie = response.cookies[cookie_name]
        assert cookie["httponly"]
        assert cookie["samesite"] == "Lax"


def test_login_with_wrong_password_is_rejected_without_cookies(browser_client, user):
    response = log_in(browser_client, user.username, password="wrong-password")

    assert response.status_code == 401
    assert ACCESS_TOKEN_COOKIE not in response.cookies


def test_login_requires_a_csrf_token(user):
    client = APIClient(enforce_csrf_checks=True)

    response = client.post(
        reverse("auth-login"),
        {"username": user.username, "password": USER_PASSWORD},
        format="json",
    )

    assert response.status_code == 403


def test_api_requires_authentication(anonymous_client):
    assert anonymous_client.get(SUBMISSIONS_URL).status_code == 401


def test_access_cookie_authenticates_api_requests(browser_client, user):
    log_in(browser_client, user.username)

    assert browser_client.get(SUBMISSIONS_URL).status_code == 200
    assert browser_client.get(reverse("auth-me")).json()["username"] == user.username


def test_unsafe_requests_with_the_access_cookie_still_need_csrf(browser_client, user):
    log_in(browser_client, user.username)

    response = browser_client.post(SUBMISSIONS_URL, {}, format="json")

    assert response.status_code == 403
    assert "CSRF" in response.json()["detail"]


def test_invalid_access_cookie_returns_401(anonymous_client):
    anonymous_client.cookies[ACCESS_TOKEN_COOKIE] = "not-a-token"

    assert anonymous_client.get(SUBMISSIONS_URL).status_code == 401


def test_refresh_rotates_tokens_and_blacklists_the_old_refresh_token(browser_client, user):
    log_in(browser_client, user.username)
    old_refresh_token = browser_client.cookies[REFRESH_TOKEN_COOKIE].value

    response = browser_client.post(reverse("auth-refresh"), **csrf_header(browser_client))

    assert response.status_code == 204
    assert response.cookies[REFRESH_TOKEN_COOKIE].value != old_refresh_token
    assert response.cookies[ACCESS_TOKEN_COOKIE].value

    browser_client.cookies[REFRESH_TOKEN_COOKIE] = old_refresh_token
    reused = browser_client.post(reverse("auth-refresh"), **csrf_header(browser_client))
    assert reused.status_code == 401


def test_refresh_without_a_cookie_returns_401(browser_client):
    response = browser_client.post(reverse("auth-refresh"), **csrf_header(browser_client))

    assert response.status_code == 401


def test_logout_blacklists_the_refresh_token_and_clears_cookies(browser_client, user):
    log_in(browser_client, user.username)

    response = browser_client.post(reverse("auth-logout"), **csrf_header(browser_client))

    assert response.status_code == 204
    assert BlacklistedToken.objects.count() == 1
    for cookie_name in (ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE):
        assert response.cookies[cookie_name]["max-age"] == 0
    assert browser_client.get(SUBMISSIONS_URL).status_code == 401


def test_current_user_without_a_team_member(api_client, user):
    response = api_client.get(reverse("auth-me"))

    assert response.status_code == 200
    assert response.json()["teamMember"] is None


def test_login_is_rate_limited(browser_client, user, monkeypatch):
    monkeypatch.setattr(LoginRateThrottle, "THROTTLE_RATES", {"login": "2/minute"})

    statuses = [log_in(browser_client, user.username, "wrong").status_code for _ in range(3)]

    assert statuses == [401, 401, 429]


def test_rate_limit_applies_per_username(browser_client, user, django_user_model, monkeypatch):
    monkeypatch.setattr(LoginRateThrottle, "THROTTLE_RATES", {"login": "2/minute"})
    other_user = django_user_model.objects.create_user(
        username="broker-desk", password=USER_PASSWORD
    )
    for _ in range(2):
        log_in(browser_client, user.username, "wrong")

    assert log_in(browser_client, user.username).status_code == 429
    assert log_in(browser_client, other_user.username).status_code == 200
