from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models import Researcher
from reviewers.models import Reviewer


@receiver(post_save, sender=Researcher)
def sync_reviewer_table(sender, instance, created, **kwargs):

    if instance.is_reviewer:

        Reviewer.objects.update_or_create(
            researcher=instance,
            # defaults={
            #     "institutes": [instance.institution],
            #     "research_interests": instance.research_interests,
            #     "keywords": instance.keywords,
            # },
        )

    else:
        # If researcher is no longer reviewer remove entry
        Reviewer.objects.filter(researcher=instance).delete()