import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";


export default function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("access");
    const refresh=localStorage.getItem("refresh");

    if (!token) 
        return;

    fetch("http://127.0.0.1:8000/api/auth/verify_token/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        navigate("/author/dashboard");
      })
      .catch(() => {
        fetch("http://127.0.0.1:8000/api/auth/token/refresh/",{
          refresh:refresh
        }).then((res)=>{
          localStorage.setItem("access",res.access);
        }).catch(()=>{
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");

          //session expired
        })
      });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <section className="rounded-3xl border bg-white p-10 shadow-sm">
          <div className="text-sm uppercase tracking-wide text-gray-500">
            International Conference
          </div>

          <h1 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900">
            International Conference on
            <span className="block text-indigo-700">
              Artificial Intelligence & Data Systems (ICAIDS 2026)
            </span>
          </h1>

          <p className="mt-4 max-w-3xl text-gray-600 leading-relaxed">
            ICAIDS 2026 provides an international forum for researchers,
            practitioners, and educators to present and discuss recent
            innovations, trends, and challenges in Artificial Intelligence,
            Security, Systems, and Data Science.
          </p>

          <div className="mt-3 text-sm text-gray-500">
            📍 Kolkata, India &nbsp; | &nbsp; 🗓 20–22 February 2026
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/login"
              className="rounded-xl bg-gray-900 px-6 py-3 text-white text-sm font-medium"
            >
              Author / Reviewer Login
            </Link>

            <Link
              to="/register"
              className="rounded-xl border px-6 py-3 text-gray-900 text-sm font-medium"
            >
              New Author Registration
            </Link>
          </div>
        </section>

        {/* ================= IMPORTANT DATES ================= */}
        <section className="mt-10 rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Important Dates
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-gray-600">
            <div><strong>Paper Submission:</strong> 10 February 2026</div>
            <div><strong>Review Notification:</strong> 01 March 2026</div>
            <div><strong>Camera Ready Submission:</strong> 10 March 2026</div>
            <div><strong>Conference Dates:</strong> 20–22 February 2026</div>
          </div>
        </section>

        {/* ================= CALL FOR PAPERS ================= */}
        <section className="mt-10 rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Call for Papers
          </h2>

          <p className="mt-3 text-sm text-gray-600 max-w-4xl">
            Original and unpublished research papers are invited in (but not
            limited to) the following areas:
          </p>

          <ul className="mt-4 grid gap-2 md:grid-cols-2 list-disc pl-5 text-sm text-gray-600">
            <li>Artificial Intelligence & Machine Learning</li>
            <li>Computer Vision and AR/VR Systems</li>
            <li>Cyber Security & Privacy</li>
            <li>Distributed & Cloud Systems</li>
            <li>Data Science & Big Data Analytics</li>
            <li>Information Retrieval & NLP</li>
          </ul>
        </section>

        {/* ================= REVIEW MODEL ================= */}
        <section className="mt-10 rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Review Model
          </h2>

          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>✔ Double-blind peer review process</li>
            <li>✔ Conflict-of-interest detection</li>
            <li>✔ Reviewer expertise matching</li>
            <li>✔ Minimum two independent reviewers per paper</li>
            <li>✔ Bias-aware assignment and load balancing</li>
          </ul>
        </section>

        {/* ================= REVIEW PROCESS TIMELINE ================= */}
        <section className="mt-10 rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Review Process
          </h2>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="rounded-full border px-4 py-2">Submit Paper</span>
            <span>→</span>
            <span className="rounded-full border px-4 py-2">Reviewer Assignment</span>
            <span>→</span>
            <span className="rounded-full border px-4 py-2">Peer Review</span>
            <span>→</span>
            <span className="rounded-full border px-4 py-2">Decision</span>
          </div>
        </section>

        {/* ================= COMMITTEES ================= */}
        <section className="mt-10 rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Organizing Committee
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2 text-sm text-gray-600">
            <div>
              <strong>General Chair</strong>
              <div>Dr. A. Sharma, IIT Bombay</div>
            </div>

            <div>
              <strong>Program Chairs</strong>
              <div>Dr. R. Sen, IISc Bangalore</div>
              <div>Dr. M. Das, IIT Kharagpur</div>
            </div>

            <div>
              <strong>Track Chairs</strong>
              <div>AI & ML, Systems, Security</div>
            </div>

            <div>
              <strong>Technical Program Committee</strong>
              <div>International reviewers from academia and industry</div>
            </div>
          </div>
        </section>

        {/* ================= SUBMISSION GUIDELINES ================= */}
        <section className="mt-10 rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Submission Guidelines
          </h2>

          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>✔ Papers must be original and unpublished</li>
            <li>✔ Maximum 8 pages (IEEE format)</li>
            <li>✔ Author identities must be anonymized</li>
            <li>✔ Plagiarism check will be conducted</li>
          </ul>
        </section>

        {/* ================= FOOTER ================= */}
        <footer className="mt-14 text-center text-sm text-gray-500">
          © ICAIDS 2026 · Department of Computer Science  
          <div>Contact: icads2026@conference.org</div>
        </footer>

      </div>
    </div>
  );
}
