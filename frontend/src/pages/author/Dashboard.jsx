import React, { useEffect, useState } from "react";
import StatsCard from "../../components/StatsCard";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { Link } from "react-router-dom";
import api from "../api"; // 🛠️ Use your configured api helper

export default function AuthorDashboard() {
  const [papers, setPapers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    assigned: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        setLoading(true);
        // This hits your PaperListView which already filters by request.user
        const res = await api.get("/api/papers/");
        
        if (res.data && res.data.status) {
          setPapers(res.data.papers || []);
          setStats(res.data.counts);
        }
      } catch (err) {
        console.error("Author Dashboard Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorDashboard();
  }, []);

  const columns = [
    { key: "id", header: "ID" },
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
          className="text-blue-600 font-medium hover:underline"
          to={`/author/submissions/${r.id}`}
        >
          View Detail
        </Link>
      ),
    },
  ];

  if (loading) return <div className="p-20 text-center">Loading your submissions...</div>;

  return (
    <div className="space-y-6">
      {/* 📊 Author Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard label="Total Submissions" value={stats.total} />
        <StatsCard label="Successfully Submitted" value={stats.submitted} />
        <StatsCard label="Currently Under Review" value={stats.assigned} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">My Papers</h3>
          <Link to="/author/submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            + New Submission
          </Link>
        </div>

        {papers.length > 0 ? (
          <DataTable columns={columns} rows={papers.slice(0, 10)} rowKey="id" />
        ) : (
          <div className="py-20 text-center text-gray-400">
            You haven't submitted any papers yet.
          </div>
        )}
      </div>
    </div>
  );
}