import json
from django.db import connection
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from tqdm import tqdm


# 🔥 Load model once
model = SentenceTransformer('all-MiniLM-L6-v2')


# 🔹 Create table + insert pairs
def prepare_paper_reviewer_table():
    with connection.cursor() as cursor:

        # Create table if not exists
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

        # 🔥 TRUNCATE (fast + resets table)
        cursor.execute("""
            TRUNCATE TABLE paper_to_reviewer RESTART IDENTITY;
        """)

        # Insert fresh data
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


# 🔹 Compute similarity
def compute_similarity_scores():
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

    ids = []
    paper_texts = []
    reviewer_texts = []

    print("📄 Preparing text data...")

    for row in tqdm(rows, desc="Preparing text"):
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

    print(f"🚀 Encoding {len(ids)} pairs...")

    paper_embeddings = model.encode(
        paper_texts,
        batch_size=64,
        show_progress_bar=True
    )

    reviewer_embeddings = model.encode(
        reviewer_texts,
        batch_size=64,
        show_progress_bar=True
    )

    print("🔄 Computing cosine similarity (vectorized)...")

    sims = cosine_similarity(paper_embeddings, reviewer_embeddings)

    similarities = []

    for i in tqdm(range(len(ids)), desc="Assigning scores"):
        sim = sims[i][i]
        sim = max(0.0, min(1.0, float(sim)))
        similarities.append((sim, ids[i]))

    print("💾 Writing to database...")

    with connection.cursor() as cursor:
        for pair in tqdm(similarities, desc="Updating DB"):
            cursor.execute("""
                UPDATE paper_to_reviewer
                SET similarity_score = %s
                WHERE id = %s
            """, pair)

    print(f"✅ Updated {len(similarities)} similarity scores")

    return {
        "status": "success",
        "updated": len(similarities)
    }


# 🔥 MAIN FUNCTION WITH OVERALL PROGRESS
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

    print("\n🎉 Done!")
    return result


# 🔥 Standalone run
if __name__ == "__main__":
    main()