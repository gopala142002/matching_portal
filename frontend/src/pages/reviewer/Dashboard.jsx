import React, { useState, useEffect } from "react";
import StatsCard from "../../components/StatsCard";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { Link } from "react-router-dom";
import api from "../api"; // 🛠️ Uses the working api instance from AdminDashboard

export default function ReviewerDashboard() {
  const [pending, setPending] = useState([]);
  const [submitted, setSubmitted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Hits your Django assigned_papers view
        const res = await api.get("/api/reviewer/my-papers/");
        
        if (res.data && res.data.status) {
          setPending(res.data.pending_papers || []);
          setSubmitted(res.data.submitted_papers || []);
        } else {
          throw new Error(res.data?.message || "Failed to load dashboard data");
        }
      } catch (err) {
        setError(err.message);
        console.error("Reviewer Dashboard Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Derived Values
  const allAssignments = [...pending, ...submitted];
  const pendingCount = pending.length;
  const submittedCount = submitted.length;

  const columns = [
    { 
      key: "paper_id", 
      header: "Paper ID" 
    },
    { 
      key: "paper_title", 
      header: "Title" 
    },
    {
      key: "reviewer_status",
      header: "Status",
      render: (r) => (
        <StatusBadge
          status={
            r.reviewer_status?.toLowerCase() === "submitted"
              ? "SubmittedReview"
              : "Pending"
          }
        />
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (r) => (
        <Link
          className="text-blue-600 font-medium hover:underline"
          to={`/reviewer/paper/${r.paper_id}`}
        >
          Open
        </Link>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center font-medium text-gray-500">
        Loading Reviewer Dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center text-red-500">
        <p className="font-bold">Error loading dashboard</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 📊 Stats Section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard label="Assigned Papers" value={allAssignments.length} />
        <StatsCard label="Pending Reviews" value={pendingCount} />
        <StatsCard label="Submitted Reviews" value={submittedCount} />
      </div>

      {/* 📋 Recent Assignments Table */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Recent Assignments</h3>
          <Link
            to="/reviewer/assigned"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-all"
          >
            View All
          </Link>
        </div>

        {allAssignments.length > 0 ? (
          <DataTable
            columns={columns}
            rows={allAssignments.slice(0, 5)}
            rowKey="id" // Matches the unique ID from FinalAssignment model
          />
        ) : (
          <div className="py-10 text-center text-gray-400">
            No papers currently assigned for review.
          </div>
        )}
      </div>
    </div>
  );
}