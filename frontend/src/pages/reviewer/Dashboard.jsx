import React from "react";
import StatsCard from "../../components/StatsCard";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { getPapers } from "../../data/mockDb";
import { Link } from "react-router-dom";

export default function ReviewerDashboard() {
  const papers = getPapers();
  // Mock: reviewer sees papers assigned to R-2001
  const myId = "R-2001";
  const assigned = papers.filter((p) => p.assignedReviewers.includes(myId));
  const submitted = assigned.filter((p) => p.reviews.some((r) => r.reviewerId === myId)).length;
  const pending = assigned.length - submitted;

  const columns = [
    { key: "id", header: "Paper ID" },
    { key: "title", header: "Title" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "action",
      header: "Action",
      render: (r) => (
        <Link className="text-gray-900 font-medium" to={`/reviewer/paper/${r.id}`}>
          Open
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard label="Assigned Papers" value={assigned.length} />
        <StatsCard label="Pending Reviews" value={pending} />
        <StatsCard label="Submitted Reviews" value={submitted} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Assigned Papers</h3>
          <Link to="/reviewer/assigned" className="rounded-xl border px-4 py-2 text-sm">
            View All
          </Link>
        </div>
        <DataTable columns={columns} rows={assigned.slice(0, 5)} rowKey="id" />
      </div>
    </div>
  );
}