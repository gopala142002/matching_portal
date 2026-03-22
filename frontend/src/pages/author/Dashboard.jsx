import React, { useEffect, useState } from "react";
import StatsCard from "../../components/StatsCard";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { Link } from "react-router-dom";
import axios from "axios";

export default function AuthorDashboard() {
  const [papers, setPapers] = useState([]);
  const [counts, setCounts] = useState({
    submitted: 0,
    under_review: 0,
    accepted: 0,
    rejected: 0,
  });

  // ✅ Fetch dashboard data from backend
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/papers/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        });

        setPapers(res.data.papers);
        setCounts(res.data.counts);
      } catch (err) {
        console.error("Error fetching dashboard papers:", err);
      }
    };

    fetchDashboard();
  }, []);

  // Latest 5 submissions
  const latest = papers.slice(0, 5);

  // Table columns
  const columns = [
    { key: "paperID", header: "Paper ID" },
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
          to={`/author/submissions/${r.paperID}`}
        >
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ✅ Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* <StatsCard label="Total Submissions" value={papers.length} /> */}
        <StatsCard label="Submitted" value={papers.length} />
        <StatsCard label="Under Review" value={counts.under_review} />
        <StatsCard label="Accepted" value={counts.accepted} />
        <StatsCard label="Rejected" value={counts.rejected} />
      </div>

      {/* ✅ Latest Submissions */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Latest Submissions</h3>

          <Link
            to="/author/submissions"
            className="rounded-xl border px-4 py-2 text-sm"
          >
            View All
          </Link>
        </div>

        <DataTable columns={columns} rows={latest} rowKey="paperID" />
      </div>
    </div>
  );
}
