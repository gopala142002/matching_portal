import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import StatusBadge from "../../components/StatusBadge";

export default function SubmissionDetails() {
  const { paperId } = useParams();

  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch paper detail from backend
  useEffect(() => {
    const fetchPaper = async () => {
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/api/papers/${paperId}/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access")}`,
            },
          }
        );

        setPaper(res.data);
      } catch (err) {
        console.error("Error fetching paper detail:", err);

        // ✅ Redirect if token expired/unauthorized
        if (err.response?.status === 401) {
          localStorage.clear();
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPaper();
  }, [paperId]);

  // ✅ Loading state
  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        Loading paper details...
      </div>
    );
  }

  // ✅ Paper not found
  if (!paper) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        Paper not found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">
            Paper ID: {paper.paperID}
          </div>
          <h2 className="text-xl font-semibold">{paper.title}</h2>
        </div>

        <StatusBadge status={paper.status} />
      </div>

      {/* Paper Info */}
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        {/* Abstract */}
        <div className="text-sm font-medium text-gray-700">Abstract</div>
        <p className="mt-2 text-sm text-gray-700">{paper.abstract}</p>

        {/* Keywords */}
        <div className="mt-4 text-sm font-medium text-gray-700">Keywords</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {paper.keywords?.map((k, index) => (
            <span
              key={index}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs"
            >
              {k}
            </span>
          ))}
        </div>

        {/* Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          {/* PDF Download */}
          <a
            href={paper.pdf_url}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm text-white"
          >
            Download PDF
          </a>

          {/* Back */}
          <Link
            to="/author/submissions"
            className="rounded-xl border px-4 py-2 text-sm"
          >
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}
