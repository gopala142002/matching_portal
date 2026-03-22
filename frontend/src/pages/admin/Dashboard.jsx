import React from "react";
import StatsCard from "../../components/StatsCard";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { getPapers, getReviewers } from "../../data/mockDb";

export default function AdminDashboard() {
  const papers = getPapers();
  const reviewers = getReviewers();

  const totalPapers = papers.length;
  const totalReviewers = reviewers.length;
  const assigned = papers.filter((p) => p.assignedReviewers.length > 0).length;
  const assignedPct = totalPapers ? Math.round((assigned / totalPapers) * 100) : 0;
  const pendingDecisions = papers.filter((p) => !p.decision).length;

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Papers" value={totalPapers} />
        <StatsCard label="Total Reviewers" value={totalReviewers} />
        <StatsCard label="Assigned %" value={`${assignedPct}%`} />
        <StatsCard label="Pending Decisions" value={pendingDecisions} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Submissions Preview</h3>
        </div>
        <DataTable columns={columns} rows={papers.slice(0, 6)} rowKey="id" />
      </div>
    </div>
  );
}
