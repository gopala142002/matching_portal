import React, { useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import { getReviewers } from "../../data/mockDb";

export default function AdminReviewers() {
  const reviewers = getReviewers();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return reviewers.filter((r) =>
      (r.name + r.id).toLowerCase().includes(q.toLowerCase())
    );
  }, [reviewers, q]);

  const columns = [
    { key: "id", header: "Reviewer ID" },
    { key: "name", header: "Reviewer Name" },
    {
      key: "expertise",
      header: "Expertise",
      render: (r) => r.expertise.join(", "),
    },
    { key: "assignedCount", header: "Assigned Count" },
    { key: "maxPapers", header: "Max Limit" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Reviewer List</h2>
        <input
          className="w-full sm:w-64 rounded-xl border px-3 py-2 text-sm"
          placeholder="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <DataTable columns={columns} rows={filtered} rowKey="id" />
    </div>
  );
}