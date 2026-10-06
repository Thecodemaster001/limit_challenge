from rest_framework.routers import DefaultRouter

from submissions import views

router = DefaultRouter()
router.register("submissions", views.SubmissionViewSet, basename="submission")
router.register("brokers", views.BrokerViewSet, basename="broker")
router.register("team-members", views.TeamMemberViewSet, basename="team-member")

urlpatterns = router.urls
