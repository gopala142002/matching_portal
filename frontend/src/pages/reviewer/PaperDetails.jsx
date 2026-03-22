import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { declareConflict, getPaperById } from "../../data/mockDb";

export default function ReviewerPaperDetails() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const myId = "R-2001";
  const paper = getPaperById(paperId);
  const [msg, setMsg] = useState("");

  if (!paper) {
    return <div className="rounded-2xl border bg-white p-6">Paper not found.</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm text-gray-500">Paper ID: {paper.id}</div>
        <h2 className="text-xl font-semibold">{paper.title}</h2>
        <p className="mt-2 text-sm text-gray-700">{paper.abstract}</p>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="text-sm font-medium text-gray-700">Keywords</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {paper.keywords.map((k) => (
            <span key={k} className="rounded-full bg-gray-100 px-3 py-1 text-xs">
              {k}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="rounded-xl bg-gray-900 px-4 py-2 text-sm text-white">
            Open PDF (mock)
          </button>
          <button
            className="rounded-xl border px-4 py-2 text-sm"
            onClick={() => navigate(`/reviewer/review/${paper.id}`)}
          >
            Submit Review
          </button>
          <button
            className="rounded-xl border px-4 py-2 text-sm"
            onClick={() => {
              declareConflict(paper.id, myId);
              setMsg("Conflict declared. You are unassigned from this paper (mock).");
            }}
          >
            Declare Conflict
          </button>
          <Link className="rounded-xl border px-4 py-2 text-sm" to="/reviewer/assigned">
            Back
          </Link>
        </div>

        {msg && (
          <div className="mt-4 rounded-2xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            {msg}
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          Double-blind view: author details are hidden.
        </div>
      </div>
    </div>
  );
}