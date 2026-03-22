import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRole, setRole, clearRole } from "../data/mockDb";
import api from "../pages/api"

export default function Navbar({ title, onMenuClick }) {
  const navigate = useNavigate();
  const role = getRole();
  const access = localStorage.getItem("access")
  const [open, setOpen] = useState(false);

  const roleMap = {
    author: "/author/dashboard",
    reviewer: "/reviewer/dashboard",
  };


  async function handleLogout() {
    try {
      const refresh = localStorage.getItem("refresh");
      const access = localStorage.getItem("access");

      if (!refresh) {
        console.log("No refresh token found");
        return;
      }

      const payload = { refresh };

      const res = await api.post(
        "/api/auth/logout/",
        payload,
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        }
      );

      console.log("Logout successful:", res.data);

      // ✅ Clear tokens
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      navigate("/");

    } catch (err) {
      console.error("Logout error:", err.response?.data || err);

      // Even if backend fails, clear tokens anyway
      localStorage.clear();
      navigate("/login");
    }
  }




  function switchRole(newRole) {
    if (newRole === role) {
      setOpen(false);
      return;
    }
    setRole(newRole);          // update role in localStorage
    setOpen(false);            // close dropdown
    navigate(roleMap[newRole]); // redirect to dashboard
  }
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-4 py-3">
      {/* Left section */}
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

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Role Switcher */}
        {role && (
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:cursor-pointer"
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
              <span className="text-xs">▼</span>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-40 py-1 rounded-md border bg-white shadow-lg">
                {["author", "reviewer"].map((r) => (
                  <button
                    key={r}
                    onClick={() => switchRole(r)}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 hover:cursor-pointer"
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Logout / Login */}
        {access ? (
          <button
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
            onClick={() => {
              // clearRole();
              handleLogout();
            }}
          >
            Logout
          </button>
        ) : (
          <button
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white cursor-pointer"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
}
