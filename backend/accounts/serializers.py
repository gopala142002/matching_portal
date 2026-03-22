from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db import transaction
from django.contrib.auth.password_validation import validate_password

from accounts.models import Researcher


class RegisterSerializer(serializers.Serializer):

    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    name = serializers.CharField()

    # ✅ FIXED: JSONB list field
    institutions = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=False
    )

    department = serializers.CharField()
    academic_position = serializers.CharField()

    research_interests = serializers.JSONField()
    keywords = serializers.JSONField()

    is_reviewer = serializers.BooleanField(required=False, default=False)


    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value


    def validate_password(self, value):
        validate_password(value)
        return value


    def validate_keywords(self, value):

        if isinstance(value, str):
            value = value.split(",")

        cleaned = [v.strip().lower() for v in value if v.strip()]
        return list(dict.fromkeys(cleaned))


    def validate_research_interests(self, value):

        if isinstance(value, str):
            value = value.split(",")

        cleaned = [v.strip().lower() for v in value if v.strip()]
        return list(dict.fromkeys(cleaned))


    @transaction.atomic
    def create(self, validated_data):

        email = validated_data["email"]

        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"]
        )

        researcher = Researcher.objects.create(
            user=user,
            name=validated_data["name"],
            institutions=validated_data["institutions"],   # ✅ FIXED
            department=validated_data["department"],
            academic_position=validated_data["academic_position"],
            research_interests=validated_data["research_interests"],
            keywords=validated_data["keywords"],
            h_index=0,
            is_reviewer=validated_data.get("is_reviewer", False)
        )

        return user


class LoginSerializer(serializers.Serializer):

    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            raise serializers.ValidationError("Email and password are required")

        try:
            user_obj = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials")

        user = authenticate(username=user_obj.username, password=password)

        if not user:
            raise serializers.ValidationError("Invalid credentials")

        if not user.is_active:
            raise serializers.ValidationError("This account is disabled")

        data["user"] = user
        return data


class ResearcherSerializer(serializers.ModelSerializer):

    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Researcher
        fields = [
            "id",
            "name",
            "email",
            "institutions",   # ✅ FIXED
            "department",
            "academic_position",
            "research_interests",
            "keywords",
            "h_index",
            "is_reviewer",
        ]


class UpdateReviewerStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Researcher
        fields = ["is_reviewer"]