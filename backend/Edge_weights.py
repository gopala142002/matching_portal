import os
import sys
import django
import gurobipy as gp
from gurobipy import GRB
from django.db import connection

# Django setup
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "matching_portal.settings")
django.setup()


# 🔹 Load data
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
        papers.add(p)
        reviewers.add(r)
        weight[(p, r)] = float(s)

    return list(papers), list(reviewers), weight


# 🔹 Solve matching
def solve_matching(papers, reviewers, weight, k=3, epsilon=0.3):

    model = gp.Model("reviewer_assignment")

    # 🔥 PERFORMANCE SETTINGS
    model.setParam("MIPGap", 0.03)      # ✅ 2% gap
    model.setParam("TimeLimit", 60)     # optional safety (1 min max)

    # Only valid edges
    x = {
        (i, j): model.addVar(vtype=GRB.BINARY)
        for (i, j) in weight if weight[(i, j)] >= epsilon
    }

    z = model.addVar(vtype=GRB.CONTINUOUS, name="z")

    # Each paper gets k reviewers
    for i in papers:
        model.addConstr(
            gp.quicksum(x[i, j] for j in reviewers if (i, j) in x) == k
        )

    # Reviewer max load = 6
    for j in reviewers:
        model.addConstr(
            gp.quicksum(x[i, j] for i in papers if (i, j) in x) <= 6
        )

    # Min-max fairness
    for i in papers:
        model.addConstr(
            z <= gp.quicksum(weight[(i, j)] * x[i, j] for j in reviewers if (i, j) in x)
        )

    model.setObjective(z, GRB.MAXIMIZE)

    print("Optimizing (2% gap)...")

    try:
        model.optimize()
    except KeyboardInterrupt:
        print("⏹️ Interrupted by user")

    return model, x, z


# 🔹 Save results
def save_allocation(x):

    assignments = [
        (i, j)
        for (i, j), var in x.items()
        if var.x > 0.5
    ]

    with connection.cursor() as cursor:

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS final_assignment (
                paper_id BIGINT,
                researcher_id BIGINT
            )
        """)

        cursor.execute("DELETE FROM final_assignment")

        cursor.executemany("""
            INSERT INTO final_assignment (paper_id, researcher_id)
            VALUES (%s, %s)
        """, assignments)

    print(f"✅ Saved {len(assignments)} assignments")


# 🔥 MAIN
def main():

    print("Loading data...")
    papers, reviewers, weight = load_data()

    print(f"Papers: {len(papers)}, Reviewers: {len(reviewers)}")

    model, x, z = solve_matching(papers, reviewers, weight)

    # ✅ IMPORTANT: Accept ANY feasible solution (not just optimal)
    if model.SolCount > 0:
        print(f"\nBest found score: {z.x:.4f}")
        save_allocation(x)
        print("🎉 Assignment complete!")
    else:
        print("❌ No feasible solution found")
        print("👉 Try lowering epsilon or increasing max_load")


if __name__ == "__main__":
    main()