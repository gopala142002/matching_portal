import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPaperById, submitReview } from "../../data/mockDb";

export default function ReviewForm() {
  const { paperId } = useParams();
  const paper = getPaperById(paperId);
  const myId = "R-2001";

  const [score, setScore] = useState("Accept");
  const [confidence, setConfidence] = useState("Medium");
  const [commentsToAuthor, setCommentsToAuthor] = useState("");
  const [commentsToChair, setCommentsToChair] = useState("");
  const [msg, setMsg] = useState("");

  if (!paper) {
    return <div className="rounded-2xl border bg-white p-6">Paper not found.</div>;
  }

  function onSubmit(e) {
    e.preventDefault();
    submitReview(paper.id, {
      reviewerId: myId,
      score,
      confidence,
      commentsToAuthor,
      commentsToChair,
    });
    setMsg("Review submitted successfully (mock)!");
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="text-sm text-gray-500">Paper ID: {paper.id}</div>
      <h2 className="text-xl font-semibold">Submit Review</h2>

      {msg && (
        <div className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
          {msg}
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="text-sm font-medium text-gray-700">Score</label>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          >
            <option>Accept</option>
            <option>Weak Accept</option>
            <option>Borderline</option>
            <option>Weak Reject</option>
            <option>Reject</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Confidence</label>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={confidence}
            onChange={(e) => setConfidence(e.target.value)}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Comments to Author</label>
          <textarea
            className="mt-1 w-full rounded-xl border px-3 py-2"
            rows={4}
            value={commentsToAuthor}
            onChange={(e) => setCommentsToAuthor(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Comments to Chair</label>
          <textarea
            className="mt-1 w-full rounded-xl border px-3 py-2"
            rows={3}
            value={commentsToChair}
            onChange={(e) => setCommentsToChair(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-xl bg-gray-900 px-5 py-2 text-white text-sm font-medium">
            Submit Review
          </button>
          <Link className="rounded-xl border px-4 py-2 text-sm" to={`/reviewer/paper/${paper.id}`}>
            Back
          </Link>
        </div>
      </form>
    </div>
  );
}
