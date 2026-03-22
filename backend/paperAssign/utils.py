from papers.models import Paper
from papers.models import PaperReview
from django.contrib.auth import get_user_model

User = get_user_model()

def run_assignment_algorithm():
    reviewer = User.objects.filter(is_staff=False).first()
    if not reviewer:
        return "No reviewer found!"
    papers = Paper.objects.all()
    assigned_count = 0
    for paper in papers:
        obj, created = PaperReview.objects.get_or_create(
            paper=paper,
            reviewer=reviewer,
            defaults={
                "review_status": "Pending"
            }
        )
        if created:
            assigned_count += 1
    return f"Assigned {assigned_count} papers to reviewer {reviewer.username}"
