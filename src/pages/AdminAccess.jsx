import React, { useEffect, useMemo, useState } from "react";
import { getBaseUrl } from "../api/client";

function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, color: "#94a3b8" }}>{label}</div>
      {children}
    </div>
  );
}

export default function AdminAccess() {
  const [username, setUsername] = useState("hrishabh.bit");
  const [password, setPassword] = useState("hrishabh.bit");
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState("");

  const [childrenRows, setChildrenRows] = useState([]);
  const [stats, setStats] = useState({ children: 0, verifications: 0 });
  const [verifications, setVerifications] = useState([]);

  const [newChild, setNewChild] = useState({ address: "", label: "", secret: "" });
  const [signPayload, setSignPayload] = useState({ address: "", secret: "", payload: { type: "TRANSFER", token: "SIM", from: "", to: "", amount: 1 } });
  const [sigResult, setSigResult] = useState("");

  const b = getBaseUrl();
  const authHeaders = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

  async function adminLogin() {
    setMsg("");
    try {
      const res = await fetch(b + "/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      }).then(r => r.json());
      if (res.ok) { setToken(res.token); setMsg("Logged in"); await refreshAll(res.token); }
      else setMsg(res.msg || "Login failed");
    } catch (e) { setMsg(e.message); }
  }

  async function refreshAll(tok = token) {
    try {
      const [ch, st, vr] = await Promise.all([
        fetch(b + "/api/admin/children", { headers: { ...authHeaders, Authorization: `Bearer ${tok}` } }).then(r => r.json()),
        fetch(b + "/api/admin/stats", { headers: { ...authHeaders, Authorization: `Bearer ${tok}` } }).then(r => r.json()),
        fetch(b + "/api/admin/verifications?limit=50", { headers: { ...authHeaders, Authorization: `Bearer ${tok}` } }).then(r => r.json()),
      ]);
      if (ch?.ok) setChildrenRows(ch.children || []);
      if (st?.ok) setStats(st.counts || { children: 0, verifications: 0 });
      if (vr?.ok) setVerifications(vr.verifications || []);
    } catch (e) {
      // ignore until logged in
    }
  }

  async function addOrUpdateChild() {
    setMsg("");
    try {
      const res = await fetch(b + "/api/admin/children", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(newChild)
      }).then(r => r.json());
      if (res.ok) { setMsg("Child saved"); setNewChild({ address: "", label: "", secret: "" }); await refreshAll(); }
      else setMsg(res.msg || "Failed");
    } catch (e) { setMsg(e.message); }
  }

  async function toggleChild(address, enabled) {
    try {
      const res = await fetch(b + `/api/admin/children/${encodeURIComponent(address)}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ enabled })
      }).then(r => r.json());
      if (res.ok) await refreshAll();
    } catch {}
  }

  async function signWithChild() {
    setSigResult(""); setMsg("");
    try {
      const res = await fetch(b + `/api/admin/children/${encodeURIComponent(signPayload.address)}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ secret: signPayload.secret, payload: signPayload.payload })
      }).then(r => r.json());
      if (res.ok) setSigResult(res.sig);
      else setMsg(res.msg || "Sign failed");
    } catch (e) { setMsg(e.message); }
  }

  useEffect(() => {
    if (token) refreshAll();
  }, [token]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card" style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Admin Login</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ minWidth: 200 }} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ minWidth: 200 }} />
          <button onClick={adminLogin}>Login</button>
        </div>
        {token && <div style={{ fontSize: 12, color: "#93c5fd" }}>Token: {token}</div>}
      </div>

      <div className="card" style={{ display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 600 }}>Stats</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div>Children: {stats.children}</div>
          <div>Verifications: {stats.verifications}</div>
        </div>
      </div>

      <div className="card" style={{ display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 600 }}>Add / Update Child Access</div>
        <div style={{ display: "grid", gap: 8 }}>
          <Field label="Address"><input value={newChild.address} onChange={(e) => setNewChild({ ...newChild, address: e.target.value })} /></Field>
          <Field label="Label (optional)"><input value={newChild.label} onChange={(e) => setNewChild({ ...newChild, label: e.target.value })} /></Field>
          <Field label="Secret (kept only as hash)"><input type="password" value={newChild.secret} onChange={(e) => setNewChild({ ...newChild, secret: e.target.value })} /></Field>
          <div><button onClick={addOrUpdateChild} disabled={!token}>Save Child</button></div>
        </div>
      </div>

      <div className="card" style={{ display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 600 }}>Manage Children</div>
        {childrenRows.length === 0 && <div style={{ color: "#64748b" }}>No children yet.</div>}
        {childrenRows.map((c) => (
          <div key={c.address} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center", padding: "8px 0", borderTop: "1px solid #1f2937" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{c.label || c.address}</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{c.address} • {c.enabled ? "enabled" : "disabled"}</div>
            </div>
            <button onClick={() => toggleChild(c.address, !c.enabled)}>{c.enabled ? "Disable" : "Enable"}</button>
            <button onClick={() => setSignPayload(sp => ({ ...sp, address: c.address }))}>Use to Sign</button>
          </div>
        ))}
      </div>

      <div className="card" style={{ display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 600 }}>Sign Payload With Child</div>
        <div style={{ display: "grid", gap: 8 }}>
          <Field label="Child Address"><input value={signPayload.address} onChange={(e) => setSignPayload({ ...signPayload, address: e.target.value })} /></Field>
          <Field label="Child Secret"><input type="password" value={signPayload.secret} onChange={(e) => setSignPayload({ ...signPayload, secret: e.target.value })} /></Field>
          <Field label="Payload JSON">
            <textarea rows={5} value={JSON.stringify(signPayload.payload)} onChange={(e) => {
              try { setSignPayload({ ...signPayload, payload: JSON.parse(e.target.value) }); } catch {}
            }} />
          </Field>
          <div><button onClick={signWithChild} disabled={!token}>Sign</button></div>
          {sigResult && <div style={{ fontFamily: "monospace", fontSize: 12 }}>sig: {sigResult}</div>}
        </div>
      </div>

      <div className="card" style={{ display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 600 }}>Recent Verifications</div>
        {verifications.length === 0 && <div style={{ color: "#64748b" }}>None yet.</div>}
        {verifications.map(v => (
          <div key={v._id} style={{ padding: "8px 0", borderTop: "1px solid #1f2937" }}>
            <div style={{ fontSize: 12, color: v.valid ? "#10b981" : "#ef4444" }}>{v.valid ? "VALID" : "INVALID"} • {new Date(v.createdAt).toLocaleString()}</div>
            <div style={{ fontFamily: "monospace", fontSize: 12 }}>{JSON.stringify(v.tx)}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>reason: {v.reason}</div>
          </div>
        ))}
      </div>

      {msg && <div style={{ color: "#0ea5e9" }}>{msg}</div>}
    </div>
  );
}
