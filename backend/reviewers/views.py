from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from papers.models import PaperReview
from .serializers import AssignedPaperSerializer,SubmitReviewSerializer

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
    
    pending_reviews=PaperReview.objects.filter(
        reviewer=reviewer,
        review_status="pending"
    )
    submitted_reviews=PaperReview.objects.filter(
        reviewer=reviewer,
        review_status="submitted"
    )
    pending_serializer = AssignedPaperSerializer(pending_reviews, many=True)
    submitted_serializer=AssignedPaperSerializer(submitted_reviews,many=True)
    # print(submitted_reviews)
    # print(pending_serializer.data)
    
    return Response({
        "status": True,
        "pending_papers":pending_serializer.data,
        "submitted_papers":submitted_serializer.data
    })
    
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_review(request,paper_id):
    reviewer = request.user
    try:
        review = PaperReview.objects.get(
            paper_id=paper_id,
            reviewer=reviewer
        )
    except PaperReview.DoesNotExist:
        return Response(
            {"error": "This paper is not assigned to you."},
            status=status.HTTP_403_FORBIDDEN
        )
    serializer = SubmitReviewSerializer(review, data=request.data)
    if serializer.is_valid():
        serializer.save(
            review_status="submitted"
        )
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

    try:
        review = PaperReview.objects.get(
            paper_id=paper_id,
            reviewer=reviewer
        )
    except PaperReview.DoesNotExist:
        return Response(
            {"error": "This paper is not assigned to you."},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = AssignedPaperSerializer(review)

    return Response({
        "status": True,
        "data": serializer.data
    })