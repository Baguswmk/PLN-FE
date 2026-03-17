import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "@/modules/auth/components/AuthProvider.jsx";

export default function PrivateRoute() {
  const { isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
