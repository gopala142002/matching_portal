import gurobipy as gp
from gurobipy import GRB
from django.db import connection
from tqdm import tqdm


# 🔹 Load data (ONLY uses already computed similarity)
def load_data():
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT paper_id, researcher_id, similarity_score
            FROM paper_to_reviewer
            WHERE similarity_score IS NOT NULL
        """)
        rows = cursor.fetchall()

    papers = set()
    reviewers = set()
    weight = {}

    for p, r, s in rows:
        if s is not None:
            papers.add(p)
            reviewers.add(r)
            weight[(p, r)] = float(s)

    return list(papers), list(reviewers), weight


# 🔹 Solve matching
def solve_matching(papers, reviewers, weight, k=3, epsilon=0.3):

    model = gp.Model("reviewer_assignment")

    model.setParam("MIPGap", 0.03)
    model.setParam("TimeLimit", 60)

    # Only valid edges
    x = {
        (i, j): model.addVar(vtype=GRB.BINARY)
        for (i, j) in weight if weight[(i, j)] >= epsilon
    }

    if not x:
        print("❌ No valid edges (check similarity or epsilon)")
        return None, None, None

    z = model.addVar(vtype=GRB.CONTINUOUS, name="z")

    # Each paper gets k reviewers
    for i in papers:
        model.addConstr(
            gp.quicksum(x[i, j] for j in reviewers if (i, j) in x) == k
        )

    # Reviewer capacity
    for j in reviewers:
        model.addConstr(
            gp.quicksum(x[i, j] for i in papers if (i, j) in x) <= 6
        )

    # Fairness constraint
    for i in papers:
        model.addConstr(
            z <= gp.quicksum(
                weight[(i, j)] * x[i, j]
                for j in reviewers if (i, j) in x
            )
        )

    model.setObjective(z, GRB.MAXIMIZE)

    print("🚀 Optimizing...")

    try:
        model.optimize()
    except KeyboardInterrupt:
        print("⏹️ Interrupted")

    return model, x, z


# 🔹 Save results
def save_allocation(x):

    assignments = [
        (i, j)
        for (i, j), var in x.items()
        if var.X > 0.5
    ]

    with connection.cursor() as cursor:

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS final_assignment (
                paper_id BIGINT,
                researcher_id BIGINT
            )
        """)

        cursor.execute("DELETE FROM final_assignment")

        for pair in tqdm(assignments, desc="Saving assignments"):
            cursor.execute("""
                INSERT INTO final_assignment (paper_id, researcher_id)
                VALUES (%s, %s)
            """, pair)

    print(f"✅ Saved {len(assignments)} assignments")


# 🔥 MAIN (ONLY ILP)
def main():

    steps = [
        "Load Data",
        "Solve ILP",
        "Save Results"
    ]

    pbar = tqdm(total=len(steps), desc="ILP Progress")

    # Step 1
    print("\n📊 Loading data...")
    papers, reviewers, weight = load_data()
    pbar.update(1)

    print(f"Papers: {len(papers)}, Reviewers: {len(reviewers)}")

    if not weight:
        print("❌ No similarity data found. Run similarity API first.")
        pbar.close()
        return {"status": "error", "message": "No similarity data"}

    # Step 2
    model, x, z = solve_matching(papers, reviewers, weight)
    pbar.update(1)

    if model is None or model.SolCount == 0:
        print("❌ No feasible solution")
        pbar.close()
        return {"status": "error", "message": "No solution"}

    print(f"\n🏆 Best score: {z.X:.4f}")

    # Step 3
    save_allocation(x)
    pbar.update(1)

    pbar.close()

    print("\n🎉 Matching complete!")

    return {
        "status": "success",
        "score": float(z.X)
    }