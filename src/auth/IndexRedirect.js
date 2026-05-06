import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

export default function IndexRedirect() {
  const { roles } = useContext(AuthContext);

  if (roles.includes("Admin")) return <Navigate to="/admin/panel" replace />;
  if (roles.includes("Manager"))
    return <Navigate to="/manager/panel" replace />;
  if (roles.includes("Employee"))
    return <Navigate to="/employee/profile" replace />;
  if (roles.includes("User")) return <Navigate to="/user/profile" replace />;

  return <Navigate to="/forbidden" replace />;
}
