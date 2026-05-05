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

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const params = status !== "All" ? { status } : {};
        const res = await api.get("/api/papers/", { params });
        setPapers(res.data.papers || []);
      } catch (err) {
        console.error("Error fetching submissions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [status]);

  const filtered = useMemo(() => {
    return papers.filter((p) => {
      const matchesQ =
        p.title.toLowerCase().includes(q.toLowerCase()) ||
        String(p.id).includes(q);
      return matchesQ;
    });
  }, [papers, q]);

  const columns = [
    { 
      key: "id", 
      header: "Paper ID",
      render: (r) => <span className="font-mono text-xs text-gray-500">#{r.id}</span> 
    },
    { 
      key: "title", 
      header: "Title",
      render: (r) => <span className="font-medium text-gray-800">{r.title}</span>
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status="{r.status}"/>,
    },
    {
      key: "action",
      header: "Action",
      render: (r) => (
        <Link className="inline-flex items-center gap-1 text-blue-600 font-bold hover:text-blue-800 transition-colors" to="{`/author/submissions/${r.id}`}">
          View Details
        </Link>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400 italic">
        Loading your research papers...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Submissions</h2>
          <p className="text-sm text-gray-500">Manage and track your submitted research papers.</p>
        </div>

        <Link to="/author/submit" className="inline-flex justify-center rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-800 transition-all shadow-sm">
          + Submit New Paper
        </Link>
      </div>

      
      <div className="flex flex-col gap-3 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <input
            className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            placeholder="Search by title or paper ID..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <select
          className="rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="Under review">Under Review</option>
          <option value="Accepted">Accepted</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-4xl mb-2">📄</div>
            <p className="text-gray-500">No submissions found matching your filters.</p>
            {q && (
              <button onClick={() => setQ("")} className="mt-2 text-sm text-blue-600 font-medium underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <DataTable columns="{columns}" rows="{filtered}" rowKey="id"/>
        )}
      </div>
    </div>
  );
}