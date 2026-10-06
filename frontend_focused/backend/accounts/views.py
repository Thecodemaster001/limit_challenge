from contextlib import suppress

from django.contrib.auth import authenticate, get_user_model
from django.middleware.csrf import rotate_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.authentication import (
    REFRESH_TOKEN_COOKIE,
    clear_auth_cookies,
    enforce_csrf,
    set_auth_cookies,
)
from accounts.serializers import CurrentUserSerializer, LoginSerializer
from accounts.throttling import LoginRateThrottle


class CookieTokenView(APIView):
    """Base for endpoints that manage the auth cookies: no prior auth needed, CSRF still applies."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        enforce_csrf(request)

    def get_authenticate_header(self, request):
        return 'Bearer realm="api"'


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfTokenView(CookieTokenView):
    @extend_schema(responses={204: None})
    def get(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


class LoginView(CookieTokenView):
    throttle_classes = [LoginRateThrottle]

    @extend_schema(request=LoginSerializer, responses=CurrentUserSerializer)
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(request, **serializer.validated_data)
        if user is None:
            raise AuthenticationFailed("Incorrect username or password.")

        refresh_token = RefreshToken.for_user(user)
        response = Response(CurrentUserSerializer(user).data)
        set_auth_cookies(response, str(refresh_token.access_token), str(refresh_token))
        rotate_token(request)
        return response


def session_expired_response():
    """A 401 that also clears the dead cookies, so the Next proxy stops admitting the browser."""
    response = Response(
        {"detail": "Session expired. Please sign in again."},
        status=status.HTTP_401_UNAUTHORIZED,
    )
    clear_auth_cookies(response)
    return response


class RefreshView(CookieTokenView):
    @extend_schema(request=None, responses={204: None, 401: None})
    def post(self, request):
        raw_refresh_token = request.COOKIES.get(REFRESH_TOKEN_COOKIE)
        if not raw_refresh_token:
            return session_expired_response()

        serializer = TokenRefreshSerializer(data={"refresh": raw_refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, get_user_model().DoesNotExist):
            return session_expired_response()

        response = Response(status=status.HTTP_204_NO_CONTENT)
        set_auth_cookies(
            response, serializer.validated_data["access"], serializer.validated_data["refresh"]
        )
        return response


class LogoutView(CookieTokenView):
    @extend_schema(request=None, responses={204: None})
    def post(self, request):
        raw_refresh_token = request.COOKIES.get(REFRESH_TOKEN_COOKIE)
        if raw_refresh_token:
            with suppress(TokenError):
                RefreshToken(raw_refresh_token).blacklist()
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_auth_cookies(response)
        return response


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=CurrentUserSerializer)
    def get(self, request):
        return Response(CurrentUserSerializer(request.user).data)
