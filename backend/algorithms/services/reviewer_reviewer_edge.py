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
def prepare_reviewer_graph():
    with connection.cursor() as cursor:

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reviewer_to_reviewer (
                id BIGSERIAL PRIMARY KEY,
                reviewer_id_left BIGINT NOT NULL,
                reviewer_id_right BIGINT NOT NULL,
                edge_weight DOUBLE PRECISION,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_left FOREIGN KEY (reviewer_id_left) REFERENCES researchers (id),
                CONSTRAINT fk_right FOREIGN KEY (reviewer_id_right) REFERENCES researchers (id),

                CONSTRAINT unique_pair UNIQUE (reviewer_id_left, reviewer_id_right)
            );
        """)

        cursor.execute("""
            TRUNCATE TABLE reviewer_to_reviewer RESTART IDENTITY;
        """)

        cursor.execute("""
            INSERT INTO reviewer_to_reviewer (reviewer_id_left, reviewer_id_right)
            SELECT r1.id, r2.id
            FROM researchers r1
            JOIN researchers r2
            ON r1.id < r2.id
            WHERE r1.is_reviewer = TRUE
              AND r2.is_reviewer = TRUE;
        """)

    print("reviewer_to_reviewer table ready")


# -------------------------------
# HELPERS
# -------------------------------
def parse_list_field(field):
    if not field:
        return []
    try:
        data = json.loads(field)
        if isinstance(data, list):
            return [str(x).lower() for x in data]
    except:
        pass
    return [str(field).lower()]


def clean_join(lst):
    return " ".join(lst)


def jaccard_similarity(list1, list2):
    set1, set2 = set(list1), set(list2)
    if not set1 or not set2:
        return 0.0
    return len(set1 & set2) / len(set1 | set2)


def compute_embedding_similarity(texts1, texts2):
    emb1 = model.encode(texts1, batch_size=64, convert_to_numpy=True)
    emb2 = model.encode(texts2, batch_size=64, convert_to_numpy=True)

    emb1 /= np.linalg.norm(emb1, axis=1, keepdims=True)
    emb2 /= np.linalg.norm(emb2, axis=1, keepdims=True)

    return np.sum(emb1 * emb2, axis=1)


# -------------------------------
# MAIN SIMILARITY FUNCTION
# -------------------------------
def compute_reviewer_similarity(batch_size=2000):

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT rtr.id,
                   r1.research_interests, r1.institutions,
                   r2.research_interests, r2.institutions
            FROM reviewer_to_reviewer rtr
            JOIN researchers r1 ON rtr.reviewer_id_left = r1.id
            JOIN researchers r2 ON rtr.reviewer_id_right = r2.id
        """)
        rows = cursor.fetchall()

    if not rows:
        print("No reviewer pairs found")
        return {"status": "error"}

    print(f"Processing {len(rows)} reviewer pairs...")

    similarities = []

    for start in tqdm(range(0, len(rows), batch_size), desc="Processing batches"):

        batch = rows[start:start + batch_size]

        ids = []

        int_left, int_right = [], []
        inst_sims = []

        for row in batch:
            rtr_id, l_int, l_inst, r_int, r_inst = row

            l_int_list = parse_list_field(l_int)
            r_int_list = parse_list_field(r_int)

            l_inst_list = parse_list_field(l_inst)
            r_inst_list = parse_list_field(r_inst)

            ids.append(rtr_id)

            # text for embedding
            int_left.append(clean_join(l_int_list))
            int_right.append(clean_join(r_int_list))

            # institution similarity
            inst_sims.append(jaccard_similarity(l_inst_list, r_inst_list))

        # embedding similarity (research interests)
        int_sims = compute_embedding_similarity(int_left, int_right)
        inst_sims = np.array(inst_sims)

        # combine scores
        for i in range(len(ids)):

            interest_sim = float(max(0.0, min(1.0, int_sims[i])))
            inst_sim = inst_sims[i]

            # final score:
            # high if interests match, penalize if same institution
            final_score = interest_sim * (1 - inst_sim)

            similarities.append((final_score, ids[i]))

    print("Updating edge weights...")

    with connection.cursor() as cursor:
        cursor.executemany("""
            UPDATE reviewer_to_reviewer
            SET edge_weight = %s
            WHERE id = %s
        """, similarities)

    print(f"Updated {len(similarities)} edges")

    return {
        "status": "success",
        "updated": len(similarities)
    }


# -------------------------------
# MAIN DRIVER
# -------------------------------
def main():

    steps = [
        "Prepare Graph",
        "Compute Similarity"
    ]

    overall = tqdm(total=len(steps), desc="Overall Progress")

    print("\nStep 1: Preparing reviewer graph...")
    prepare_reviewer_graph()
    overall.update(1)

    print("\nStep 2: Computing similarity...")
    result = compute_reviewer_similarity()
    overall.update(1)

    overall.close()

    print("\nCompleted!")
    return result


if __name__ == "__main__":
    main()