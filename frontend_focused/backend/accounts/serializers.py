from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from submissions.serializers import TeamMemberSerializer


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False, style={"input_type": "password"})


class CurrentUserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="get_full_name")
    team_member = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = ["id", "username", "full_name", "team_member"]

    @extend_schema_field(TeamMemberSerializer(allow_null=True))
    def get_team_member(self, user):
        team_member = getattr(user, "team_member", None)
        return TeamMemberSerializer(team_member).data if team_member else None
