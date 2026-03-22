import React from "react";
import { Navigate } from "react-router-dom";
import { getRole } from "../data/mockDb";


export default function ProtectedRoute({ allowedRoles, children }) {
let role = getRole();
if (!role) role = "author";
if (allowedRoles && !allowedRoles.includes(role)) {
// redirect to their own dashboard
const map = {
author: "/author/dashboard",
reviewer: "/reviewer/dashboard",
admin: "/admin/dashboard",
};
return <Navigate to={map[role] || "/"} replace />;
}
return children;
}