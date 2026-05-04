import React, { useState, useEffect } from "react";
import DataTable from "../../components/DataTable";
import api from "../api";

export default function ReviewerList() {
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        setLoading(true);
        // Correct prefix from your main urls.py: /api/auth/
        const res = await api.get("/api/auth/reviewers/");
        
        if (res.data && res.data.status) {
          setReviewers(res.data.reviewers || []);
        }
      } catch (err) {
        setError("Unable to load reviewer directory.");
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviewers();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReviewers = reviewers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(reviewers.length / itemsPerPage);

  const columns = [
    { key: "name", header: "Full Name" },
    { key: "email", header: "Email" },
    { 
      key: "institutions", 
      header: "Institutions",
      render: (r) => (
        <div className="text-gray-600 truncate max-w-[200px]">
          {Array.isArray(r.institutions) ? r.institutions.join(", ") : "N/A"}
        </div>
      )
    },
    { 
      key: "research_interests", 
      header: "Interests",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.research_interests && r.research_interests.length > 0 ? (
            r.research_interests.slice(0, 3).map((interest, idx) => (
              <span key={idx} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                {interest}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-[10px]">General</span>
          )}
        </div>
      )
    },
  ];

  if (loading) return <div className="p-20 text-center font-medium">Loading Reviewers...</div>;
  if (error) return <div className="p-20 text-center text-red-500 font-medium">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reviewer Management</h2>
          <p className="text-gray-500 text-sm">Active verified researchers on the Samvad platform</p>
        </div>
        <div className="bg-white px-4 py-2 border rounded-lg shadow-sm">
          <span className="text-sm text-gray-500 font-medium">Verified Reviewers: </span>
          <span className="text-lg font-bold text-blue-600 ml-1">{reviewers.length}</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {reviewers.length > 0 ? (
          <>
            <DataTable columns={columns} rows={currentReviewers} rowKey="id" />
            
            {reviewers.length > itemsPerPage && (
              <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                <p className="text-xs text-gray-500 font-medium">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, reviewers.length)} of {reviewers.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-1 text-xs font-semibold border rounded bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-1 text-xs font-semibold border rounded bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-20 text-center text-gray-500">
            No active reviewers found in the directory.
          </div>
        )}
      </div>
    </div>
  );
}