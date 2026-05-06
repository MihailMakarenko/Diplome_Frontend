import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

export default function ProfileRedirect() {
  const { roles } = useContext(AuthContext);

  // Если сотрудник — показываем профиль сотрудника
  if (roles?.includes("Employee"))
    return <Navigate to="/employee/profile" replace />;

  // Для Manager/Admin/User показываем общий профиль пользователя
  if (
    roles?.includes("Manager") ||
    roles?.includes("Admin") ||
    roles?.includes("User")
  ) {
    return <Navigate to="/user/profile" replace />;
  }

  return <Navigate to="/forbidden" replace />;
}
