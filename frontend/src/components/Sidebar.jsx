import React from "react";
import { NavLink } from "react-router-dom";

/* Single menu item */
function Item({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-xl px-3 py-2 text-sm font-medium transition ${
          isActive
            ? "bg-gray-900 text-white"
            : "text-gray-700 hover:bg-gray-100"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function Sidebar({ role, open, onClose }) {
  const menus = {
    author: [
      { to: "/author/dashboard", label: "Dashboard" },
      { to: "/author/submit", label: "Submit Paper" },
      { to: "/author/submissions", label: "My Submissions" },
    ],
    reviewer: [
      { to: "/reviewer/dashboard", label: "Dashboard" },
      { to: "/reviewer/assigned", label: "Assigned Papers" },
    ],
    admin: [
      { to: "/admin/dashboard", label: "Dashboard" },
      { to: "/admin/submissions", label: "All Submissions" },
      { to: "/admin/reviewers", label: "Reviewers" },
      { to: "/admin/assign", label: "Auto Assign" },
      { to: "/admin/decisions", label: "Decisions" },
    ],
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 h-full w-72 border-r bg-white p-4 transition-transform
        md:translate-x-0 md:static
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Menu</div>
            <div className="text-base font-semibold">
              {role?.toUpperCase()}
            </div>
          </div>

          <button
            className="md:hidden rounded-lg border px-3 py-2 text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Role menus */}
        <div className="space-y-2">
          {(menus[role] || []).map((m) => (
            <Item key={m.to} to={m.to} label={m.label} />
          ))}
        </div>

        {/* Account section */}
        <div className="mt-6">
          <div className="mb-2 text-xs font-semibold uppercase text-gray-500">
            Account
          </div>
          <Item to="../pages/profile/EditProfile" label="Edit Profile" />
        </div>

        {/* Info card */}
        <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
          <div className="font-medium text-gray-900">Bias-Free Review</div>
          <div className="mt-1">
            Reviewer pages hide author identity to support double-blind workflow.
          </div>
        </div>
      </aside>
    </>
  );
}
