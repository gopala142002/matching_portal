from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.serializers import (
    RegisterSerializer,
    LoginSerializer,
    ResearcherSerializer,
    UpdateReviewerStatusSerializer,
)
from accounts.models import Researcher

@api_view(["POST"])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        if "email" in serializer.errors:
            return Response({"status": False, "message": "Email already registered."}, status=400)
        return Response({"status": False, "errors": serializer.errors}, status=400)

    user = serializer.save()
    refresh = RefreshToken.for_user(user)
    return Response({
        "status": True,
        "message": "User registered successfully",
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "is_admin": user.is_staff,
    }, status=201)

@api_view(["POST"])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            "status": False,
            "message": serializer.errors.get("non_field_errors", ["Invalid credentials"])[0]
        }, status=401)

    user = serializer.validated_data["user"]
    refresh = RefreshToken.for_user(user)
    return Response({
        "status": True,
        "message": "Login successful",
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "is_admin": user.is_staff,
    }, status=200)

@api_view(["POST"])
def admin_login_view(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"status": False, "message": "Invalid credentials"}, status=401)

    user = serializer.validated_data["user"]
    if not user.is_staff: 
        return Response({"status": False, "message": "Not an admin account"}, status=403)

    refresh = RefreshToken.for_user(user)
    return Response({
        "status": True,
        "message": "Admin login successful",
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "is_admin": True,
    }, status=200)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def verify_token(request):
    return Response({
        "status": True,
        "message": "Token is valid",
        "email": request.user.email,
        "is_admin": request.user.is_staff,
    }, status=200)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):
    try:
        researcher = request.user.researcher
        return Response({
            "status": True,
            "profile": ResearcherSerializer(researcher).data,
            "is_admin": request.user.is_staff,
        }, status=200)
    except Researcher.DoesNotExist:
        return Response({"status": False, "message": "Profile not found"}, status=404)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    refresh_token = request.data.get("refresh")
    if not refresh_token:
        return Response({"status": False, "message": "Refresh token required"}, status=400)
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"status": True, "message": "Logged out successfully"}, status=200)
    except Exception:
        return Response({"status": False, "message": "Invalid token"}, status=400)

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_reviewer_status(request):
    try:
        researcher = request.user.researcher
        serializer = UpdateReviewerStatusSerializer(researcher, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "status": True,
                "message": "Status updated",
                "is_reviewer": serializer.data["is_reviewer"]
            }, status=200)
        return Response({"status": False, "errors": serializer.errors}, status=400)
    except Researcher.DoesNotExist:
        return Response({"status": False}, status=404)