import json
import numpy as np
from django.db import connection
from sentence_transformers import SentenceTransformer
from tqdm import tqdm


# 🔥 Load model once
model = SentenceTransformer('all-MiniLM-L6-v2')


# 🔹 Create table + insert pairs
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

        # 🔥 TRUNCATE for fresh computation
        cursor.execute("""
            TRUNCATE TABLE paper_to_reviewer RESTART IDENTITY;
        """)

        cursor.execute("""
            INSERT INTO paper_to_reviewer (researcher_id, paper_id)
            SELECT
                r.id,
                pm.paper_id
            FROM researchers r
            CROSS JOIN paper_metadata pm
            WHERE r.is_reviewer
            AND NOT EXISTS (
                SELECT 1
                FROM jsonb_array_elements_text(r.institutions) AS inst
                JOIN jsonb_array_elements_text(pm.paper_affiliations) AS aff
                ON inst = aff
            );
        """)

    print("✅ paper_to_reviewer refreshed")


# 🔹 Clean text
def clean_text(text):
    if not text:
        return ""
    return str(text).lower().replace(",", " ").replace(";", " ")


# 🔹 Parse JSON safely
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


# 🔹 FAST similarity computation (batch + vectorized)
def compute_similarity_scores(batch_size=2000):

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT ptr.id,
                   p.keywords, p.research_domain,
                   r.keywords, r.research_interests
            FROM paper_to_reviewer ptr
            JOIN papers p ON ptr.paper_id = p.id
            JOIN researchers r ON ptr.researcher_id = r.id
        """)
        rows = cursor.fetchall()

    if not rows:
        print("❌ No data found")
        return {"status": "error", "message": "No data"}

    print(f"🚀 Processing {len(rows)} pairs...")

    similarities = []

    # 🔥 Batch processing (prevents memory crash)
    for start in tqdm(range(0, len(rows), batch_size), desc="Processing batches"):

        batch = rows[start:start + batch_size]

        ids = []
        paper_texts = []
        reviewer_texts = []

        for row in batch:
            ptr_id, p_kw, p_dom, r_kw, r_int = row

            p_kw = parse_field(p_kw)
            p_dom = parse_field(p_dom)
            r_kw = parse_field(r_kw)
            r_int = parse_field(r_int)

            paper_text = clean_text(f"{p_kw} {p_dom}")
            reviewer_text = clean_text(f"{r_kw} {r_int}")

            ids.append(ptr_id)
            paper_texts.append(paper_text)
            reviewer_texts.append(reviewer_text)

        # 🔥 Encode (batch)
        paper_emb = model.encode(paper_texts, batch_size=64, convert_to_numpy=True)
        reviewer_emb = model.encode(reviewer_texts, batch_size=64, convert_to_numpy=True)

        # 🔥 Normalize
        paper_emb /= np.linalg.norm(paper_emb, axis=1, keepdims=True)
        reviewer_emb /= np.linalg.norm(reviewer_emb, axis=1, keepdims=True)

        # 🔥 FAST cosine (row-wise)
        sims = np.sum(paper_emb * reviewer_emb, axis=1)

        # Store results
        for i in range(len(ids)):
            sim = float(max(0.0, min(1.0, sims[i])))
            similarities.append((sim, ids[i]))

    print("💾 Bulk updating database...")

    # 🔥 Bulk update (FAST)
    with connection.cursor() as cursor:
        cursor.executemany("""
            UPDATE paper_to_reviewer
            SET similarity_score = %s
            WHERE id = %s
        """, similarities)

    print(f"✅ Updated {len(similarities)} similarity scores")

    return {
        "status": "success",
        "updated": len(similarities)
    }


# 🔥 MAIN FUNCTION
def main():

    steps = [
        "Prepare Table",
        "Compute Similarity"
    ]

    overall = tqdm(total=len(steps), desc="Overall Progress")

    print("\n🔧 Step 1: Preparing table...")
    prepare_paper_reviewer_table()
    overall.update(1)

    print("\n🧠 Step 2: Computing similarity...")
    result = compute_similarity_scores()
    overall.update(1)

    overall.close()

    print("\n🎉 Completed!")
    return result


# 🔥 Standalone run
if __name__ == "__main__":
    main()