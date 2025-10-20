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

function QR({ text, size = 128 }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  return <img src={url} alt="qr" width={size} height={size} style={{ border: "1px solid #1f2937", borderRadius: 8 }} />;
}

export default function AdminMiners() {
  const [username, setUsername] = useState("hrishabh.bit");
  const [password, setPassword] = useState("hrishabh.bit");
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState("");

  const [miners, setMiners] = useState([]);
  const [newMiner, setNewMiner] = useState({ address: "", label: "", secret: "" });
  const [signData, setSignData] = useState({ address: "", secret: "", payload: { type: "TRANSFER", token: "SIM", from: "", to: "", amount: 1 } });
  const [signature, setSignature] = useState("");
  const [verifyData, setVerifyData] = useState({ address: "", payload: { hello: "world" }, signature: "" });
  const [verifyResult, setVerifyResult] = useState(null);

  const b = getBaseUrl();
  const authHeaders = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

  async function login() {
    setMsg("");
    try {
      const res = await fetch(b + "/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) }).then(r => r.json());
      if (res.ok) { setToken(res.token); setMsg("Logged in"); await loadMiners(res.token); }
      else setMsg(res.msg || "Login failed");
    } catch (e) { setMsg(e.message); }
  }

  async function loadMiners(tok = token) {
    try {
      const res = await fetch(b + "/api/admin/miners", { headers: { ...authHeaders, Authorization: `Bearer ${tok}` } }).then(r => r.json());
      if (res.ok) setMiners(res.miners || []);
    } catch {}
  }

  async function saveMiner() {
    setMsg("");
    try {
      const res = await fetch(b + "/api/admin/miners", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders }, body: JSON.stringify(newMiner) }).then(r => r.json());
      if (res.ok) { setMsg("Miner saved"); setNewMiner({ address: "", label: "", secret: "" }); await loadMiners(); }
      else setMsg(res.msg || "Failed");
    } catch (e) { setMsg(e.message); }
  }

  async function toggleMiner(address, enabled) {
    try {
      const res = await fetch(b + `/api/admin/miners/${encodeURIComponent(address)}/toggle`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders }, body: JSON.stringify({ enabled }) }).then(r => r.json());
      if (res.ok) await loadMiners();
    } catch {}
  }

  async function signWithMiner() {
    setSignature(""); setMsg("");
    try {
      const res = await fetch(b + `/api/admin/miners/${encodeURIComponent(signData.address)}/sign`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders }, body: JSON.stringify({ secret: signData.secret, payload: signData.payload }) }).then(r => r.json());
      if (res.ok) setSignature(res.sig);
      else setMsg(res.msg || "Sign failed");
    } catch (e) { setMsg(e.message); }
  }

  async function verifyWithMiner() {
    setVerifyResult(null); setMsg("");
    try {
      const res = await fetch(b + `/api/admin/miners/${encodeURIComponent(verifyData.address)}/verify`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders }, body: JSON.stringify({ payload: verifyData.payload, signature: verifyData.signature }) }).then(r => r.json());
      if (res.ok) setVerifyResult(res);
      else setMsg(res.msg || "Verify failed");
    } catch (e) { setMsg(e.message); }
  }

  useEffect(() => { if (token) loadMiners(); }, [token]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card" style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Admin Login</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={login}>Login</button>
        </div>
      </div>

      <div className="card" style={{ display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 600 }}>Create / Update Miner</div>
        <div style={{ display: "grid", gap: 8 }}>
          <Field label="Address"><input value={newMiner.address} onChange={(e) => setNewMiner({ ...newMiner, address: e.target.value })} /></Field>
          <Field label="Label (optional)"><input value={newMiner.label} onChange={(e) => setNewMiner({ ...newMiner, label: e.target.value })} /></Field>
          <Field label="Secret (stored as hash)"><input type="password" value={newMiner.secret} onChange={(e) => setNewMiner({ ...newMiner, secret: e.target.value })} /></Field>
          <div><button onClick={saveMiner} disabled={!token}>Save Miner</button></div>
        </div>
      </div>

      <div className="card" style={{ display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 600 }}>Miners</div>
        {miners.length === 0 && <div style={{ color: "#64748b" }}>No miners yet.</div>}
        {miners.map(m => (
          <div key={m.address} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 8, alignItems: "center", padding: "8px 0", borderTop: "1px solid #1f2937" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{m.label || m.address}</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{m.address} • {m.enabled ? "enabled" : "disabled"} • verified: {m.verifiedCount || 0}</div>
            </div>
            <QR text={m.address} size={84} />
            <button onClick={() => toggleMiner(m.address, !m.enabled)}>{m.enabled ? "Disable" : "Enable"}</button>
            <button onClick={() => { setSignData(sd => ({ ...sd, address: m.address })); setVerifyData(vd => ({ ...vd, address: m.address })); }}>Use</button>
          </div>
        ))}
      </div>

      <div className="card" style={{ display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 600 }}>Sign Payload (with Miner)</div>
        <div style={{ display: "grid", gap: 8 }}>
          <Field label="Miner Address"><input value={signData.address} onChange={(e) => setSignData({ ...signData, address: e.target.value })} /></Field>
          <Field label="Miner Secret"><input type="password" value={signData.secret} onChange={(e) => setSignData({ ...signData, secret: e.target.value })} /></Field>
          <Field label="Payload JSON">
            <textarea rows={5} value={JSON.stringify(signData.payload)} onChange={(e) => { try { setSignData({ ...signData, payload: JSON.parse(e.target.value) }); } catch {} }} />
          </Field>
          <div><button onClick={signWithMiner} disabled={!token}>Sign</button></div>
          {signature && <div style={{ fontFamily: "monospace", fontSize: 12 }}>signature: {signature}</div>}
        </div>
      </div>

      <div className="card" style={{ display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 600 }}>Verify Signature (by Miner)</div>
        <div style={{ display: "grid", gap: 8 }}>
          <Field label="Miner Address"><input value={verifyData.address} onChange={(e) => setVerifyData({ ...verifyData, address: e.target.value })} /></Field>
          <Field label="Payload JSON">
            <textarea rows={5} value={JSON.stringify(verifyData.payload)} onChange={(e) => { try { setVerifyData({ ...verifyData, payload: JSON.parse(e.target.value) }); } catch {} }} />
          </Field>
          <Field label="Signature"><input value={verifyData.signature} onChange={(e) => setVerifyData({ ...verifyData, signature: e.target.value })} /></Field>
          <div><button onClick={verifyWithMiner} disabled={!token}>Verify</button></div>
          {verifyResult && (<div style={{ fontFamily: "monospace", fontSize: 12 }}>{JSON.stringify(verifyResult, null, 2)}</div>)}
        </div>
      </div>

      {msg && <div style={{ color: "#0ea5e9" }}>{msg}</div>}
    </div>
  );
}
