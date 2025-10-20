import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getBaseUrl } from "../api/client";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAdminToken } = useAdminAuth();
  const nav = useNavigate();
  const location = useLocation();

  async function doLogin(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const res = await fetch(getBaseUrl() + "/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      }).then(r => r.json());
      if (res.ok && res.token) {
        setAdminToken(res.token);
        const to = location.state?.from?.pathname || "/admin/dashboard";
        nav(to, { replace: true });
      } else {
        setMsg(res.msg || "Login failed");
      }
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 sm:gap-5">
      <div className="card shadow-soft" style={{ display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 18 }}>Admin Login</div>
        <form onSubmit={doLogin} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ minWidth: 220 }} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ minWidth: 220 }} />
          <button type="submit" disabled={loading || !username || !password}>{loading ? "Logging in..." : "Login"}</button>
        </form>
        {msg && <div style={{ color: "#0ea5e9" }}>{msg}</div>}
      </div>
    </div>
  );
}
