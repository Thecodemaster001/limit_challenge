from django.conf import settings
from rest_framework.authentication import CSRFCheck
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication

ACCESS_TOKEN_COOKIE = "access_token"
REFRESH_TOKEN_COOKIE = "refresh_token"


def enforce_csrf(request):
    """Reject unsafe requests whose X-CSRFToken header doesn't match the csrftoken cookie."""
    check = CSRFCheck(lambda _request: None)
    check.process_request(request)
    reason = check.process_view(request, None, (), {})
    if reason:
        raise PermissionDenied(f"CSRF Failed: {reason}")


class JWTCookieAuthentication(JWTAuthentication):
    """Reads the access token from an httpOnly cookie; CSRF protection replaces the header."""

    def authenticate(self, request):
        raw_token = request.COOKIES.get(ACCESS_TOKEN_COOKIE)
        if not raw_token:
            return None
        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)
        enforce_csrf(request)
        return user, validated_token


def set_auth_cookies(response, access_token, refresh_token):
    jwt_settings = settings.SIMPLE_JWT
    cookie_options = {
        "httponly": True,
        "secure": settings.AUTH_COOKIE_SECURE,
        "samesite": "Lax",
        "path": "/",
    }
    response.set_cookie(
        ACCESS_TOKEN_COOKIE,
        access_token,
        max_age=int(jwt_settings["ACCESS_TOKEN_LIFETIME"].total_seconds()),
        **cookie_options,
    )
    response.set_cookie(
        REFRESH_TOKEN_COOKIE,
        refresh_token,
        max_age=int(jwt_settings["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        **cookie_options,
    )


def clear_auth_cookies(response):
    for cookie_name in (ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE):
        response.delete_cookie(cookie_name, path="/", samesite="Lax")
