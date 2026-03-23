import React, { useEffect, useState } from "react";
import api from "../api";

export default function ShowAssignments() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAssignments();
  }, [page]);

  const fetchAssignments = async () => {
    try {
      const res = await api.get(`/api/assignments/?page=${page}&limit=${limit}`);
      setData(res.data.results);
      setTotalPages(res.data.total_pages);
    } catch (err) {
      console.error("Error fetching assignments", err);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Assignments</h2>

      {/* TABLE */}
      <div className="border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Paper ID</th>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Reviewers</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row) => (
              <tr key={row.paper_id} className="border-t">
                <td className="p-3">{row.paper_id}</td>
                <td className="p-3">{row.title}</td>
                <td className="p-3">
                  {row.reviewers.join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔥 PAGINATION (like your image) */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="px-3 py-1 border rounded"
        >
          {"<"}
        </button>

        {[...Array(totalPages)].slice(0, 5).map((_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded ${
                page === p ? "bg-orange-400 text-white" : "border"
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1 border rounded"
        >
          {">"}
        </button>
      </div>
    </div>
  );
}