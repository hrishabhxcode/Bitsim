import React, { useEffect, useMemo, useState } from "react";
import { getBaseUrl } from "../api/client";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminDashboard() {
  const { adminToken, logoutAdmin } = useAdminAuth();
  const [msg, setMsg] = useState("");

  // miners state
  const [miners, setMiners] = useState([]);
  const [loadingMiners, setLoadingMiners] = useState(false);

  // verify tx state
  const [tx, setTx] = useState({ type: "TRANSFER", token: "SIM", from: "", to: "", amount: 1, sig: "" });
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const b = getBaseUrl();
  const authHeaders = useMemo(() => adminToken ? { Authorization: `Bearer ${adminToken}` } : {}, [adminToken]);

  async function loadMiners() {
    if (!adminToken) return;
    setLoadingMiners(true);
    try {
      const res = await fetch(b + "/api/admin/miners", { headers: { ...authHeaders } }).then(r => r.json());
      if (res.ok) setMiners(res.miners || []);
    } catch (e) {
      setMsg(e.message);
    } finally { setLoadingMiners(false); }
  }

  async function doVerify() {
    if (!adminToken) return;
    setVerifying(true); setMsg(""); setVerifyResult(null);
    try {
      const res = await fetch(b + "/api/admin/verify-tx", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders }, body: JSON.stringify(tx) }).then(r => r.json());
      if (res.ok) setVerifyResult(res);
      else setMsg(res.msg || "Verification failed");
    } catch (e) { setMsg(e.message); }
    finally { setVerifying(false); }
  }

  useEffect(() => { loadMiners(); }, [adminToken]);

  return (
    <div className="grid gap-5">
      <div className="card shadow-soft" style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Admin Dashboard</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Authorized</span>
            <button onClick={logoutAdmin}>Logout</button>
          </div>
        </div>
        {msg && <div style={{ color: "#0ea5e9" }}>{msg}</div>}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="card shadow-soft" style={{ display: "grid", gap: 12 }}>
          <div style={{ fontWeight: 600 }}>Miners Overview</div>
          {loadingMiners && <div style={{ color: "#94a3b8" }}>Loading miners...</div>}
          {!loadingMiners && miners.length === 0 && <div style={{ color: "#64748b" }}>No miners yet.</div>}
          <div style={{ display: "grid", gap: 8 }}>
            {miners.map(m => (
              <div key={m.address} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", padding: "6px 0", borderTop: "1px solid #1f2937" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{m.label || m.address}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{m.address} • {m.enabled ? "enabled" : "disabled"} • verified: {m.verifiedCount || 0}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Go to Admin Miners for full management.</div>
        </div>

        <div className="card shadow-soft" style={{ display: "grid", gap: 12 }}>
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
            <div>
              <button onClick={doVerify} disabled={!adminToken || verifying}>{verifying ? "Verifying..." : "Verify"}</button>
            </div>
            {verifyResult && (
              <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                {JSON.stringify(verifyResult, null, 2)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
