import React from "react";
import { Outlet } from "react-router-dom";
import { DashboardShell } from "./_Shell";


export default function AuthorLayout() {
return (
<DashboardShell role="author" title="Author Dashboard">
<Outlet />
</DashboardShell>
);
}