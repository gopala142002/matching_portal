import React, { useState } from "react";
import { getReviewers, saveReviewerProfile } from "../../data/mockDb";

export default function ReviewerProfile() {
  const myId = "R-2001";
  const me = getReviewers().find((r) => r.id === myId);

  const [expertise, setExpertise] = useState(me?.expertise?.join(", ") || "");
  const [maxPapers, setMaxPapers] = useState(me?.maxPapers || 3);
  const [msg, setMsg] = useState("");

  function onSave(e) {
    e.preventDefault();
    saveReviewerProfile(myId, { expertiseCsv: expertise, maxPapers });
    setMsg("Profile saved (mock)!");
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Reviewer Profile</h2>
      <p className="mt-1 text-sm text-gray-600">Update your expertise and limits.</p>

      {msg && (
        <div className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
          {msg}
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={onSave}>
        <div>
          <label className="text-sm font-medium text-gray-700">Expertise Keywords</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            placeholder="e.g. security, ML, optimization"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Max Papers Limit</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            type="number"
            value={maxPapers}
            onChange={(e) => setMaxPapers(e.target.value)}
            min={1}
          />
        </div>

        <button className="rounded-xl bg-gray-900 px-5 py-2 text-white text-sm font-medium">
          Save
        </button>
      </form>
    </div>
  );
}
