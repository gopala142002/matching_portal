from django.db import models
from accounts.models import Researcher

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