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
        // Matches res.data.pending_papers from your views.py
        setPending(res.data.pending_papers || []);
        setSubmitted(res.data.submitted_papers || []);
      })
      .catch((err) => console.error("Dashboard Error:", err));
  }, []);

  const assigned = [...pending, ...submitted];

  const columns = [
    { 
      key: "paper_id", // Matches "paper_id" in your AssignedPaperSerializer
      header: "Paper ID" 
    },
    { 
      key: "paper_title", // Matches "paper_title" in your AssignedPaperSerializer
      header: "Title" 
    },
    {
      key: "reviewer_status",
      header: "Status",
      render: (r) => (
        <StatusBadge
          status={
            r.reviewer_status?.toLowerCase() === "submitted"
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
          className="text-blue-600 font-medium hover:underline"
          to={`/reviewer/paper/${r.paper_id}`} // Matches "paper_id" in serializer
        >
          Open
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard label="Assigned Papers" value={assigned.length} />
        <StatsCard label="Pending" value={pending.length} />
        <StatsCard label="Submitted" value={submitted.length} />
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Assignments</h3>
          <Link to="/reviewer/assigned" className="text-sm font-medium text-blue-600">
            View All
          </Link>
        </div>

        <DataTable
          columns={columns}
          rows={assigned.slice(0, 5)}
          rowKey="id" // Uses the "id" of the FinalAssignment record
        />
      </div>
    </div>
  );
}