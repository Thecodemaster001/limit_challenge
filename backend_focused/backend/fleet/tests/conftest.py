import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

USER_PASSWORD = "fleet-test-password"


@pytest.fixture(autouse=True)
def fast_password_hashing(settings) -> None:
    """Production hashers are deliberately slow; tests don't need that protection."""
    settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@pytest.fixture
def user(django_user_model) -> User:
    return django_user_model.objects.create_user(username="fleet-manager", password=USER_PASSWORD)


@pytest.fixture
def anonymous_client() -> APIClient:
    return APIClient()


@pytest.fixture
def api_client(user) -> APIClient:
    """Authenticated client, so endpoint tests focus on behaviour rather than login."""
    client = APIClient()
    client.force_authenticate(user=user)
    return client
