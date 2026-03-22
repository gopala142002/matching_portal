import React, { useState } from "react";
import api from '../api'


export default function AdminAssign() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [crossJoinReady, setCrossJoinReady] = useState(false);

  // 🔥 STEP 1: Generate Cross Join
async function generateCrossJoin() {
  setLoading(true);

  try {
    console.log("Generating cross join...");

    const res = await api.post("/api/run-edge_weights/");  

    console.log(res.data);

    setCrossJoinReady(true);
  } catch (err) {
    console.error("Error generating cross join:", err);
  } finally {
    setLoading(false);
  }
}

  // 🔥 STEP 2: Run Algorithm
  async function runAlgorithm(algoKey) {
    setLoading(true);
    setResult(null);

    try {
      console.log(`Running ${algoKey}`);

      // ✅ BACKEND
      /*
      const res = await api.post(`/api/match/${algoKey}/`);
      setResult(res.data);
      */

      const mockResult = [
        { id: "Paper 1", assignedReviewers: ["R1", "R2"] },
        { id: "Paper 2", assignedReviewers: ["R3", "R4"] },
      ];

      await new Promise((res) => setTimeout(res, 1000));

      setResult(mockResult);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm space-y-6">
      <h2 className="text-xl font-semibold">Reviewer Assignment</h2>

      <div className="border rounded-2xl p-4 bg-gray-50 space-y-4">
        <h3 className="text-md font-semibold text-gray-800">
          ILP-based Algorithms
        </h3>

        <div>
          <button
            onClick={generateCrossJoin}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white"
          >
            Assign Paper-Reviewer edge weights
          </button>

          {crossJoinReady && (
            <span className="ml-3 text-green-600 text-sm">
              ✔ Ready
            </span>
          )}
        </div>

   
        <div className="flex gap-3">
          <button
            disabled={!crossJoinReady}
            onClick={() => runAlgorithm("ILP")}
            className={`px-4 py-2 rounded-xl text-white ${
              crossJoinReady
                ? "bg-gray-900"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Run ILP
          </button>

          <button
            disabled={!crossJoinReady}
            onClick={() => runAlgorithm("ILPR")}
            className={`px-4 py-2 rounded-xl text-white ${
              crossJoinReady
                ? "bg-gray-900"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Run ILP (Iterative)
          </button>
        </div>
      </div>

      <div className="border rounded-2xl p-4 bg-gray-50 space-y-3">
        <h3 className="text-md font-semibold text-gray-800">
          Other Algorithms
        </h3>

        <div className="flex gap-3">
          <button
            onClick={() => runAlgorithm("NF")}
            className="px-4 py-2 rounded-xl bg-gray-900 text-white"
          >
            Network Flow
          </button>

          <button
            onClick={() => runAlgorithm("OTHER")}
            className="px-4 py-2 rounded-xl bg-gray-900 text-white"
          >
            4th Algorithm
          </button>
        </div>
      </div>
      {loading && (
        <div className="text-sm text-gray-600">
          Processing...
        </div>
      )}

      {result && (
        <div className="space-y-2">
          {result.map((r) => (
            <div key={r.id} className="border p-3 rounded">
              <div className="font-medium">{r.id}</div>
              <div className="text-sm text-gray-600">
                {r.assignedReviewers.join(", ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}