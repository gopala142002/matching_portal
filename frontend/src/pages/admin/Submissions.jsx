import React, { useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { getPapers } from "../../data/mockDb";

export default function AdminSubmissions() {
  const papers = getPapers();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");

  const filtered = useMemo(() => {
    return papers.filter((p) => {
      const matchesQ =
        p.title.toLowerCase().includes(q.toLowerCase()) ||
        p.id.toLowerCase().includes(q.toLowerCase());
      const matchesStatus = status === "All" ? true : p.status === status;
      return matchesQ && matchesStatus;
    });
  }, [papers, q, status]);

  const columns = [
    { key: "id", header: "Paper ID" },
    { key: "title", header: "Title" },
    {
      key: "keywords",
      header: "Track/Keywords",
      render: (r) => r.keywords.join(", "),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "assigned",
      header: "Assigned Reviewers Count",
      render: (r) => r.assignedReviewers.length,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">All Submissions</h2>
        <div className="flex gap-2">
          <input
            className="w-full sm:w-64 rounded-xl border px-3 py-2 text-sm"
            placeholder="Search by title or ID"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="rounded-xl border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>All</option>
            <option>Submitted</option>
            <option>Under Review</option>
            <option>Accepted</option>
            <option>Rejected</option>
          </select>
        </div>
      </div>

      <DataTable columns={columns} rows={filtered} rowKey="id" />
    </div>
  );
}
