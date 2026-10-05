from django.db import DatabaseError, connection
from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["ok", "error"])
    database = serializers.ChoiceField(choices=["ok", "unavailable"])


class HealthCheckView(APIView):
    """Liveness probe that also verifies the database is reachable."""

    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["health"],
        responses={
            status.HTTP_200_OK: HealthCheckSerializer,
            status.HTTP_503_SERVICE_UNAVAILABLE: HealthCheckSerializer,
        },
    )
    def get(self, request: Request) -> Response:
        try:
            connection.ensure_connection()
        except DatabaseError:
            return Response(
                {"status": "error", "database": "unavailable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response({"status": "ok", "database": "ok"})
