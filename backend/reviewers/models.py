from django.db import models
from accounts.models import Researcher
from django.contrib.auth.models import User
class Reviewer(models.Model):

    researcher = models.OneToOneField(
        Researcher,
        on_delete=models.CASCADE,
        related_name="reviewer"
    )

    # institutes = models.JSONField(default=list)
    # research_interests = models.JSONField(default=list)
    # keywords = models.JSONField(default=list)

    class Meta:
        db_table = "reviewers"

    def __str__(self):
        return self.researcher.name
    

class FinalAssignment(models.Model):
    paper = models.ForeignKey("papers.Paper", on_delete=models.CASCADE,db_column="paper_id")
    reviewer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column="researcher_id"
    )

    reviewer_status = models.CharField(max_length=50, default="Pending")
    score = models.BigIntegerField(null=True, blank=True)
    comments = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "final_assignment"