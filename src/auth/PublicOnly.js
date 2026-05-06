import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "./AuthContext";

export default function PublicOnly() {
  const { isAuth } = useContext(AuthContext);

  if (isAuth) return <Navigate to="/" replace />;
  return <Outlet />;
}
