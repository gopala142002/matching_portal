import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ReviewForm() {
  const { paperId } = useParams();
  const navigate = useNavigate();

  const [paper, setPaper] = useState(null);
  const [score, setScore] = useState("");
  const [comments, setComments] = useState("");
  const [msg, setMsg] = useState("");

  // 🔥 Fetch paper details
  useEffect(() => {
    axios
      .get(`/api/reviewer/paper/${paperId}/`)
      .then((res) => setPaper(res.data.data))
      .catch((err) => {
        console.error(err);
        setPaper(null);
      });
  }, [paperId]);

  if (!paper) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        Paper not found or not assigned.
      </div>
    );
  }

  // 🔥 Submit review
  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`/api/reviewer/submit-review/${paperId}/`, {
        score,
        comments,
      });

      setMsg("Review submitted successfully!");

      // optional: redirect after 1.5s
      setTimeout(() => {
        navigate("/reviewer/assigned");
      }, 1500);

    } catch (err) {
      console.error(err);
      setMsg("Error submitting review.");
    }
  };

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="text-sm text-gray-500">
        Paper ID: {paper.paper_id}
      </div>

      <h2 className="text-xl font-semibold">Submit Review</h2>

      {msg && (
        <div className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
          {msg}
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>

        {/* Score */}
        <div>
          <label className="text-sm font-medium text-gray-700">Score</label>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            required
          >
            <option value="">Select</option>
            <option value="Accept">Accept</option>
            <option value="Weak Accept">Weak Accept</option>
            <option value="Borderline">Borderline</option>
            <option value="Weak Reject">Weak Reject</option>
            <option value="Reject">Reject</option>
          </select>
        </div>

        {/* Comments */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Comments
          </label>
          <textarea
            className="mt-1 w-full rounded-xl border px-3 py-2"
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            required
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-3">
          <button className="rounded-xl bg-gray-900 px-5 py-2 text-white text-sm font-medium">
            Submit Review
          </button>

          <Link
            className="rounded-xl border px-4 py-2 text-sm"
            to={`/reviewer/paper/${paper.paper_id}`}
          >
            Back
          </Link>
        </div>
      </form>
    </div>
  );
}