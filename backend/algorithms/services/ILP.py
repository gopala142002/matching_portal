import gurobipy as gp
from gurobipy import GRB
from django.db import connection, transaction
from tqdm import tqdm


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

K = 3          # reviewers required per paper
MAX_LOAD = 6   # maximum papers a single reviewer can handle
EPSILON = 0  # minimum similarity score to consider an edge


# ---------------------------------------------------------------------------
# Data Loading
# ---------------------------------------------------------------------------

def load_data():
    """
    Load paper-reviewer similarity scores from the database.

    Returns
    -------
    papers   : list of paper IDs
    reviewers: list of reviewer IDs
    weight   : dict {(paper_id, reviewer_id): similarity_score}
    """
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


# ---------------------------------------------------------------------------
# Feasibility Check
# ---------------------------------------------------------------------------

def check_feasibility(papers, reviewers, weight, k=K, max_load=MAX_LOAD):
    """
    Pre-solve checks to catch obvious infeasibility early.

    Returns True if the problem *might* be feasible, False otherwise.
    """
    feasible = True

    # 1. Global capacity: total reviewer slots must cover total demand
    total_demand = len(papers) * k
    total_capacity = len(reviewers) * max_load
    if total_capacity < total_demand:
        print(
            f"  Infeasible: total reviewer capacity ({total_capacity}) "
            f"< total demand ({total_demand})."
        )
        feasible = False

    # 2. Per-paper candidate count: each paper needs at least k candidates
    from collections import defaultdict
    paper_candidates = defaultdict(int)
    for (p, r) in weight:
        paper_candidates[p] += 1

    short = [p for p in papers if paper_candidates[p] < k]
    if short:
        print(
            f"  {len(short)} paper(s) have fewer than k={k} reviewer "
            f"candidates after epsilon filtering. "
            f"Example paper IDs: {short[:5]}"
        )
        feasible = False

    return feasible


# ---------------------------------------------------------------------------
# ILP Solver
# ---------------------------------------------------------------------------

def solve_matching(papers, reviewers, weight, k=K, max_load=MAX_LOAD,
                   epsilon=EPSILON, time_limit=None):
    """
    Solve the reviewer-assignment ILP.

    Objective
    ---------
    Maximise total similarity (sum of weight * x over all assignments).

    Constraints
    -----------
    - Each paper is assigned exactly k reviewers.
    - Each reviewer handles at most max_load papers.
    - Only edges with weight >= epsilon are considered.

    Parameters
    ----------
    papers     : list of paper IDs
    reviewers  : list of reviewer IDs
    weight     : dict {(paper_id, reviewer_id): float}
    k          : number of reviewers per paper
    max_load   : max papers per reviewer
    epsilon    : minimum similarity threshold
    time_limit : optional Gurobi time limit in seconds

    Returns
    -------
    model, x
        model : Gurobi Model object (or None on failure)
        x     : dict of Gurobi binary variables {(paper_id, reviewer_id): Var}
    """
    model = gp.Model("reviewer_assignment")

    # Suppress default Gurobi banner; keep solving output
    model.setParam("OutputFlag", 1)

    if time_limit is not None:
        model.setParam("TimeLimit", time_limit)

    # ------------------------------------------------------------------
    # Decision variables
    # x[i, j] = 1  if paper i is assigned to reviewer j
    # ------------------------------------------------------------------
    x = {
        (i, j): model.addVar(vtype=GRB.BINARY, name=f"x_{i}_{j}")
        for (i, j) in weight
        if weight[(i, j)] >= epsilon
    }

    if not x:
        print("  No valid edges found (check similarity scores or epsilon).")
        return None, None

    # ------------------------------------------------------------------
    # Constraints
    # ------------------------------------------------------------------

    # Each paper must receive exactly k reviewer assignments
    for i in papers:
        assigned = [x[i, j] for j in reviewers if (i, j) in x]
        model.addConstr(
            gp.quicksum(assigned) == k,
            name=f"paper_demand_{i}"
        )

    # Each reviewer handles at most max_load papers
    for j in reviewers:
        model.addConstr(
            gp.quicksum(x[i, j] for i in papers if (i, j) in x) <= max_load,
            name=f"reviewer_capacity_{j}"
        )

    # ------------------------------------------------------------------
    # Objective: maximise total similarity
    # ------------------------------------------------------------------
    model.setObjective(
        gp.quicksum(weight[(i, j)] * x[i, j] for (i, j) in x),
        GRB.MAXIMIZE
    )

    # ------------------------------------------------------------------
    # Solve
    # ------------------------------------------------------------------
    print("  Optimising...")
    try:
        model.optimize()
    except KeyboardInterrupt:
        print("  Optimisation interrupted by user.")

    return model, x


