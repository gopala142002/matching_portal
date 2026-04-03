import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ReviewerPaperDetails() {
  const { paperId } = useParams();
  const navigate = useNavigate();

  const [paper, setPaper] = useState(null);
  const [msg, setMsg] = useState("");

  // 🔥 Fetch from backend
  useEffect(() => {
    axios
      .get(`/api/reviewer/paper/${paperId}/`)
      .then((res) => {
        setPaper(res.data.data);
      })
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

  return (
    <div className="space-y-4">
      {/* 📄 Paper Info */}
      <div>
        <div className="text-sm text-gray-500">
          Paper ID: {paper.paper_id}
        </div>
        <h2 className="text-xl font-semibold">
          {paper.paper_title}
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          {paper.paper_abstract}
        </p>
      </div>

      {/* 📦 Card */}
      <div className="rounded-3xl border bg-white p-6 shadow-sm">

        {/* 🔗 PDF */}
        <div className="mt-2">
          <a
            href={paper.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm text-white inline-block"
          >
            Open PDF
          </a>
        </div>

        {/* ⚡ Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-xl border px-4 py-2 text-sm"
            onClick={() => navigate(`/reviewer/review/${paper.paper_id}`)}
          >
            Submit Review
          </button>

          {/* (Optional) Conflict button - backend not implemented yet */}
          <button
            className="rounded-xl border px-4 py-2 text-sm"
            onClick={() =>
              setMsg("Conflict feature not implemented yet.")
            }
          >
            Declare Conflict
          </button>

          <Link
            className="rounded-xl border px-4 py-2 text-sm"
            to="/reviewer/assigned"
          >
            Back
          </Link>
        </div>

        {/* ⚠️ Message */}
        {msg && (
          <div className="mt-4 rounded-2xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            {msg}
          </div>
        )}

        {/* 🔒 Info */}
        <div className="mt-4 text-xs text-gray-500">
          Double-blind view: author details are hidden.
        </div>
      </div>
    </div>
  );
}