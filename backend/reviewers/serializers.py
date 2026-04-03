from rest_framework import serializers
from reviewers.models import Reviewer
from .models import FinalAssignment


class ReviewerSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Reviewer
        fields = [
            "id",
            "reviewer_name",
            "email",
            "institutes",
            "research_domains",
            "keywords",
        ]


class AssignedPaperSerializer(serializers.ModelSerializer):
    paper_id = serializers.IntegerField(source="paper.id", read_only=True)
    paper_title = serializers.CharField(source="paper.title", read_only=True)
    paper_abstract = serializers.CharField(source="paper.abstract", read_only=True)
    pdf_url = serializers.CharField(source="paper.pdf_url", read_only=True)

    class Meta:
        model = FinalAssignment
        fields = [
            "id",
            "paper_id",
            "paper_title",
            "paper_abstract",
            "reviewer_status",
            "pdf_url",
            "score",
            "comments"
        ]


class SubmitReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinalAssignment
        fields = ["score", "comments"]