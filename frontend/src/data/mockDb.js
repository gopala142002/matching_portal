export const mockDb = {
  papers: [
    {
      id: "P-1001",
      title: "Bias-Free Reviewer Assignment using COI Rules",
      abstract:
        "This paper proposes a conflict-aware assignment strategy for peer review.",
      keywords: ["peer review", "COI", "matching"],
      status: "Under Review", // Submitted | Under Review | Accepted | Rejected
      pdfName: "paper_1001.pdf",
      author: {
        name: "Hidden Author",
        email: "hidden@author.com",
        institute: "Hidden Institute",
      },
      assignedReviewers: ["R-2001", "R-2002"],
      reviews: [],
      conflicts: [],
      decision: null,
    },
    {
      id: "P-1002",
      title: "AR in Education: Interactive Learning via Vuforia",
      abstract:
        "An AR-based learning portal to visualize 3D educational content using Vuforia.",
      keywords: ["AR", "Education", "Vuforia"],
      status: "Submitted",
      pdfName: "paper_1002.pdf",
      author: {
        name: "Hidden Author",
        email: "hidden2@author.com",
        institute: "Hidden Institute",
      },
      assignedReviewers: [],
      reviews: [],
      conflicts: [],
      decision: null,
    },
  ],
  reviewers: [
    {
      id: "R-2001",
      name: "Reviewer A",
      institute: "Institute X",
      expertise: ["peer review", "security", "COI"],
      maxPapers: 5,
      assignedCount: 1,
    },
    {
      id: "R-2002",
      name: "Reviewer B",
      institute: "Institute Y",
      expertise: ["machine learning", "matching", "optimization"],
      maxPapers: 3,
      assignedCount: 1,
    },
    {
      id: "R-2003",
      name: "Reviewer C",
      institute: "Hidden Institute", // COI with hidden institute
      expertise: ["AR", "education"],
      maxPapers: 4,
      assignedCount: 0,
    },
  ],
};

export function getProfile() {
  return {
    name: "Diby ansh Gupta",
    email: "dibyansh@example.com",
    institution: "IEM Kolkata",
    department: "Computer Science",
    academic_position: "Student",
    research_interests: "AI, AR/VR, Systems",
    role: localStorage.getItem("role"),
  };
}

export function setProfile(updatedProfile) {
  console.log("Profile updated:", updatedProfile);
  return true;
}

export function getRole() {
  return localStorage.getItem("role");
}

export function setRole(role) {
  localStorage.setItem("role", role);
}

export function clearRole() {
  localStorage.removeItem("role");
}

export function getPapers() {
  return mockDb.papers;
}

export function getPaperById(paperId) {
  return mockDb.papers.find((p) => p.id === paperId);
}

export function addPaper({ title, abstract, keywordsCsv, pdfName }) {
  const id = `P-${Math.floor(1000 + Math.random() * 9000)}`;
  const paper = {
    id,
    title,
    abstract,
    keywords: keywordsCsv
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    status: "Submitted",
    pdfName: pdfName || "uploaded.pdf",
    author: {
      name: "Hidden Author",
      email: "hidden@author.com",
      institute: "Hidden Institute",
    },
    assignedReviewers: [],
    reviews: [],
    conflicts: [],
    decision: null,
  };
  mockDb.papers.unshift(paper);
  return paper;
}

export function getReviewers() {
  return mockDb.reviewers;
}

export function saveReviewerProfile(reviewerId, { expertiseCsv, maxPapers }) {
  const r = mockDb.reviewers.find((x) => x.id === reviewerId);
  if (!r) return null;
  r.expertise = expertiseCsv
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  r.maxPapers = Number(maxPapers) || r.maxPapers;
  return r;
}

export function declareConflict(paperId, reviewerId) {
  const p = getPaperById(paperId);
  if (!p) return false;
  if (!p.conflicts.includes(reviewerId)) p.conflicts.push(reviewerId);
  // If assigned, remove reviewer from assignment
  p.assignedReviewers = p.assignedReviewers.filter((id) => id !== reviewerId);
  return true;
}

export function submitReview(paperId, review) {
  const p = getPaperById(paperId);
  if (!p) return false;
  p.reviews.push({ ...review, createdAt: new Date().toISOString() });
  return true;
}

export function runAutoAssignment({ reviewersPerPaper = 2 } = {}) {
  // Mock COI rule: do not assign if reviewer institute == paper.author.institute
  // Also avoid if reviewer declared conflict.
  // Assign by keyword overlap + load.

  const papers = mockDb.papers;
  const reviewers = mockDb.reviewers;

  function overlapScore(paper, reviewer) {
    const paperKw = new Set(paper.keywords.map((k) => k.toLowerCase()));
    const revKw = new Set(reviewer.expertise.map((k) => k.toLowerCase()));
    let score = 0;
    paperKw.forEach((k) => {
      if (revKw.has(k)) score += 1;
    });
    return score;
  }

  for (const paper of papers) {
    // Skip if already assigned enough
    if (paper.assignedReviewers.length >= reviewersPerPaper) continue;

    const candidates = reviewers
      .filter((r) => r.assignedCount < r.maxPapers)
      .filter((r) => r.institute !== paper.author.institute) // COI
      .filter((r) => !paper.conflicts.includes(r.id))
      .filter((r) => !paper.assignedReviewers.includes(r.id));

    candidates.sort((a, b) => {
      const sB = overlapScore(paper, b);
      const sA = overlapScore(paper, a);
      if (sB !== sA) return sB - sA;
      // tie-break by lower load
      return a.assignedCount - b.assignedCount;
    });

    while (paper.assignedReviewers.length < reviewersPerPaper) {
      const next = candidates.shift();
      if (!next) break;
      paper.assignedReviewers.push(next.id);
      next.assignedCount += 1;
      paper.status = "Under Review";
    }
  }

  return papers.map((p) => ({ id: p.id, assignedReviewers: p.assignedReviewers }));
}

export function setDecision(paperId, decision) {
  const p = getPaperById(paperId);
  if (!p) return false;
  p.decision = decision;
  p.status = decision === "Accepted" ? "Accepted" : "Rejected";
  return true;
}