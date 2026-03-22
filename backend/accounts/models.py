from django.conf import settings
from django.db import models


class Researcher(models.Model):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="researcher"
    )

    name = models.CharField(max_length=255)
    institutions = models.JSONField(default=list)
    department = models.CharField(max_length=255)
    academic_position = models.CharField(max_length=100)

    research_interests = models.JSONField(default=list)
    keywords = models.JSONField(default=list)

    h_index = models.IntegerField(null=True, blank=True)

    is_reviewer = models.BooleanField(default=False)

    class Meta:
        db_table = "researchers"

    def __str__(self):
        return self.name