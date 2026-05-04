from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from accounts.models import Researcher

User = get_user_model()

# 🔐 Register Serializer
class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    name = serializers.CharField()
    institutions = serializers.ListField(child=serializers.CharField(), allow_empty=False)
    department = serializers.CharField()
    academic_position = serializers.CharField()
    research_interests = serializers.ListField(child=serializers.CharField(), allow_empty=False)
    keywords = serializers.ListField(child=serializers.CharField(), allow_empty=False)
    is_reviewer = serializers.BooleanField(required=False, default=False)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def _clean_list(self, values, lower=False):
        cleaned = []
        for v in values:
            v = v.strip()
            if not v:
                continue
            if lower:
                v = v.lower()
            cleaned.append(v)
        return list(dict.fromkeys(cleaned))

    def validate_keywords(self, value):
        return self._clean_list(value, lower=True)

    def validate_research_interests(self, value):
        return self._clean_list(value, lower=True)

    def validate_institutions(self, value):
        return self._clean_list(value, lower=False)

    @transaction.atomic
    def create(self, validated_data):
        email = validated_data["email"]
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"]
        )

        Researcher.objects.create(
            user=user,
            name=validated_data["name"],
            institutions=validated_data["institutions"],
            department=validated_data["department"],
            academic_position=validated_data["academic_position"],
            research_interests=validated_data["research_interests"],
            keywords=validated_data["keywords"],
            h_index=0,
            is_reviewer=validated_data.get("is_reviewer", False)
        )
        return user

# 🔐 Login Serializer (Resilient to duplicate emails)
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        email = data.get("email", "").strip().lower()
        password = data.get("password")
        
        if not email or not password:
            raise serializers.ValidationError("Email and password are required")

        # 💡 FIX: Using .filter().first() instead of .get() to prevent 
        # MultipleObjectsReturned crashes if duplicates exist in the DB.
        user_obj = User.objects.filter(email__iexact=email).first()
        
        if not user_obj:
            raise serializers.ValidationError("Invalid email or password")

        user = authenticate(username=user_obj.username, password=password)
        
        if not user:
            raise serializers.ValidationError("Invalid email or password")
            
        if not user.is_active:
            raise serializers.ValidationError("Account is disabled")

        data["user"] = user
        return data

# 👤 Researcher Profile Serializer
class ResearcherSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    class Meta:
        model = Researcher
        fields = [
            "id", "name", "email", "institutions", "department",
            "academic_position", "research_interests", "keywords",
            "h_index", "is_reviewer",
        ]

# 👨‍⚖️ Reviewer Update Serializer
class UpdateReviewerStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Researcher
        fields = ["is_reviewer"]