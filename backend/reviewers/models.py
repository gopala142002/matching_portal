from django.db import models
from accounts.models import Researcher
from django.contrib.auth.models import User

    

class FinalAssignment(models.Model):
    paper_id = models.ForeignKey("papers.Paper", on_delete=models.CASCADE,db_column="paper_id")
    reviewer_id = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column="researcher_id"
    )

    reviewer_status = models.CharField(max_length=50, default="Pending")
    paper_score = models.BigIntegerField(null=True, blank=True)
    comments = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "final_assignment"