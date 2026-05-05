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
    # Use select_related('paper_id') to optimize database hits
    assignments = FinalAssignment.objects.filter(
        reviewer_id=request.user
    ).select_related("paper_id")

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
    assignment = FinalAssignment.objects.filter(
        paper_id=paper_id,
        reviewer_id=request.user
    ).first()

    if not assignment:
        return Response(
            {"error": "Assignment not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    if assignment.reviewer_status == "Submitted":
        return Response(
            {"error": "Review already submitted."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Use the specific review serializer
    serializer = SubmitReviewSerializer(assignment, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save(reviewer_status="Submitted")
        return Response({
            "status": True,
            "message": "Review submitted successfully!"
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