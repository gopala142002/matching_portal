from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import FinalAssignment
from .serializers import AssignedPaperSerializer, SubmitReviewSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reviewer_profile(request):
    return Response({
        "status": True,
        "message": "Reviewer profile working!",
        "user": request.user.email
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def assigned_papers(request):
    reviewer = request.user

    assignments = FinalAssignment.objects.filter(
        reviewer=reviewer
    ).select_related("paper")

    pending = assignments.filter(reviewer_status="Pending")
    submitted = assignments.filter(reviewer_status="Submitted")

    return Response({
        "status": True,
        "pending_papers": AssignedPaperSerializer(pending, many=True).data,
        "submitted_papers": AssignedPaperSerializer(submitted, many=True).data
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_review(request, paper_id):
    reviewer = request.user

    assignment = FinalAssignment.objects.filter(
        paper_id=paper_id,
        reviewer=reviewer
    ).first()

    if not assignment:
        return Response(
            {"error": "This paper is not assigned to you."},
            status=status.HTTP_403_FORBIDDEN
        )

    if assignment.reviewer_status == "Submitted":
        return Response(
            {"error": "Review already submitted."},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = SubmitReviewSerializer(assignment, data=request.data)
    if serializer.is_valid():
        serializer.save(reviewer_status="Submitted")

        return Response({
            "status": True,
            "message": "Review submitted successfully!",
            "data": serializer.data
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reviewer_paper_detail(request, paper_id):
    reviewer = request.user

    assignment = FinalAssignment.objects.filter(
        paper_id=paper_id,
        reviewer=reviewer
    ).select_related("paper").first()

    if not assignment:
        return Response(
            {"error": "This paper is not assigned to you."},
            status=status.HTTP_403_FORBIDDEN
        )

    return Response({
        "status": True,
        "data": AssignedPaperSerializer(assignment).data
    })