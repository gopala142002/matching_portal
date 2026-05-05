import React, { useEffect, useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { Link } from "react-router-dom";
import axios from "axios";

export default function ReviewerAssigned() {
  const [pending, setPending] = useState([]);
  const [submitted, setSubmitted] = useState([]);
  const [q, setQ] = useState("");

  // 1. Fetch data from the backend
  useEffect(() => {
    axios
      .get("/api/reviewer/my-papers/")
      .then((res) => {
        // We use the keys defined in your Django Response: pending_papers and submitted_papers
        setPending(res.data.pending_papers || []);
        setSubmitted(res.data.submitted_papers || []);
      })
      .catch((err) => console.error("Error fetching assigned papers:", err));
  }, []);

  // 2. Memoize the merged list to prevent unnecessary re-renders
  const allPapers = useMemo(() => [...pending, ...submitted], [pending, submitted]);

  // 3. Search logic with safety checks for numbers and nulls
  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return allPapers.filter((p) => {
      const title = String(p.paper_title || "").toLowerCase();
      const id = String(p.paper_id_val || "").toLowerCase(); // Using paper_id_val from our serializer
      return title.includes(query) || id.includes(query);
    });
  }, [allPapers, q]);

  const columns = [
    { 
      key: "paper_id_val", 
      header: "Paper ID" 
    },
    { 
      key: "paper_title", 
      header: "Title" 
    },
    {
      key: "reviewer_status",
      header: "Review Status",
      render: (r) => (
        <StatusBadge
          // Normalizing lowercase "pending" from DB to match StatusBadge expectations
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
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
          to={`/reviewer/paper/${r.paper_id_val}`}
        >
          Open Detail
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Assigned Papers</h2>
          <p className="text-sm text-gray-500">Manage and review your assigned submissions</p>
        </div>

        <div className="relative">
          <input
            className="w-full sm:w-72 rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            placeholder="Search by title or ID..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Using 'id' (the primary key of FinalAssignment) as the rowKey for the table */}
      <DataTable columns={columns} rows={filtered} rowKey="id" />
      
      {allPapers.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          No papers have been assigned to you yet.
        </div>
      )}
    </div>
  );
}