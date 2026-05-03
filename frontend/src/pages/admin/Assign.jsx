import React, { useState, useEffect } from "react";
import api from "../api";

export default function AdminAssign() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [crossJoinReady, setCrossJoinReady] = useState(false);
  useEffect(() => {
    async function checkTable() {
      try {
        const res = await api.get("/api/check_edge_weight_table/");
        if (res.data.doesExist) {
          setCrossJoinReady(true);
        }
      } catch (err) {
        console.error("Error checking table:", err);
      }
    }

    checkTable();
  }, []);
  async function generateCrossJoin() {
    if (crossJoinReady) {
      const confirmAction = window.confirm(
        "Edge weights already exist. Regenerating will overwrite and may take time. Continue?"
      );
      if (!confirmAction) return;
    }

    setLoading(true);

    try {
      console.log("Generating edge weights...");

      const res = await api.post("/api/run_edge_weights/");
      console.log("Response:", res.data);

      setCrossJoinReady(true);
    } catch (err) {
      console.error("Error generating edge weights:", err);

      alert(
        err.response?.data?.message ||
        "Failed to generate edge weights. Check backend."
      );
    } finally {
      setLoading(false);
    }
  }
  async function runAlgorithm(algoKey) {
    setLoading(true);
    setResult(null);

    try {
      console.log(`Running ${algoKey} algorithm...`);

      let endpoint = "";

      if (algoKey === "ILP") {
        endpoint = "/api/run_ilp/";
      }
      else if (algoKey === "LP_with_iterative_rounding") {
        endpoint = "/api/run_lp_with_iterative_rounding/"
      }
      else if (algoKey === "NF") {
        endpoint = "/api/run_network_flow/";
      } else if (algoKey == "IA") {
        endpoint = "/api/iterative_assignment/";
      }

      const res = await api.post(endpoint);
      console.log("Result:", res.data);
      setResult(res.data);
    } catch (err) {
      console.error("Algorithm error:", err);

      alert(
        err.response?.data?.message ||
        "Algorithm failed. Check backend."
      );
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
            disabled={loading}
            className={`rounded-xl px-4 py-2 text-white ${loading ? "bg-blue-300" : "bg-blue-600"
              }`}
          >
            Assign Paper-Reviewer edge weights
          </button>

          {crossJoinReady && (
            <span className="ml-3 text-green-600 text-sm">✔ Ready</span>
          )}
        </div>

        <div className="flex gap-3">
          <button
            disabled={!crossJoinReady || loading}
            onClick={() => runAlgorithm("ILP")}
            className={`px-4 py-2 rounded-xl text-white ${crossJoinReady && !loading
              ? "bg-gray-900"
              : "bg-gray-400 cursor-not-allowed"
              }`}
          >
            Run ILP
          </button>
          <button
            disabled={!crossJoinReady || loading}
            onClick={() => runAlgorithm("LP_with_iterative_rounding")}
            className={`px-4 py-2 rounded-xl text-white ${crossJoinReady && !loading
              ? "bg-gray-900"
              : "bg-gray-400 cursor-not-allowed"
              }`}
          >
            Run LP with iterative rounding
          </button>
        </div>
      </div>
      <div className="border rounded-2xl p-4 bg-gray-50 space-y-3">
        <h3 className="text-md font-semibold text-gray-800">
          Other Algorithms
        </h3>

        <div className="flex gap-3">
          <button
            disabled={loading}
            onClick={() => runAlgorithm("NF")}
            className={`px-4 py-2 rounded-xl text-white ${loading ? "bg-gray-400" : "bg-gray-900"
              }`}
          >
            Network Flow
          </button>

          <button
            disabled={loading}
            onClick={() => runAlgorithm("IA")}
            className={`px-4 py-2 rounded-xl text-white ${loading ? "bg-gray-400" : "bg-gray-900"
              }`}
          >
            Iterative Assignment
          </button>
        </div>
      </div>
      {loading && (
        <div className="text-sm text-gray-600 animate-pulse">
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