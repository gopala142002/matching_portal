import gurobipy as gp
from gurobipy import GRB
from django.db import connection, transaction
from collections import defaultdict
from tqdm import tqdm


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

K           = 3        # reviewers required per paper
MAX_LOAD    = 6        # maximum papers a single reviewer can handle
EPSILON     = 0        # minimum similarity score to consider an edge
FIX_THRESH  = 1 - 1e-6  # LP value threshold for rounding a variable to 1


# ---------------------------------------------------------------------------
# Data Loading
# ---------------------------------------------------------------------------

def load_data():
    """
    Load paper-reviewer similarity scores from the database.

    Returns
    -------
    papers    : list of paper IDs
    reviewers : list of reviewer IDs
    weight    : dict {(paper_id, reviewer_id): similarity_score}
    """
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT paper_id, researcher_id, similarity_score
            FROM paper_to_reviewer
            WHERE similarity_score IS NOT NULL
        """)
        rows = cursor.fetchall()

    papers   = set()
    reviewers = set()
    weight   = {}

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
    total_demand   = len(papers)    * k
    total_capacity = len(reviewers) * max_load
    if total_capacity < total_demand:
        print(
            f"  Infeasible: total reviewer capacity ({total_capacity}) "
            f"< total demand ({total_demand})."
        )
        feasible = False

    # 2. Per-paper candidate count: each paper needs at least k candidates
    paper_candidates = defaultdict(int)
    for (p, _) in weight:
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
# Fallback ILP  (called when rounding stalls)
# ---------------------------------------------------------------------------

def solve_remaining_ilp(papers, reviewers, remaining_edges,
                        fixed_assignments, paper_fixed, reviewer_fixed,
                        k=K, max_load=MAX_LOAD):
    """
    Solve the residual problem exactly with binary variables.

    Called when iterative rounding stalls (no variable rounds to 1).

    Parameters
    ----------
    papers, reviewers : full ID lists (needed for constraint scope)
    remaining_edges   : dict {(paper_id, reviewer_id): weight} — unfixed edges
    fixed_assignments : set of already-fixed (paper_id, reviewer_id) pairs
    paper_fixed       : defaultdict(int) — reviewers fixed per paper so far
    reviewer_fixed    : defaultdict(int) — papers fixed per reviewer so far
    k, max_load       : problem parameters

    Returns
    -------
    Updated fixed_assignments set, or None on failure.
    """
    print("  Running fallback ILP for remaining variables...")

    if not remaining_edges:
        return fixed_assignments

    model = gp.Model("fallback_ilp")
    model.setParam("OutputFlag", 1)

    x = {
        (i, j): model.addVar(vtype=GRB.BINARY, name=f"x_{i}_{j}")
        for (i, j) in remaining_edges
    }

    # Residual paper demand
    for i in papers:
        residual_demand = k - paper_fixed[i]
        if residual_demand <= 0:
            continue
        candidates = [x[i, j] for j in reviewers if (i, j) in x]
        if not candidates:
            print(f"  Paper {i} has no remaining candidates — infeasible!")
            return None
        model.addConstr(
            gp.quicksum(candidates) == residual_demand,
            name=f"paper_demand_{i}"
        )

    # Residual reviewer capacity
    for j in reviewers:
        residual_cap = max_load - reviewer_fixed[j]
        candidates   = [x[i, j] for i in papers if (i, j) in x]
        if not candidates:
            continue
        if residual_cap <= 0:
            for i in papers:
                if (i, j) in x:
                    model.addConstr(x[i, j] == 0)
            continue
        model.addConstr(
            gp.quicksum(candidates) <= residual_cap,
            name=f"reviewer_capacity_{j}"
        )

    # Objective: maximise similarity of residual assignments
    model.setObjective(
        gp.quicksum(remaining_edges[(i, j)] * x[i, j] for (i, j) in x),
        GRB.MAXIMIZE
    )

    model.optimize()

    if model.SolCount == 0:
        print("  Fallback ILP found no feasible solution.")
        return None

    for (i, j), var in x.items():
        if var.X > 0.5:
            fixed_assignments.add((i, j))
            paper_fixed[i]    += 1
            reviewer_fixed[j] += 1

    return fixed_assignments


# ---------------------------------------------------------------------------
# Iterative Rounding Solver
# ---------------------------------------------------------------------------

def solve_matching(papers, reviewers, weight, k=K, max_load=MAX_LOAD,
                   epsilon=EPSILON, fix_thresh=FIX_THRESH, time_limit=None):
    """
    Solve reviewer assignment via iterative LP rounding + ILP fallback.

    Algorithm
    ---------
    1. Solve the LP relaxation of the assignment problem.
    2. Fix all variables whose LP value >= fix_thresh (≈ 1).
    3. Remove fixed edges; update residual demands and capacities.
    4. Repeat until all papers are fully assigned or no variable rounds up.
    5. If fractional variables remain, solve the residual exactly with ILP.

    Parameters
    ----------
    papers, reviewers : full ID lists
    weight            : dict {(paper_id, reviewer_id): float}
    k                 : reviewers per paper
    max_load          : max papers per reviewer
    epsilon           : minimum similarity to include an edge
    fix_thresh        : LP value threshold for rounding to 1 (default 1-1e-6)
    time_limit        : optional time limit for the fallback ILP (seconds)

    Returns
    -------
    model        : None  (no single Gurobi model is exposed)
    assignments  : set of (paper_id, reviewer_id) pairs, or None on failure
    """
    remaining_edges = {
        (i, j): w for (i, j), w in weight.items() if w >= epsilon
    }

    if not remaining_edges:
        print("  No valid edges found (check similarity scores or epsilon).")
        return None, None

    fixed_assignments = set()
    paper_fixed       = defaultdict(int)   # O(1) lookup: reviewers assigned to paper i
    reviewer_fixed    = defaultdict(int)   # O(1) lookup: papers assigned to reviewer j

    iteration = 0

    while True:
        iteration += 1
        print(f"\n  Iteration {iteration} | "
              f"Remaining edges: {len(remaining_edges)} | "
              f"Fixed assignments: {len(fixed_assignments)}")

        # --------------------------------------------------------------
        # Build LP relaxation over remaining (unfixed) edges
        # --------------------------------------------------------------
        model = gp.Model("iterative_rounding")
        model.setParam("OutputFlag", 0)

        x = {
            (i, j): model.addVar(lb=0.0, ub=1.0, vtype=GRB.CONTINUOUS,
                                  name=f"x_{i}_{j}")
            for (i, j) in remaining_edges
        }

        if not x:
            print("  No remaining edges — stopping.")
            break

        # Residual paper demand constraints
        for i in papers:
            residual_demand = k - paper_fixed[i]
            if residual_demand <= 0:
                continue
            candidates = [x[i, j] for j in reviewers if (i, j) in x]
            if not candidates:
                continue
            model.addConstr(
                gp.quicksum(candidates) == residual_demand,
                name=f"paper_demand_{i}"
            )

        # Residual reviewer capacity constraints
        for j in reviewers:
            residual_cap = max_load - reviewer_fixed[j]
            candidates   = [x[i, j] for i in papers if (i, j) in x]
            if not candidates:
                continue
            model.addConstr(
                gp.quicksum(candidates) <= residual_cap,
                name=f"reviewer_capacity_{j}"
            )

        # Objective: maximise total similarity of remaining assignments
        model.setObjective(
            gp.quicksum(remaining_edges[(i, j)] * x[i, j] for (i, j) in x),
            GRB.MAXIMIZE
        )

        model.optimize()

        if model.Status != GRB.OPTIMAL:
            print(f"  LP not optimal (status {model.Status}) — "
                  f"switching to fallback ILP.")
            break

        # --------------------------------------------------------------
        # Fix variables that are (practically) integral
        # --------------------------------------------------------------
        new_fixed = [
            (i, j) for (i, j), var in x.items()
            if var.X >= fix_thresh
        ]

        if not new_fixed:
            print("  No variables rounded to 1 — switching to fallback ILP.")
            break

        print(f"  Fixing {len(new_fixed)} variable(s) this round.")

        for (i, j) in new_fixed:
            fixed_assignments.add((i, j))
            paper_fixed[i]    += 1
            reviewer_fixed[j] += 1
            remaining_edges.pop((i, j), None)

        # Check if all papers are fully covered (O(papers), not O(n²))
        if all(paper_fixed[i] >= k for i in papers):
            print("  All papers fully assigned via rounding — done!")
            return None, fixed_assignments

    # ------------------------------------------------------------------
    # Fallback: solve residual exactly with ILP
    # ------------------------------------------------------------------
    if remaining_edges:
        result = solve_remaining_ilp(
            papers, reviewers, remaining_edges,
            fixed_assignments, paper_fixed, reviewer_fixed,
            k=k, max_load=max_load
        )
        return None, result

    return None, fixed_assignments


# ---------------------------------------------------------------------------
# Save Results
# ---------------------------------------------------------------------------

def save_allocation(x):
    """
    Persist assignments to the final_assignment table.

    `x` is a set of (paper_id, reviewer_id) pairs.

    Uses executemany (fast) inside an atomic transaction (safe).
    """
    assignments = list(x)

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS final_assignment (
                    paper_id      BIGINT,
                    researcher_id BIGINT
                )
            """)
            cursor.execute("DELETE FROM final_assignment")
            cursor.executemany("""
                INSERT INTO final_assignment (paper_id, researcher_id)
                VALUES (%s, %s)
            """, assignments)

    print(f"  Saved {len(assignments)} assignments.")
    return assignments


