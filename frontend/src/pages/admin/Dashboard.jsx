import React, { useState } from "react";
import StatsCard from "../../components/StatsCard";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { getPapers, getReviewers } from "../../data/mockDb";
import api from "../api";   // ✅ adjust if needed

export default function AdminDashboard() {
  const papers = getPapers();
  const reviewers = getReviewers();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const totalPapers = papers.length;
  const totalReviewers = reviewers.length;
  const assigned = papers.filter((p) => p.assignedReviewers.length > 0).length;
  const assignedPct = totalPapers ? Math.round((assigned / totalPapers) * 100) : 0;
  const pendingDecisions = papers.filter((p) => !p.decision).length;

  // 🔥 CALL MATCHING API
  const runMatching = async () => {
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("access");

      const res = await api.post(
        "/api/auth/run-matching/",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(res.data.message);
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Failed to run matching"
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "id", header: "Paper ID" },
    { key: "title", header: "Title" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "assigned",
      header: "Assigned Reviewers",
      render: (r) => r.assignedReviewers.length,
    },
  ];

  return (
    <div className="space-y-6">

      {/* 🔥 RUN MATCHING BUTTON */}
      {/* <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Admin Dashboard</h2>

        <button
          onClick={runMatching}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded-xl"
        >
          {loading ? "Running..." : "Run Matching"}
        </button>
      </div> */}

      {/* {message && (
        <div className="text-sm bg-gray-100 p-2 rounded">
          {message}
        </div>
      )} */}

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Papers" value={totalPapers} />
        <StatsCard label="Total Reviewers" value={totalReviewers} />
        <StatsCard label="Papers Under Review" value={`${assignedPct}%`} />
        <StatsCard label="Pending Assignments" value={pendingDecisions} />
      </div>

      {/* TABLE */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Submissions Preview</h3>
        </div>
        <DataTable columns={columns} rows={papers.slice(0, 6)} rowKey="id" />
      </div>
    </div>
  );
}