import React, { useState, useEffect } from "react";
import StatsCard from "../../components/StatsCard";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import api from "../api";

export default function AdminDashboard() {
  const [papers, setPapers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    assigned: 0,
    reviewers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/papers/");
        if (res.data && res.data.status) {
          setPapers(res.data.papers || []);
          setStats(res.data.counts);
        } else {
          throw new Error(res.data?.message || "Failed to fetch data");
        }
      } catch (err) {
        setError(err.message);
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPapers = papers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(papers.length / itemsPerPage);

  const columns = [
    { key: "id", header: "ID" },
    { key: "title", header: "Title" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "author",
      header: "Primary Author",
      render: (r) => (r.author_names && r.author_names[0]) || "N/A",
    },
  ];

  if (loading)
    return (
      <div className="p-20 text-center font-medium">
        Loading Samvad Dashboard...
      </div>
    );

  if (error)
    return (
      <div className="p-20 text-center text-red-500">
        Error: {error}
      </div>
    );

  return (
    <div className="space-y-6">
      {/* 📊 Stats Section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Papers" value={stats.total} />
        <StatsCard label="Total Reviewers" value={stats.reviewers} />
        <StatsCard label="Submitted" value={stats.submitted} />
        <StatsCard label="Under Review" value={stats.assigned} />
      </div>

      {/* 📑 Table Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Platform Submissions
        </h3>

        <DataTable columns={columns} rows={currentPapers} rowKey="id" />

        {/* Pagination */}
        {papers.length > itemsPerPage && (
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-50">
            <p className="text-sm text-gray-500">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, papers.length)} of {papers.length}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.max(1, p - 1))
                }
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm border rounded-md disabled:opacity-30 hover:bg-gray-50"
              >
                Previous
              </button>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm border rounded-md disabled:opacity-30 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}