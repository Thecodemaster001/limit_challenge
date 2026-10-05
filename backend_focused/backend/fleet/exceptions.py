import logging
from collections import Counter
from typing import Any

from django.db import IntegrityError
from django.db.models import ProtectedError
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import exception_handler, set_rollback

logger = logging.getLogger(__name__)


class ErrorDetailSerializer(serializers.Serializer):
    detail = serializers.CharField()


def api_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    """DRF's handler, plus JSON 409 responses for database conflicts instead of HTML 500s."""
    if isinstance(exc, ProtectedError):
        return _conflict_response(_protected_error_message(exc, context))
    if isinstance(exc, IntegrityError):
        logger.warning("Integrity error during %s", context.get("request"), exc_info=exc)
        return _conflict_response("The request conflicts with existing data. Please retry.")
    return exception_handler(exc, context)


def _conflict_response(message: str) -> Response:
    set_rollback()
    return Response({"detail": message}, status=status.HTTP_409_CONFLICT)


def _protected_error_message(exc: ProtectedError, context: dict[str, Any]) -> str:
    view = context.get("view")
    deleted_model = getattr(getattr(view, "queryset", None), "model", None)
    subject = f"this {deleted_model._meta.verbose_name}" if deleted_model else "this object"

    counts = Counter(type(obj) for obj in exc.protected_objects)
    dependents = ", ".join(
        f"{count} {model._meta.verbose_name if count == 1 else model._meta.verbose_name_plural}"
        for model, count in counts.items()
    )
    return f"Cannot delete {subject}: it is still referenced by {dependents}."
