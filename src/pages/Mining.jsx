import React, { useState } from "react";
import { useCustomCoins } from "../context/CustomCoinsContext";

export default function Mining() {
  const { coins, miners, startMining, stopMining } = useCustomCoins();
  const [msg, setMsg] = useState("");

  const toggle = (id) => {
    const running = miners[id];
    if (running) {
      stopMining(id);
      setMsg("Stopped mining");
    } else {
      startMining(id);
      setMsg("Started mining");
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Mining Your Coins</div>
        {coins.length === 0 && <div style={{ color: "#64748b" }}>No custom coins yet. Create one first.</div>}
        {coins.map((c) => (
          <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 8, alignItems: "center", padding: "8px 0", borderTop: "1px solid #f1f5f9" }}>
            <div style={{ fontWeight: 600 }}>{c.name} ({c.symbol})</div>
            <div>Price: ${c.price.toFixed(4)}</div>
            <div>Holdings: {(c.userHoldings || 0).toFixed(6)}</div>
            <button onClick={() => toggle(c.id)} style={{ padding: "6px 10px" }}>
              {miners[c.id] ? "Stop" : "Start"} Mining
            </button>
          </div>
        ))}
        {msg && <div style={{ marginTop: 8, color: "#0ea5e9" }}>{msg}</div>}
      </div>
    </div>
  );
}
