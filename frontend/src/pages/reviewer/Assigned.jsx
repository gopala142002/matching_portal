import React, { useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { getPapers } from "../../data/mockDb";
import { Link } from "react-router-dom";

export default function ReviewerAssigned() {
  const myId = "R-2001";
  const papers = getPapers().filter((p) => p.assignedReviewers.includes(myId));
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return papers.filter((p) =>
      (p.title + p.id).toLowerCase().includes(q.toLowerCase())
    );
  }, [papers, q]);

  const columns = [
    { key: "id", header: "Paper ID" },
    { key: "title", header: "Title" },
    {
      key: "keywords",
      header: "Keywords",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.keywords.slice(0, 3).map((k) => (
            <span key={k} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
              {k}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "reviewStatus",
      header: "Review Status",
      render: (r) => {
        const submitted = r.reviews.some((x) => x.reviewerId === myId);
        return <StatusBadge status={submitted ? "SubmittedReview" : "Pending"} />;
      },
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
      <DataTable columns={columns} rows={filtered} rowKey="id" />
    </div>
  );
}