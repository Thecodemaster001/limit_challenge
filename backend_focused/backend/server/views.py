from django.db import DatabaseError, connection
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """Liveness probe that also verifies the database is reachable."""

    def get(self, request: Request) -> Response:
        try:
            connection.ensure_connection()
        except DatabaseError:
            return Response(
                {"status": "error", "database": "unavailable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response({"status": "ok", "database": "ok"})
