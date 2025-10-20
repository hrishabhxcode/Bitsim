import React from "react";
import { useSim } from "../context/SimContext";

function formatTs(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}

export default function History() {
  const { history } = useSim();
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>History</div>
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr", gap: 8, fontSize: 14, color: "#334155" }}>
        <div style={{ fontWeight: 600 }}>Time</div>
        <div style={{ fontWeight: 600 }}>Type</div>
        <div style={{ fontWeight: 600 }}>BTC</div>
        <div style={{ fontWeight: 600 }}>USD @ Price</div>
        {history.length === 0 && <div style={{ gridColumn: "1 / -1", color: "#64748b" }}>No trades yet.</div>}
        {history.map((h, i) => (
          <React.Fragment key={i}>
            <div>{formatTs(h.ts)}</div>
            <div>{h.type}</div>
            <div>{(h.type === "BUY" ? h.btc : -h.btc).toFixed(6)}</div>
            <div>${(h.type === "BUY" ? h.usd : -h.usd).toFixed(2)} @ ${h.price.toLocaleString()}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
