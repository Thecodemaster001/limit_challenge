from django.urls import path

from server.views import HealthCheckView

urlpatterns = [
    path("api/health/", HealthCheckView.as_view(), name="health"),
]
