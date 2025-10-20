import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCredentials } from "../context/CredentialsContext";

export default function Auth() {
  const { session, register, login, logout, users } = useAuth();
  const { address, publicProof } = useCredentials();
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState("");

  const doRegister = async () => {
    const res = register(username);
    setMsg(res.ok ? "Registered & logged in" : res.msg);
  };
  const doLogin = async () => {
    const res = await login();
    setMsg(res.ok ? "Logged in" : res.msg);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Account</div>
        {session ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div><strong>User:</strong> {session.username}</div>
            <div style={{ wordBreak: "break-all" }}><strong>Address:</strong> {session.address}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={logout} style={{ padding: "8px 12px" }}>Logout</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 14, color: "#64748b" }}>Not logged in. Register to create an on-chain user, or login if already registered.</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ padding: 8, minWidth: 200 }} />
              <button onClick={doRegister} style={{ padding: "8px 12px" }}>Register</button>
              <button onClick={doLogin} style={{ padding: "8px 12px" }}>Login</button>
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Your address: {address}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Public proof: {publicProof}</div>
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Registered Users</div>
        {Object.keys(users || {}).length === 0 && <div style={{ color: "#64748b" }}>No users yet.</div>}
        {Object.entries(users || {}).map(([addr, u]) => (
          <div key={addr} style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 8, padding: "6px 0", borderTop: "1px solid #1f2937" }}>
            <div style={{ fontWeight: 600 }}>{u.username}</div>
            <div style={{ wordBreak: "break-all" }}>{addr}</div>
          </div>
        ))}
      </div>

      {msg && <div style={{ color: "#0ea5e9" }}>{msg}</div>}
    </div>
  );
}