# ---------------------------------------------------------------------------
# (Optional) Max-Min / Fairness variant
# ---------------------------------------------------------------------------

def solve_matching_fairness(papers, reviewers, weight, k=K, max_load=MAX_LOAD,
                             epsilon=EPSILON, time_limit=None):
    """
    Fairness-aware variant: maximise the *minimum* per-paper similarity sum.

    This ensures no paper receives a very poor reviewer panel even if it
    reduces the global total slightly.
    """
    model = gp.Model("reviewer_assignment_fairness")
    model.setParam("OutputFlag", 1)

    if time_limit is not None:
        model.setParam("TimeLimit", time_limit)

    x = {
        (i, j): model.addVar(vtype=GRB.BINARY, name=f"x_{i}_{j}")
        for (i, j) in weight
        if weight[(i, j)] >= epsilon
    }

    if not x:
        print("  No valid edges found.")
        return None, None

    # z is the minimum paper score — must be CONTINUOUS, not binary
    z = model.addVar(vtype=GRB.CONTINUOUS, lb=0.0, name="z")

    # Paper demand
    for i in papers:
        assigned = [x[i, j] for j in reviewers if (i, j) in x]
        model.addConstr(gp.quicksum(assigned) == k,
                        name=f"paper_demand_{i}")

    # Reviewer capacity
    for j in reviewers:
        model.addConstr(
            gp.quicksum(x[i, j] for i in papers if (i, j) in x) <= max_load,
            name=f"reviewer_capacity_{j}"
        )

    # z is a lower bound on every paper's total similarity score
    for i in papers:
        model.addConstr(
            z <= gp.quicksum(
                weight[(i, j)] * x[i, j]
                for j in reviewers if (i, j) in x
            ),
            name=f"min_score_{i}"
        )

    model.setObjective(z, GRB.MAXIMIZE)

    print("  Optimising (fairness mode)...")
    try:
        model.optimize()
    except KeyboardInterrupt:
        print("  Optimisation interrupted by user.")

    return model, x


# ---------------------------------------------------------------------------
# Save Results
# ---------------------------------------------------------------------------

def save_allocation(x):
    """
    Persist the ILP solution to the final_assignment table.

    Uses executemany for efficiency and wraps everything in a single
    atomic transaction so partial writes never occur.
    """
    assignments = [
        (i, j)
        for (i, j), var in x.items()
        if var.X > 0.5
    ]

    with transaction.atomic():
        with connection.cursor() as cursor:

            cursor.execute("DELETE FROM final_assignment")

            cursor.executemany("""
                INSERT INTO final_assignment (paper_id, researcher_id)
                VALUES (%s, %s)
            """, assignments)

            cursor.execute("""
                UPDATE final_assignment
                SET reviewer_status = 'pending'
            """)
            
            cursor.execute("""
                UPDATE papers
                SET status = 'Under review'
            """)

    print(f"  Saved {len(assignments)} assignments.")
    return assignments


# ---------------------------------------------------------------------------
# Main Entry Point
# ---------------------------------------------------------------------------

