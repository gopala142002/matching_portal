import os
import sys
import django

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "matching_portal.settings")
django.setup()

import json
import numpy as np
from django.db import connection
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

model = SentenceTransformer('all-MiniLM-L6-v2')


# -------------------------------
# TABLE PREPARATION
# -------------------------------
def prepare_paper_reviewer_table():
    with connection.cursor() as cursor:

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS paper_to_reviewer (
                id BIGSERIAL PRIMARY KEY,
                researcher_id BIGINT NOT NULL,
                paper_id BIGINT NOT NULL,
                similarity_score DOUBLE PRECISION,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_researcher FOREIGN KEY (researcher_id) REFERENCES researchers (id),
                CONSTRAINT fk_paper FOREIGN KEY (paper_id) REFERENCES papers (id),
                CONSTRAINT unique_match UNIQUE (researcher_id, paper_id)
            );
        """)

        cursor.execute("""
            TRUNCATE TABLE paper_to_reviewer RESTART IDENTITY;
        """)

        # IMPORTANT: No institution filtering anymore
        cursor.execute("""
            INSERT INTO paper_to_reviewer (researcher_id, paper_id)
            SELECT r.id, p.id
            FROM researchers r
            CROSS JOIN papers p
            WHERE r.is_reviewer = TRUE;
        """)

    print("paper_to_reviewer refreshed")


# -------------------------------
# HELPERS
# -------------------------------
def clean_text(text):
    if not text:
        return ""
    return str(text).lower().replace(",", " ").replace(";", " ")


def parse_field(field):
    if not field:
        return ""
    try:
        data = json.loads(field)
        if isinstance(data, list):
            return " ".join(data)
    except:
        pass
    return str(field)


def get_overlap_score(inst1, inst2):
    """
    Jaccard similarity between institution sets
    """
    try:
        set1 = set(json.loads(inst1))
        set2 = set(json.loads(inst2))
    except:
        return 0.0

    if not set1 or not set2:
        return 0.0

    intersection = len(set1 & set2)
    union = len(set1 | set2)

    return intersection / union


# -------------------------------
# MAIN SCORING FUNCTION
# -------------------------------
def compute_similarity_scores(batch_size=2000):

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT ptr.id,
                   p.keywords,
                   r.research_interests,
                   r.institutions,
                   p.paper_affiliations
            FROM paper_to_reviewer ptr
            JOIN papers p ON ptr.paper_id = p.id
            JOIN researchers r ON ptr.researcher_id = r.id
            WHERE r.is_reviewer = TRUE;
        """)
        rows = cursor.fetchall()

    if not rows:
        print("No data found")
        return {"status": "error", "message": "No data"}

    print(f"Processing {len(rows)} pairs...")

    similarities = []

    for start in tqdm(range(0, len(rows), batch_size), desc="Processing batches"):

        batch = rows[start:start + batch_size]

        ids = []
        paper_texts = []
        reviewer_texts = []
        r_inst_list = []
        p_aff_list = []

        for row in batch:
            ptr_id, p_kw, r_int, r_inst, p_aff = row

            p_kw = parse_field(p_kw)
            r_int = parse_field(r_int)

            paper_text = clean_text(p_kw)
            reviewer_text = clean_text(r_int)

            ids.append(ptr_id)
            paper_texts.append(paper_text)
            reviewer_texts.append(reviewer_text)

            r_inst_list.append(r_inst)
            p_aff_list.append(p_aff)

        # Embeddings
        paper_emb = model.encode(paper_texts, batch_size=64, convert_to_numpy=True)
        reviewer_emb = model.encode(reviewer_texts, batch_size=64, convert_to_numpy=True)

        # Normalize
        paper_emb /= np.linalg.norm(paper_emb, axis=1, keepdims=True)
        reviewer_emb /= np.linalg.norm(reviewer_emb, axis=1, keepdims=True)

        sims = np.sum(paper_emb * reviewer_emb, axis=1)

        # Combine with institution penalty
        for i in range(len(ids)):
            keyword_sim = float(max(0.0, min(1.0, sims[i])))

            inst_overlap = get_overlap_score(r_inst_list[i], p_aff_list[i])

            # Final score
            final_score = keyword_sim * (1 - inst_overlap)

            similarities.append((final_score, ids[i]))

    print("Bulk updating database...")

    with connection.cursor() as cursor:
        cursor.executemany("""
            UPDATE paper_to_reviewer
            SET similarity_score = %s
            WHERE id = %s
        """, similarities)

    print(f"Updated {len(similarities)} similarity scores")

    return {
        "status": "success",
        "updated": len(similarities)
    }


# -------------------------------
# MAIN DRIVER
# -------------------------------
def main():

    steps = [
        "Prepare Table",
        "Compute Similarity"
    ]

    overall = tqdm(total=len(steps), desc="Overall Progress")

    print("\nStep 1: Preparing table...")
    prepare_paper_reviewer_table()
    overall.update(1)

    print("\nStep 2: Computing similarity...")
    result = compute_similarity_scores()
    overall.update(1)

    overall.close()

    print("\nCompleted!")
    return result


if __name__ == "__main__":
    main()