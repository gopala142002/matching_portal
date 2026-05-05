import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api"; // 🛠️ Use your configured api instance

export default function ReviewForm() {
  const { paperId } = useParams();
  const navigate = useNavigate();

  const [paper, setPaper] = useState(null);
  const [score, setScore] = useState("");
  const [comments, setComments] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);

  // 1. Fetch paper details to show context
  useEffect(() => {
    const fetchPaper = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/reviewer/paper/${paperId}/`);
        if (res.data && res.data.status) {
          setPaper(res.data.data);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPaper();
  }, [paperId]);

  // 2. Submit review logic
  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      // NOTE: We send 'paper_score' to match your Django Serializer fields
      const response = await api.post(`/api/reviewer/submit-review/${paperId}/`, {
        paper_score: score, 
        comments: comments,
      });

      if (response.data.status) {
        setMsg({ text: "Review submitted successfully!", type: "success" });
        setTimeout(() => navigate("/reviewer/assigned"), 2000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Error submitting review.";
      setMsg({ text: errorMsg, type: "error" });
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading form...</div>;

  if (!paper) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-center">
        <p>Paper not found or unauthorized.</p>
        <Link to="/reviewer/assigned" className="text-blue-600 underline">Back to List</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="mb-6">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">ID: {paper.paper_id}</span>
          <h2 className="text-2xl font-bold text-gray-900 mt-2">Submit Your Review</h2>
          <p className="text-sm text-gray-500 mt-1">Reviewing: <span className="italic">"{paper.paper_title}"</span></p>
        </div>

        {msg.text && (
          <div className={`mb-6 rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${
            msg.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}>
            {msg.type === "success" ? "✅" : "❌"} {msg.text}
          </div>
        )}

        <form className="space-y-5" onSubmit={onSubmit}>
          {/* Score Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Overall Quality Score</label>
            <select
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none bg-gray-50"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              required
            >
              <option value="">Select a score...</option>
              <option value="5">Accept (5)</option>
              <option value="4">Weak Accept (4)</option>
              <option value="3">Borderline (3)</option>
              <option value="2">Weak Reject (2)</option>
              <option value="1">Reject (1)</option>
            </select>
          </div>

          {/* Detailed Comments */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed Comments</label>
            <textarea
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50"
              rows={6}
              placeholder="Provide constructive feedback for the authors..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button 
              type="submit"
              className="flex-1 rounded-xl bg-blue-600 px-6 py-3 text-white text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
            >
              Confirm Submission
            </button>

            <Link
              className="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
              to={`/reviewer/paper/${paper.paper_id}`}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
      
      <div className="text-center">
        <p className="text-xs text-gray-400 italic">
          Note: Once submitted, reviews cannot be edited without administrative approval.
        </p>
      </div>
    </div>
  );
}