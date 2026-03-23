import gurobipy as gp
from gurobipy import GRB
from django.db import connection
from tqdm import tqdm


# 🔹 Load data
def load_data():
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT paper_id, researcher_id, similarity_score
            FROM paper_to_reviewer
            WHERE similarity_score IS NOT NULL
        """)
        rows = cursor.fetchall()

    papers, reviewers, weight = set(), set(), {}

    for p, r, s in rows:
        if s is not None:
            papers.add(p)
            reviewers.add(r)
            weight[(p, r)] = float(s)

    return list(papers), list(reviewers), weight


# 🔥 Fallback ILP for remaining edges
def solve_remaining_ilp(papers, reviewers, remaining_edges, fixed_assignments, k=3):

    print("⚙️ Running fallback ILP for remaining variables...")

    model = gp.Model("fallback_ilp")
    model.setParam("OutputFlag", 0)

    x = {
        (i, j): model.addVar(vtype=GRB.BINARY)
        for (i, j) in remaining_edges
    }

    # Paper constraints
    for i in papers:
        fixed_count = sum(1 for (pi, _) in fixed_assignments if pi == i)
        model.addConstr(
            gp.quicksum(x[i, j] for j in reviewers if (i, j) in x)
            + fixed_count == k
        )

    # Reviewer capacity
    for j in reviewers:
        fixed_count = sum(1 for (_, rj) in fixed_assignments if rj == j)
        model.addConstr(
            gp.quicksum(x[i, j] for i in papers if (i, j) in x)
            + fixed_count <= 6
        )

    model.setObjective(
        gp.quicksum(remaining_edges[(i, j)] * x[i, j] for (i, j) in x),
        GRB.MAXIMIZE
    )

    model.optimize()

    for (i, j), var in x.items():
        if var.X > 0.5:
            fixed_assignments.add((i, j))

    return fixed_assignments


# 🔥 Iterative Rounding Solver
def solve_matching_iterative(papers, reviewers, weight, k=3, epsilon=0):

    remaining_edges = {
        (i, j): w for (i, j), w in weight.items() if w >= epsilon
    }

    fixed_assignments = set()
    iteration = 0

    while True:
        iteration += 1
        print(f"\n🔁 Iteration {iteration} | Remaining edges: {len(remaining_edges)}")

        model = gp.Model("iterative_rounding")
        model.setParam("OutputFlag", 0)

        # LP relaxation
        x = {
            (i, j): model.addVar(lb=0, ub=1, vtype=GRB.CONTINUOUS)
            for (i, j) in remaining_edges
        }

        z = model.addVar(vtype=GRB.CONTINUOUS)

        # Paper constraints
        for i in papers:
            fixed_count = sum(1 for (pi, _) in fixed_assignments if pi == i)

            model.addConstr(
                gp.quicksum(x[i, j] for j in reviewers if (i, j) in x)
                + fixed_count == k
            )

        # Reviewer capacity
        for j in reviewers:
            fixed_count = sum(1 for (_, rj) in fixed_assignments if rj == j)

            model.addConstr(
                gp.quicksum(x[i, j] for i in papers if (i, j) in x)
                + fixed_count <= 6
            )

        # Objective
        model.setObjective(
            gp.quicksum(
                remaining_edges[(i, j)] * x[i, j]
                for (i, j) in x
            ),
            GRB.MAXIMIZE
        )

        model.optimize()

        if model.Status != GRB.OPTIMAL:
            print("❌ LP not optimal")
            break

        # 🔥 Fix high-confidence variables
        new_fixed = []
        for (i, j), var in x.items():
            if var.X >= 0.9:
                new_fixed.append((i, j))

        if not new_fixed:
            print("⚠️ No variables to fix → switching to fallback ILP")
            break

        print(f"✅ Fixing {len(new_fixed)} variables")

        for pair in new_fixed:
            fixed_assignments.add(pair)
            remaining_edges.pop(pair, None)

        # Check completion
        done = True
        for i in papers:
            count = sum(1 for (pi, _) in fixed_assignments if pi == i)
            if count < k:
                done = False
                break

        if done:
            print("🎯 All assignments completed via rounding")
            return fixed_assignments

    # 🔥 Fallback ILP
    if remaining_edges:
        fixed_assignments = solve_remaining_ilp(
            papers, reviewers, remaining_edges, fixed_assignments, k
        )

    return fixed_assignments


# 🔹 Save results
def save_allocation(assignments):

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


# 🔥 MAIN FUNCTION
def main_iterative():

    print("\n📊 Loading data...")
    papers, reviewers, weight = load_data()

    print(f"Papers: {len(papers)}, Reviewers: {len(reviewers)}")

    if not weight:
        return {"status": "error", "message": "No similarity data"}

    assignments = solve_matching_iterative(papers, reviewers, weight)

    if not assignments:
        return {"status": "error", "message": "No solution"}

    save_allocation(assignments)

    print("\n🎉 Iterative Matching Complete!")

    return {
        "status": "success",
        "assigned": len(assignments)
    }