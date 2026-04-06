from collections import deque, defaultdict
from django.db import connection

# -------------------------------------------------------------------
# LOAD DATA FROM DATABASE
# -------------------------------------------------------------------

def load_paper_reviewer_edges():
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT paper_id, researcher_id, similarity_score
            FROM paper_to_reviewer
            WHERE similarity_score IS NOT NULL
        """)
        rows = cursor.fetchall()

    return [(str(row[0]), str(row[1]), float(row[2])) for row in rows]


# -------------------------------------------------------------------
# BUILD DATA STRUCTURES
# -------------------------------------------------------------------

def build_data_structures(pr_edges):
    papers = sorted({p for p, _, _ in pr_edges})
    reviewers = sorted({r for _, r, _ in pr_edges})

    sim = {}
    paper_to_reviewers = defaultdict(list)

    for p, r, w in pr_edges:
        sim[(p, r)] = w
        paper_to_reviewers[p].append((r, w))

    return papers, reviewers, sim, paper_to_reviewers


# -------------------------------------------------------------------
# MAX FLOW (EDMONDS-KARP)
# -------------------------------------------------------------------

class MaxFlow:
    def __init__(self):
        self.graph = defaultdict(dict)
        self.original = defaultdict(dict)

    def add_edge(self, u, v, cap):
        if v not in self.graph[u]:
            self.graph[u][v] = 0
        if u not in self.graph[v]:
            self.graph[v][u] = 0

        self.graph[u][v] += cap
        self.original[u][v] = self.graph[u][v]

    def bfs(self, s, t, parent):
        visited = set([s])
        queue = deque([s])

        while queue:
            u = queue.popleft()
            for v in self.graph[u]:
                if v not in visited and self.graph[u][v] > 0:
                    visited.add(v)
                    parent[v] = u
                    queue.append(v)
                    if v == t:
                        return True
        return False

    def max_flow(self, s, t):
        flow = 0

        while True:
            parent = {}
            if not self.bfs(s, t, parent):
                break

            path_flow = float('inf')
            v = t

            while v != s:
                u = parent[v]
                path_flow = min(path_flow, self.graph[u][v])
                v = u

            v = t
            while v != s:
                u = parent[v]
                self.graph[u][v] -= path_flow
                self.graph[v][u] += path_flow
                v = u

            flow += path_flow

        return flow


# -------------------------------------------------------------------
# FEASIBILITY CHECK + ASSIGNMENT
# -------------------------------------------------------------------

def solve_with_threshold(papers, reviewers, paper_to_reviewers, k, c, threshold):
    mf = MaxFlow()

    SOURCE = "S"
    SINK = "T"

    # Source → Paper
    for p in papers:
        mf.add_edge(SOURCE, p, k)

        for r, w in paper_to_reviewers[p]:
            if w >= threshold:
                mf.add_edge(p, r, 1)  # prevents duplicate reviewer

    # Reviewer → Sink
    for r in reviewers:
        mf.add_edge(r, SINK, c)

    flow = mf.max_flow(SOURCE, SINK)

    if flow != len(papers) * k:
        return False, None

    # Extract assignment
    assignment = defaultdict(list)

    for p in papers:
        for r, _ in paper_to_reviewers[p]:
            if r in mf.original[p] and mf.graph[p][r] == 0:
                assignment[p].append(r)

    return True, assignment


# -------------------------------------------------------------------
# BINARY SEARCH (MAX-MIN FAIRNESS)
# -------------------------------------------------------------------

def solve(papers, reviewers, paper_to_reviewers, k, c):
    lo, hi = 0.0, 1.0
    best_score = 0.0
    best_assignment = None

    for _ in range(30):
        mid = (lo + hi) / 2

        feasible, assignment = solve_with_threshold(
            papers, reviewers, paper_to_reviewers, k, c, mid
        )

        if feasible:
            best_score = mid
            best_assignment = assignment
            lo = mid
        else:
            hi = mid

    return best_score, best_assignment


# -------------------------------------------------------------------
# MAIN
# -------------------------------------------------------------------

if __name__ == "__main__":
    print("📥 Loading data from database...")

    pr_edges = load_paper_reviewer_edges()
    papers, reviewers, sim, paper_to_reviewers = build_data_structures(pr_edges)

    print(f"✅ Papers: {len(papers)}")
    print(f"✅ Reviewers: {len(reviewers)}")
    print(f"✅ Edges: {len(pr_edges)}")

    # PARAMETERS
    k = 3   # reviewers per paper
    c = 6   # max papers per reviewer

    print("\n🚀 Running Max-Min Fair Assignment...")

    score, assignment = solve(papers, reviewers, paper_to_reviewers, k, c)

    print("\n✅ Max-Min Fair Score:", round(score, 4))

    print("\n📊 Assignments (first 10 papers):")
    for p in papers[:10]:
        print(f"{p} → {assignment[p]}")