import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AdminAuthContext = createContext(null);

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function saveLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function AdminAuthProvider({ children }) {
  const [adminToken, setAdminToken] = useState(() => loadLS("admin_token", null));

  useEffect(() => { saveLS("admin_token", adminToken); }, [adminToken]);

  const logoutAdmin = () => setAdminToken(null);

  const value = useMemo(() => ({ adminToken, setAdminToken, logoutAdmin }), [adminToken]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
