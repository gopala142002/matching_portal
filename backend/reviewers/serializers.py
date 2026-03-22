from rest_framework import serializers
from reviewers.models import Reviewer
from papers.models import PaperReview

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
    paper_title = serializers.CharField(source="paper.title", read_only=True)
    paper_abstract = serializers.CharField(source="paper.abstract", read_only=True)
    pdf_url=serializers.CharField(source="paper.pdf_url",read_only=True)
    class Meta:
        model = PaperReview
        fields = [
            "id",
            "paper",         
            "paper_title",
            "paper_abstract",
            "review_status",
            "pdf_url"
        ]
        
class SubmitReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaperReview
        fields = ["score", "comments"]
