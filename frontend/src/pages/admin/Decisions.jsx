import React, { useState } from "react";
import { getPapers, setDecision } from "../../data/mockDb";
import StatusBadge from "../../components/StatusBadge";

export default function AdminDecisions() {
  const papers = getPapers();
  const [msg, setMsg] = useState("");
  const [choices, setChoices] = useState(() => {
    const init = {};
    papers.forEach((p) => {
      init[p.id] = p.decision || "Accepted";
    });
    return init;
  });

  function save(paperId) {
    setDecision(paperId, choices[paperId]);
    setMsg(`Decision saved for ${paperId} (mock).`);
    setTimeout(() => setMsg(""), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Final Decisions</h2>
      </div>

      {msg && (
        <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
          {msg}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">Paper ID</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Current Status</th>
              <th className="px-4 py-3 font-medium">Decision</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {papers.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3">{p.id}</td>
                <td className="px-4 py-3">{p.title}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-xl border px-3 py-2"
                    value={choices[p.id]}
                    onChange={(e) =>
                      setChoices((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                  >
                    <option value="Accepted">Accept</option>
                    <option value="Rejected">Reject</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    className="rounded-xl bg-gray-900 px-4 py-2 text-white text-sm"
                    onClick={() => save(p.id)}
                  >
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}