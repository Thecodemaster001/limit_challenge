import pytest
from rest_framework import status

from fleet.tests.conftest import USER_PASSWORD

pytestmark = pytest.mark.django_db

PROTECTED_ENDPOINTS = [
    ("get", "/api/vehicles/"),
    ("post", "/api/offices/"),
    ("get", "/api/offices/summary/"),
    ("get", "/api/mechanics/workload/"),
    ("get", "/api/vehicles/duplicate-check/?vin=X"),
]


def obtain_tokens(client, username: str, password: str):
    return client.post(
        "/api/auth/token/", {"username": username, "password": password}, format="json"
    )


@pytest.mark.parametrize(("method", "url"), PROTECTED_ENDPOINTS)
def test_api_requires_authentication(anonymous_client, method, url):
    response = getattr(anonymous_client, method)(url)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.parametrize("url", ["/api/health/", "/api/schema/", "/api/docs/"])
def test_health_and_docs_are_public(anonymous_client, url):
    assert anonymous_client.get(url).status_code == status.HTTP_200_OK


def test_valid_credentials_return_access_and_refresh_tokens(anonymous_client, user):
    response = obtain_tokens(anonymous_client, user.username, USER_PASSWORD)

    assert response.status_code == status.HTTP_200_OK
    assert set(response.data) == {"access", "refresh"}


def test_invalid_credentials_are_rejected(anonymous_client, user):
    response = obtain_tokens(anonymous_client, user.username, "wrong-password")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_access_token_grants_access(anonymous_client, user):
    access_token = obtain_tokens(anonymous_client, user.username, USER_PASSWORD).data["access"]
    anonymous_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

    assert anonymous_client.get("/api/vehicles/").status_code == status.HTTP_200_OK


def test_invalid_token_is_rejected(anonymous_client):
    anonymous_client.credentials(HTTP_AUTHORIZATION="Bearer not-a-real-token")

    assert anonymous_client.get("/api/vehicles/").status_code == status.HTTP_401_UNAUTHORIZED


def test_refresh_token_returns_a_new_access_token(anonymous_client, user):
    refresh_token = obtain_tokens(anonymous_client, user.username, USER_PASSWORD).data["refresh"]

    response = anonymous_client.post(
        "/api/auth/token/refresh/", {"refresh": refresh_token}, format="json"
    )

    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data
