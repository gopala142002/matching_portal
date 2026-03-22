import React from "react";
import { Outlet } from "react-router-dom";
import { DashboardShell } from "../author/_Shell";


export default function ReviewerLayout() {
return (
<DashboardShell role="reviewer" title="Reviewer Dashboard">
<Outlet />
</DashboardShell>
);
}