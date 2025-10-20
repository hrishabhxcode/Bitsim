import React, { useState } from "react";
import { api, getBaseUrl } from "../api/client";

export default function Admin() {
  const [username, setUsername] = useState("hrishabh.bit");
  const [password, setPassword] = useState("hrishabh.bit");
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState("");
  const [tx, setTx] = useState({ type: "TRANSFER", token: "SIM", from: "", to: "", amount: 1, sig: "" });
  const [result, setResult] = useState(null);

  const doLogin = async () => {
    try {
      const res = await fetch(getBaseUrl() + "/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      }).then((r) => r.json());
      if (res.ok) { setToken(res.token); setMsg("Logged in as admin"); }
      else setMsg(res.msg || "Login failed");
    } catch (e) {
      setMsg(e.message);
    }
  };

  const doVerify = async () => {
    try {
      const res = await fetch(getBaseUrl() + "/api/admin/verify-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(tx)
      }).then((r) => r.json());
      if (res.ok) { setResult(res); setMsg("Verified"); }
      else setMsg(res.msg || "Verification failed");
    } catch (e) {
      setMsg(e.message);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card" style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Admin Login</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ minWidth: 200 }} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ minWidth: 200 }} />
          <button onClick={doLogin}>Login</button>
        </div>
        {token && <div style={{ fontSize: 12, color: "#93c5fd" }}>Token: {token}</div>}
      </div>

      <div className="card" style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Verify Transaction</div>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={tx.type} onChange={(e) => setTx({ ...tx, type: e.target.value })} style={{ padding: 8 }}>
              <option value="TRANSFER">TRANSFER</option>
              <option value="MINT">MINT</option>
            </select>
            <input placeholder="TOKEN" value={tx.token} onChange={(e) => setTx({ ...tx, token: e.target.value })} style={{ width: 140 }} />
            {tx.type === "TRANSFER" && (
              <input placeholder="FROM" value={tx.from} onChange={(e) => setTx({ ...tx, from: e.target.value })} style={{ minWidth: 200 }} />
            )}
            <input placeholder="TO" value={tx.to} onChange={(e) => setTx({ ...tx, to: e.target.value })} style={{ minWidth: 200 }} />
            <input type="number" min="0" step="0.000001" placeholder="AMOUNT" value={tx.amount} onChange={(e) => setTx({ ...tx, amount: Number(e.target.value) })} style={{ width: 160 }} />
            {tx.type === "MINT" && (
              <input placeholder="OWNER (optional)" value={tx.owner || ""} onChange={(e) => setTx({ ...tx, owner: e.target.value })} style={{ minWidth: 200 }} />
            )}
            <input placeholder="SIG (optional)" value={tx.sig || ""} onChange={(e) => setTx({ ...tx, sig: e.target.value })} style={{ minWidth: 200 }} />
          </div>
          <button onClick={doVerify} disabled={!token}>Verify</button>
          {result && (
            <div style={{ fontFamily: "monospace", fontSize: 12 }}>
              {JSON.stringify(result, null, 2)}
            </div>
          )}
        </div>
      </div>

      {msg && <div style={{ color: "#0ea5e9" }}>{msg}</div>}
    </div>
  );
}
