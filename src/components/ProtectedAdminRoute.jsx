import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function ProtectedAdminRoute({ children }) {
  const { adminToken } = useAdminAuth();
  const location = useLocation();
  if (!adminToken) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }
  return children;
}
