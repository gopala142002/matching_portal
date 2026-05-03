import os
import sys
import django

# -------------------------------
# DJANGO SETUP
# -------------------------------
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "matching_portal.settings")
django.setup()

from django.db import connection, transaction
from gurobipy import Model, GRB, quicksum


# -------------------------------
# LOAD DATA
# -------------------------------
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


# -------------------------------
# SAVE FUNCTION (YOUR FORMAT)
# -------------------------------
def save_allocation(assignments):
    """
    assignments: set of (paper_id, reviewer_id)
    """
    assignments = list(assignments)

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM final_assignment")

            cursor.executemany("""
                INSERT INTO final_assignment (paper_id, researcher_id, reviewer_status)
                VALUES (%s, %s, 'pending')
            """, assignments)

            cursor.execute("""
                UPDATE papers
                SET status = 'Under review'
            """)

    print(f"Saved {len(assignments)} assignments.")
    return assignments


# -------------------------------
# ILP SOLVER
# -------------------------------
def solve_ilp(papers, reviewers, weight, k=3, c=6):

    model = Model("ReviewerAssignment")

    # VARIABLES
    x = model.addVars(
        [(p, r) for (p, r) in weight],
        vtype=GRB.BINARY,
        name="x"
    )

    z = model.addVar(vtype=GRB.CONTINUOUS, name="z")

    # -------------------------------
    # CONSTRAINTS
    # -------------------------------

    # Each paper gets exactly k reviewers
    for p in papers:
        model.addConstr(
            quicksum(x[p, r] for r in reviewers if (p, r) in x) == k,
            name=f"paper_{p}"
        )

    # Reviewer capacity
    for r in reviewers:
        model.addConstr(
            quicksum(x[p, r] for p in papers if (p, r) in x) <= c,
            name=f"reviewer_{r}"
        )

    # Fairness constraint
    for p in papers:
        model.addConstr(
            quicksum(weight.get((p, r), 0.0) * x[p, r]
                     for r in reviewers if (p, r) in x) >= z,
            name=f"fairness_{p}"
        )

    # OBJECTIVE
    model.setObjective(z, GRB.MAXIMIZE)

    model.setParam("OutputFlag", 1)

    # SOLVE
    model.optimize()

    if model.status != GRB.OPTIMAL:
        print("❌ No optimal solution found")
        return None

    # -------------------------------
    # EXTRACT RESULTS
    # -------------------------------
    assignments = {p: [] for p in papers}
    paper_scores = {}

    selected_pairs = set()

    for (p, r) in x:
        if x[p, r].X > 0.5:
            assignments[p].append(r)
            selected_pairs.add((int(p), int(r)))

    for p in papers:
        total = sum(weight.get((p, r), 0.0) for r in assignments[p])
        paper_scores[p] = total

    min_score = min(paper_scores.values()) if paper_scores else 0.0

    # -------------------------------
    # PRINT RESULTS
    # -------------------------------
    print("\n===== FINAL RESULTS =====")
    print(f"Minimum total edge weight (fairness score): {min_score:.4f}")

    # optional detailed view
    # for p in sorted(paper_scores):
    #     print(f"Paper {p}: {paper_scores[p]:.4f}")

    return selected_pairs, paper_scores, min_score


# -------------------------------
# MAIN
# -------------------------------
def main():

    print("Loading data from DB...")
    papers, reviewers, weight = load_data()

    print(f"Papers: {len(papers)}")
    print(f"Reviewers: {len(reviewers)}")
    print(f"Edges: {len(weight)}")

    # Feasibility check
    if len(papers) * 3 > len(reviewers) * 6:
        print("⚠️ WARNING: Problem may be infeasible!")

    result = solve_ilp(papers, reviewers, weight)

    if result is None:
        return

    selected_pairs, paper_scores, min_score = result

    # -------------------------------
    # SAVE TO DATABASE
    # -------------------------------
    print("\nSaving assignments to DB...")
    save_allocation(selected_pairs)

    return {
        "min_score": min_score,
        "assignments": selected_pairs,
        "paper_scores": paper_scores
    }


if __name__ == "__main__":
    main()