def main(k=K, max_load=MAX_LOAD, epsilon=EPSILON,
         fairness=True, time_limit=None):
    """
    Run the full pipeline:
      1. Load similarity data from the database.
      2. Check feasibility.
      3. Solve the ILP.
      4. Save the solution.

    Parameters
    ----------
    k          : reviewers per paper (default 3)
    max_load   : max papers per reviewer (default 6)
    epsilon    : minimum similarity threshold (default 0)
    fairness   : if True, use the max-min (fairness) objective
    time_limit : optional solver time limit in seconds

    Returns
    -------
    dict with status and objective value
    """
    steps = ["Load Data", "Feasibility Check", "Solve ILP", "Save Results"]
    pbar = tqdm(total=len(steps), desc="ILP Pipeline")

    # ------------------------------------------------------------------
    # Step 1: Load data
    # ------------------------------------------------------------------
    print("\n  Loading data...")
    papers, reviewers, weight = load_data()
    pbar.update(1)

    print(f"  Papers: {len(papers)},  Reviewers: {len(reviewers)},  "
          f"Edges: {len(weight)}")

    if not weight:
        print("  No similarity data found. Run the similarity API first.")
        pbar.close()
        return {"status": "error", "message": "No similarity data"}

    # ------------------------------------------------------------------
    # Step 2: Feasibility check
    # ------------------------------------------------------------------
    print("\n  Checking feasibility...")
    if not check_feasibility(papers, reviewers, weight, k=k, max_load=max_load):
        pbar.close()
        return {"status": "error", "message": "Pre-solve feasibility check failed"}
    pbar.update(1)

    # ------------------------------------------------------------------
    # Step 3: Solve
    # ------------------------------------------------------------------
    print(f"\n  Solving ({'fairness/max-min' if fairness else 'total similarity'} objective)...")

    if fairness:
        model, x = solve_matching_fairness(
            papers, reviewers, weight,
            k=k, max_load=max_load, epsilon=epsilon, time_limit=time_limit
        )
    else:
        model, x = solve_matching(
            papers, reviewers, weight,
            k=k, max_load=max_load, epsilon=epsilon, time_limit=time_limit
        )
    pbar.update(1)

    if model is None or model.SolCount == 0:
        print("  No feasible solution found.")
        pbar.close()
        return {"status": "error", "message": "No feasible solution"}

    obj_value = model.ObjVal
    print(f"\n  Objective value: {obj_value:.4f}")

    if model.Status == GRB.OPTIMAL:
        print("  Solution is optimal.")
    else:
        print(f"  Solution is feasible but not proven optimal "
              f"(Gurobi status code: {model.Status}).")

    # ------------------------------------------------------------------
    # Step 4: Save
    # ------------------------------------------------------------------
    print("\n  Saving assignments...")
    save_allocation(x)
    pbar.update(1)

    pbar.close()
    print("\n  Matching complete!")

    return {
        "status": "success",
        "objective": float(obj_value),
        "mode": "fairness" if fairness else "total_similarity",
    }


# ---------------------------------------------------------------------------
# CLI usage
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Reviewer Assignment ILP")
    parser.add_argument("--k",          type=int,   default=K,
                        help="Reviewers per paper")
    parser.add_argument("--max-load",   type=int,   default=MAX_LOAD,
                        help="Max papers per reviewer")
    parser.add_argument("--epsilon",    type=float, default=EPSILON,
                        help="Minimum similarity threshold")
    parser.add_argument("--fairness",   action="store_true",
                        help="Use max-min fairness objective")
    parser.add_argument("--time-limit", type=float, default=None,
                        help="Gurobi time limit (seconds)")
    args = parser.parse_args()

    result = main(
        k=args.k,
        max_load=args.max_load,
        epsilon=args.epsilon,
        fairness=args.fairness,
        time_limit=args.time_limit,
    )
    print(result)