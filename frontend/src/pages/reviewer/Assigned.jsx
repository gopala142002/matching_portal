import React, { useEffect, useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { Link } from "react-router-dom";
import axios from "axios";

export default function ReviewerAssigned() {
  const [pending, setPending] = useState([]);
  const [submitted, setSubmitted] = useState([]);
  const [q, setQ] = useState("");

  // 🔥 Fetch from backend
  useEffect(() => {
    axios
      .get("/api/reviewer/my-papers/")
      .then((res) => {
        setPending(res.data.pending_papers || []);
        setSubmitted(res.data.submitted_papers || []);
      })
      .catch((err) => console.error(err));
  }, []);

  // 🔥 Merge both lists (optional)
  const allPapers = [...pending, ...submitted];

  // 🔍 Search
  const filtered = useMemo(() => {
    return allPapers.filter((p) =>
      (p.paper_title + p.paper_id)
        .toLowerCase()
        .includes(q.toLowerCase())
    );
  }, [allPapers, q]);

  const columns = [
    { key: "paper_id", header: "Paper ID" },
    { key: "paper_title", header: "Title" },

    {
      key: "reviewer_status",
      header: "Review Status",
      render: (r) => (
        <StatusBadge
          status={
            r.reviewer_status === "Submitted"
              ? "SubmittedReview"
              : "Pending"
          }
        />
      ),
    },

    {
      key: "action",
      header: "Action",
      render: (r) => (
        <Link
          className="text-gray-900 font-medium"
          to={`/reviewer/paper/${r.paper_id}`}
        >
          Open
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Assigned Papers</h2>

        <input
          className="w-full sm:w-64 rounded-xl border px-3 py-2 text-sm"
          placeholder="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <DataTable columns={columns} rows={filtered} rowKey="paper_id" />
    </div>
  );
}