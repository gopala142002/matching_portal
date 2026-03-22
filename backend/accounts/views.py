from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from accounts.serializers import (
    RegisterSerializer,
    LoginSerializer,
    ResearcherSerializer,
    UpdateReviewerStatusSerializer,   # ✅ added
)

from accounts.models import Researcher


@api_view(["POST"])
def register(request):
    serializer = RegisterSerializer(data=request.data)

    if not serializer.is_valid():
        if "email" in serializer.errors:
            return Response(
                {
                    "status": False,
                    "message": "This email is already registered. Please login."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "status": False,
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    user = serializer.save()
    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "status": True,
            "message": "User registered successfully",
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "is_admin": user.is_staff,
        },
        status=status.HTTP_201_CREATED
    )

@api_view(["POST"])
def login_view(request):
    serializer = LoginSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            {
                "status": False,
                "message": serializer.errors.get("non_field_errors", ["Invalid input"])[0]
            },
            status=status.HTTP_401_UNAUTHORIZED
        )

    user = serializer.validated_data["user"]
    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "status": True,
            "message": "Login successful",
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "is_admin": user.is_staff,
        },
        status=status.HTTP_200_OK
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def verify_token(request):
    return Response(
        {
            "status": True,
            "message": "Token is valid",
            "email": request.user.email,
            "is_admin": request.user.is_staff,
        },
        status=status.HTTP_200_OK
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):
    try:
        researcher = request.user.researcher
    except Researcher.DoesNotExist:
        return Response(
            {
                "status": False,
                "detail": "Researcher profile not found"
            },
            status=status.HTTP_404_NOT_FOUND
        )

    return Response(
        {
            "status": True,
            "profile": ResearcherSerializer(researcher).data,
            "is_admin": request.user.is_staff,   # ✅ added
        },
        status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    refresh_token = request.data.get("refresh")

    if not refresh_token:
        return Response(
            {"status": False, "message": "Refresh token required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except Exception as e:
        return Response(
            {"status": False, "message": "Invalid refresh token"},
            status=status.HTTP_400_BAD_REQUEST
        )

    return Response(
        {"status": True, "message": "Logged out successfully"},
        status=status.HTTP_200_OK
    )

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_reviewer_status(request):

    try:
        researcher = request.user.researcher
    except Researcher.DoesNotExist:
        return Response(
            {"status": False, "message": "Researcher not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = UpdateReviewerStatusSerializer(
        researcher,
        data=request.data,
        partial=True
    )

    if not serializer.is_valid():
        return Response(
            {"status": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer.save()

    return Response(
        {
            "status": True,
            "message": "Reviewer status updated",
            "is_reviewer": serializer.data["is_reviewer"]
        },
        status=status.HTTP_200_OK
    )



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def run_matching_algorithm(request):

    if not request.user.is_staff:
        return Response(
            {"status": False, "message": "Only admin allowed"},
            status=status.HTTP_403_FORBIDDEN
        )

    # 👉 TODO: Add your matching logic here
    # Example:
    # match_papers_to_reviewers()

    return Response(
        {
            "status": True,
            "message": "Matching algorithm executed successfully"
        },
        status=status.HTTP_200_OK
    )