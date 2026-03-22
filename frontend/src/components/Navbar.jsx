import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRole, setRole, clearRole } from "../data/mockDb";
import api from "../pages/api";

export default function Navbar({ title, onMenuClick }) {
  const navigate = useNavigate();

  const role = getRole();   // 🔥 SINGLE SOURCE OF TRUTH
  const access = localStorage.getItem("access");

  const [open, setOpen] = useState(false);

  const roleMap = {
    author: "/author/dashboard",
    reviewer: "/reviewer/dashboard",
    admin: "/admin/dashboard",
  };

  async function handleLogout() {
    try {
      const refresh = localStorage.getItem("refresh");
      const access = localStorage.getItem("access");

      if (refresh) {
        await api.post(
          "/api/auth/logout/",
          { refresh },
          {
            headers: {
              Authorization: `Bearer ${access}`,
            },
          }
        );
      }
    } catch (err) {
      console.error("Logout error:", err.response?.data || err);
    } finally {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("is_admin"); // optional
      clearRole();

      navigate("/login");
    }
  }

  function switchRole(newRole) {
    if (newRole === role) {
      setOpen(false);
      return;
    }

    setRole(newRole);
    setOpen(false);
    navigate(roleMap[newRole]);
  }

  const availableRoles = ["author", "reviewer"];

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-4 py-3">
      
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button
          className="md:hidden rounded-lg border px-3 py-2 text-sm"
          onClick={onMenuClick}
        >
          Menu
        </button>

        <div>
          <div className="text-sm text-gray-500">Conference Portal</div>
          <div className="text-lg font-semibold text-gray-900">{title}</div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">

        {/* 🔥 Role switch (ONLY for non-admin) */}
        {role && role !== "admin" && (
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm text-white"
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
              <span className="text-xs">▼</span>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-40 py-1 rounded-md border bg-white shadow-lg">
                {availableRoles.map((r) => (
                  <button
                    key={r}
                    onClick={() => switchRole(r)}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 🔥 Admin badge */}
        {role === "admin" && (
          <span className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm">
            Admin
          </span>
        )}

        {/* LOGIN / LOGOUT */}
        {access ? (
          <button
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
            onClick={handleLogout}
          >
            Logout
          </button>
        ) : (
          <button
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
}