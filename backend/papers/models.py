from django.db import models
from django.conf import settings

class Paper(models.Model):
    title = models.CharField(max_length=500)
    abstract = models.TextField()
    keywords = models.JSONField(default=list)
    research_domain = models.JSONField(default=list)
    pdf_url = models.URLField()
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submitted_papers"
    )
    status = models.CharField(max_length=20, default="submitted")
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = "papers"
    def __str__(self):
        return self.title
    
class PaperMetadata(models.Model):
    paper = models.OneToOneField(
        Paper,
        on_delete=models.CASCADE,
        related_name="metadata"
    )
    author_names = models.JSONField(default=list)
    paper_affiliations = models.JSONField(default=list)

    class Meta:
        db_table = "paper_metadata"
    def __str__(self):
        return f"Metadata for Paper {self.paper.id}"

class PaperReview(models.Model):
    paper = models.ForeignKey(
        "papers.Paper",   
        on_delete=models.CASCADE,
        related_name="reviews"
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assigned_reviews"
    )
    review_status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("submitted", "Submitted")
        ],
        default="pending"
    )
    score = models.IntegerField(
        null=True,
        blank=True
    )
    comments = models.TextField(
        blank=True
    )
    class Meta:
        db_table = "paper_reviews"
        unique_together = ("paper", "reviewer")

    def __str__(self):
        return f"Review: Paper {self.paper.id} by Reviewer {self.reviewer.id}"
