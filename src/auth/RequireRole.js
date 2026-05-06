import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "./AuthContext";

export default function RequireRole({ allowedRoles }) {
  const { roles } = useContext(AuthContext);

  const ok = allowedRoles.some((r) => roles.includes(r));
  if (!ok) return <Navigate to="/forbidden" replace />;

  return <Outlet />;
}
