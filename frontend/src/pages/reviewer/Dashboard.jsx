import React, { useEffect, useState } from "react";
import StatsCard from "../../components/StatsCard";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { Link } from "react-router-dom";
import axios from "axios";

export default function ReviewerDashboard() {
  const [pending, setPending] = useState([]);
  const [submitted, setSubmitted] = useState([]);

  useEffect(() => {
    axios
      .get("/api/reviewer/my-papers/")
      .then((res) => {
        setPending(res.data.pending_papers || []);
        setSubmitted(res.data.submitted_papers || []);
      })
      .catch((err) => console.error(err));
  }, []);

  // 🔥 Derived values
  const assigned = [...pending, ...submitted];
  const pendingCount = pending.length;
  const submittedCount = submitted.length;

  const columns = [
    { key: "paper_id", header: "Paper ID" },
    { key: "paper_title", header: "Title" },

    {
      key: "status",
      header: "Status",
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
    <div className="space-y-6">
      {/* 📊 Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard label="Assigned Papers" value={assigned.length} />
        <StatsCard label="Pending Reviews" value={pendingCount} />
        <StatsCard label="Submitted Reviews" value={submittedCount} />
      </div>

      {/* 📋 Table */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Assigned Papers</h3>

          <Link
            to="/reviewer/assigned"
            className="rounded-xl border px-4 py-2 text-sm"
          >
            View All
          </Link>
        </div>

        <DataTable
          columns={columns}
          rows={assigned.slice(0, 5)}
          rowKey="paper_id"
        />
      </div>
    </div>
  );
}