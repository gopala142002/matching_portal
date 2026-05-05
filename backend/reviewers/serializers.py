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
    # Mapping to the fields inside the related Paper model
    paper_title = serializers.CharField(source="paper_id.title", read_only=True)
    paper_abstract = serializers.CharField(source="paper_id.abstract", read_only=True)
    # Ensure these fields exist on your Paper model
    pdf_url = serializers.CharField(source="paper_id.pdf_file.url", read_only=True) 

    class Meta:
        model = FinalAssignment
        fields = [
            "id",
            "paper_id", # This returns the ID
            "paper_title",
            "paper_abstract",
            "reviewer_status",
            "pdf_url",
            "paper_score", # Matches your model's 'paper_score'
            "comments"
        ]

class SubmitReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinalAssignment
        fields = ["paper_score", "comments"]