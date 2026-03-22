import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* Public pages */
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

/* Route protection */
import ProtectedRoute from "./routes/ProtectedRoute";

/* Author */
import AuthorLayout from "./pages/author/AuthorLayout";
import AuthorDashboard from "./pages/author/Dashboard";
import SubmitPaper from "./pages/author/SubmitPaper";
import AuthorSubmissions from "./pages/author/Submissions";
import SubmissionDetails from "./pages/author/SubmissionDetails";

/* Reviewer */
import ReviewerLayout from "./pages/reviewer/ReviewerLayout";
import ReviewerDashboard from "./pages/reviewer/Dashboard";
import ReviewerProfile from "./pages/reviewer/Profile";
import ReviewerAssigned from "./pages/reviewer/Assigned";
import ReviewerPaperDetails from "./pages/reviewer/PaperDetails";
import ReviewForm from "./pages/reviewer/ReviewForm";

/* Admin */
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSubmissions from "./pages/admin/Submissions";
import AdminReviewers from "./pages/admin/Reviewers";
import AdminAssign from "./pages/admin/Assign";
import AdminDecisions from "./pages/admin/Decisions";

/* Common Profile */
import EditProfile from "./pages/profile/EditProfile";

export default function App() {
  return (
    <Routes>
      {/* ================= Public ================= */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ================= Author ================= */}
      <Route
        path="/author"
        element={
          <ProtectedRoute allowedRoles={["author"]}>
            <AuthorLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AuthorDashboard />} />
        <Route path="submit" element={<SubmitPaper />} />
        <Route path="submissions" element={<AuthorSubmissions />} />
        <Route path="submissions/:paperId" element={<SubmissionDetails />} />
        <Route index element={<Navigate to="/author/dashboard" replace />} />
      </Route>

      {/* ================= Reviewer ================= */}
      <Route
        path="/reviewer"
        element={
          <ProtectedRoute allowedRoles={["reviewer"]}>
            <ReviewerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<ReviewerDashboard />} />
        <Route path="profile" element={<ReviewerProfile />} />
        <Route path="assigned" element={<ReviewerAssigned />} />
        <Route path="paper/:paperId" element={<ReviewerPaperDetails />} />
        <Route path="review/:paperId" element={<ReviewForm />} />
        <Route index element={<Navigate to="/reviewer/dashboard" replace />} />
      </Route>

      {/* ================= Admin ================= */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="submissions" element={<AdminSubmissions />} />
        <Route path="reviewers" element={<AdminReviewers />} />
        <Route path="assign" element={<AdminAssign />} />
        <Route path="decisions" element={<AdminDecisions />} />
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* ================= Edit Profile (Common) ================= */}
      <Route
        path="pages/profile/EditProfile"
        element={
          <ProtectedRoute allowedRoles={["author", "reviewer", "admin"]}>
            <EditProfile />
          </ProtectedRoute>
        }
      />

      {/* ================= Fallback ================= */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
