import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

USER_PASSWORD = "submissions-test-password"


@pytest.fixture(autouse=True)
def fast_password_hashing(settings):
    """Production hashers are deliberately slow; tests don't need that protection."""
    settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@pytest.fixture(autouse=True)
def reset_throttle_history():
    cache.clear()


@pytest.fixture
def user(django_user_model):
    return django_user_model.objects.create_user(
        username="underwriter", password=USER_PASSWORD, first_name="Dana", last_name="Reyes"
    )


@pytest.fixture
def anonymous_client():
    return APIClient()


@pytest.fixture
def api_client(user):
    """Authenticated client, so endpoint tests focus on behaviour rather than login."""
    client = APIClient()
    client.force_authenticate(user=user)
    return client