# ---------------------------------------------------------------------------
# Main Entry Point
# ---------------------------------------------------------------------------

def main(k=K, max_load=MAX_LOAD, epsilon=EPSILON,
         fix_thresh=FIX_THRESH, time_limit=None):
    """
    Run the full iterative-rounding pipeline:
      1. Load similarity data from the database.
      2. Check feasibility.
      3. Solve via iterative LP rounding (+ ILP fallback).
      4. Validate and save the solution.

    Parameters
    ----------
    k           : reviewers per paper (default 3)
    max_load    : max papers per reviewer (default 6)
    epsilon     : minimum similarity threshold (default 0)
    fix_thresh  : LP rounding threshold (default 1-1e-6)
    time_limit  : optional time limit for fallback ILP (seconds)

    Returns
    -------
    dict with status and number of assignments
    """
    steps = ["Load Data", "Feasibility Check", "Solve", "Save Results"]
    pbar  = tqdm(total=len(steps), desc="Iterative Rounding Pipeline")

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
    print("\n  Solving (iterative LP rounding)...")
    _, x = solve_matching(
        papers, reviewers, weight,
        k=k, max_load=max_load, epsilon=epsilon,
        fix_thresh=fix_thresh, time_limit=time_limit
    )
    pbar.update(1)

    if not x:
        print("  No feasible solution found.")
        pbar.close()
        return {"status": "error", "message": "No feasible solution"}

    # Post-solve validation: every paper must have exactly k reviewers
    paper_count = defaultdict(int)
    for (p, _) in x:
        paper_count[p] += 1

    under_assigned = [p for p in papers if paper_count[p] < k]
    if under_assigned:
        print(f"  Warning: {len(under_assigned)} paper(s) assigned fewer than "
              f"k={k} reviewers. Example IDs: {under_assigned[:5]}")

    # ------------------------------------------------------------------
    # Step 4: Save
    # ------------------------------------------------------------------
    print("\n  Saving assignments...")
    save_allocation(x)
    pbar.update(1)

    pbar.close()
    print("\n  Matching complete!")

    return {
        "status":   "success",
        "assigned": len(x),
        "k":        k,
        "max_load": max_load,
    }


# ---------------------------------------------------------------------------
# CLI usage
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Reviewer Assignment — Iterative LP Rounding + ILP Fallback"
    )
    parser.add_argument("--k",          type=int,   default=K,
                        help="Reviewers per paper")
    parser.add_argument("--max-load",   type=int,   default=MAX_LOAD,
                        help="Max papers per reviewer")
    parser.add_argument("--epsilon",    type=float, default=EPSILON,
                        help="Minimum similarity threshold")
    parser.add_argument("--fix-thresh", type=float, default=FIX_THRESH,
                        help="LP rounding threshold (default 1-1e-6)")
    parser.add_argument("--time-limit", type=float, default=None,
                        help="Time limit for fallback ILP (seconds)")
    args = parser.parse_args()

    result = main(
        k=args.k,
        max_load=args.max_load,
        epsilon=args.epsilon,
        fix_thresh=args.fix_thresh,
        time_limit=args.time_limit,
    )
    print(result)
