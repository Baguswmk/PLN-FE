import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/modules/auth/components/AuthProvider.jsx";

/**
 * Higher Order Component to protect routes based on role.
 * @param {string[]} allowedRoles - Array of roles allowed to access this route
 */
export default function RoleBasedRoute({ allowedRoles, children }) {
  const { role } = useAuthContext();

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
