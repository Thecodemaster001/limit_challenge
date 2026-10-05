from django.contrib import admin
from django.urls import include, path

from server.views import HealthCheckView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", HealthCheckView.as_view(), name="health"),
    path("api/", include("fleet.urls")),
]
