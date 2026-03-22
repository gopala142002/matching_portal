import React, { useState } from "react";
import { runAutoAssignment } from "../../data/mockDb";

export default function AdminAssign() {
  const [result, setResult] = useState(null);

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Auto Assign Reviewers</h2>
      <p className="mt-1 text-sm text-gray-600">
        Runs a mock assignment algorithm with COI filtering.
      </p>

      <button
        className="mt-5 rounded-xl bg-gray-900 px-5 py-2 text-white text-sm font-medium"
        onClick={() => {
          const res = runAutoAssignment({ reviewersPerPaper: 2 });
          setResult(res);
        }}
      >
        Run Auto Assignment
      </button>

      {result && (
        <div className="mt-6 space-y-3">
          <div className="text-sm font-medium text-gray-700">Assignment Result</div>
          <div className="space-y-2">
            {result.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border bg-gray-50 px-4 py-3 text-sm"
              >
                <div className="font-medium">{r.id}</div>
                <div className="text-gray-600">
                  Reviewers: {r.assignedReviewers.join(", ") || "None"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
