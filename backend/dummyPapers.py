import os
import sys
import django
import random
from django.utils import timezone

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "matching_portal.settings")
django.setup()

from accounts.models import Researcher
from papers.models import Paper, PaperMetadata


NUM_PAPERS = 1000


titles = [
    "Deep Learning for Medical Diagnosis",
    "Graph Neural Networks for Recommendation Systems",
    "Federated Learning in Edge Computing",
    "Quantum Algorithms for Optimization",
    "AI for Climate Modeling",
    "Scalable Distributed Machine Learning Systems",
]

abstracts = [
    "This paper studies scalable machine learning techniques.",
    "We propose a novel architecture for distributed learning.",
    "Extensive experiments demonstrate strong results.",
    "A new framework for collaborative artificial intelligence.",
    "We evaluate modern AI systems in real-world environments.",
]


def generate_keywords():
    return ["AI", "Machine Learning", "Systems"]


def generate_domains():
    return ["Computer Science"]


def main():

    researchers = list(Researcher.objects.select_related("user").all())

    if not researchers:
        print("No researchers found")
        return

    for _ in range(NUM_PAPERS):

        # choose 1–4 random authors
        num_authors = random.randint(1, 4)
        authors = random.sample(researchers, num_authors)

        author_names = [a.name for a in authors]

        # ✅ FIX: use institutions (JSONB list)
        affiliations_set = set()

        for a in authors:
            inst_list = a.institutions or []

            for inst in inst_list:
                if isinstance(inst, str) and inst.strip():
                    affiliations_set.add(inst.strip())

        affiliations = list(affiliations_set)

        # create paper
        paper = Paper.objects.create(
            title=random.choice(titles),
            abstract=random.choice(abstracts),
            keywords=generate_keywords(),
            research_domain=generate_domains(),
            pdf_url="http://example.com/sample.pdf",
            status="submitted",
            created_at=timezone.now(),
            author=authors[0].user,
        )

        # create metadata
        PaperMetadata.objects.create(
            paper=paper,
            author_names=author_names,
            paper_affiliations=affiliations,  # JSON list
        )

    print(f"{NUM_PAPERS} papers inserted successfully.")


if __name__ == "__main__":
    main()