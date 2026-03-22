import React from "react";
import { Navigate } from "react-router-dom";
import { getRole } from "../data/mockDb";

export default function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem("access");
  const role = getRole();   // 🔥 NO default fallback

  // ❌ Not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (!role) 
    {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(role)) 
  {
    return <Navigate to="/login" replace />;
  }
  return children;
}