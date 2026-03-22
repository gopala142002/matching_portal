import React, { useEffect, useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { Link } from "react-router-dom";
import api from "../api";

export default function AuthorSubmissions() {
  const [papers, setPapers] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch papers (with backend filtering)
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);

        const params = {};
        if (status !== "All") params.status = status;

        const res = await api.get("/api/papers/", { params });
        setPapers(res.data.papers || []);
      } catch (err) {
        console.error("Error fetching submissions:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [status]);

  // ✅ Client-side search filter (fast)
  const filtered = useMemo(() => {
    return papers.filter((p) => {
      const matchesQ =
        p.title.toLowerCase().includes(q.toLowerCase()) ||
        String(p.id).includes(q);

      return matchesQ;
    });
  }, [papers, q]);

  // ✅ Table columns
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
        <Link
          className="text-gray-900 font-medium"
          to={`/author/submissions/${r.id}`}
        >
          View
        </Link>
      ),
    },
  ];

  // ✅ Loading UI
  if (loading) {
    return (
      <div className="rounded-xl border p-6 text-center">
        Loading submissions...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">My Submissions</h2>

        <div className="flex gap-2">
          {/* Search */}
          <input
            className="w-full sm:w-64 rounded-xl border px-3 py-2 text-sm"
            placeholder="Search by title or ID"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          {/* Status Filter */}
          <select
            className="rounded-xl border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="All">All</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table or Empty State */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border p-6 text-center text-gray-500">
          No submissions found.
        </div>
      ) : (
        <DataTable columns={columns} rows={filtered} rowKey="id" />
      )}
    </div>
  );
}