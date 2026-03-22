import React from "react";
import { Outlet } from "react-router-dom";
import { DashboardShell } from "../author/_Shell";


export default function AdminLayout() {
return (
<DashboardShell role="admin" title="Admin Dashboard">
<Outlet />
</DashboardShell>
);
}