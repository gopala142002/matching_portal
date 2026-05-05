from rest_framework import serializers
from .models import FinalAssignment


class ReviewerSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        fields = [
            "id",
            "reviewer_name",
            "email",
            "institutes",
            "research_domains",
            "keywords",
        ]


class AssignedPaperSerializer(serializers.ModelSerializer):
    # Use 'paper_id' (the model field name) instead of 'paper'
    paper_title = serializers.CharField(source="paper_id.title", read_only=True)
    paper_abstract = serializers.CharField(source="paper_id.abstract", read_only=True)
    pdf_url = serializers.CharField(source="paper_id.pdf_url", read_only=True)

    class Meta:
        model = FinalAssignment
        fields = [
            "id",
            "paper_id", # This will return the actual ID of the paper
            "paper_title",
            "paper_abstract",
            "reviewer_status",
            "pdf_url",
            "paper_score", # Ensure this matches your model field 'paper_score'
            "comments"
        ]

class SubmitReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinalAssignment
        fields = ["paper_score", "comments"]