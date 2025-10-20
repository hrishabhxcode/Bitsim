import React, { useState } from "react";
import { useCustomCoins } from "../context/CustomCoinsContext";
import { useSim } from "../context/SimContext";

export default function Invest() {
  const { coins, investUsd, sellUnits } = useCustomCoins();
  const { usd } = useSim();
  const [amounts, setAmounts] = useState({});
  const [sellAmounts, setSellAmounts] = useState({});
  const [msg, setMsg] = useState("");

  const setAmt = (id, v) => setAmounts((m) => ({ ...m, [id]: v }));
  const setSell = (id, v) => setSellAmounts((m) => ({ ...m, [id]: v }));

  const doInvest = (id) => {
    const res = investUsd(id, amounts[id] || 0);
    setMsg(res.ok ? "Invested" : res.msg);
  };
  const doSell = (id) => {
    const res = sellUnits(id, sellAmounts[id] || 0);
    setMsg(res.ok ? "Sold" : res.msg);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>USD Available: ${usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Invest in Your Coins</div>
        {coins.length === 0 && <div style={{ color: "#64748b" }}>No custom coins yet. Create one first.</div>}
        {coins.map((c) => (
          <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 8, alignItems: "center", padding: "8px 0", borderTop: "1px solid #f1f5f9" }}>
            <div style={{ fontWeight: 600 }}>{c.name} ({c.symbol})</div>
            <div>${c.price.toFixed(4)}</div>
            <div>Holdings: {(c.userHoldings || 0).toFixed(6)}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" min="0" step="1" value={amounts[c.id] || ""} onChange={(e) => setAmt(c.id, e.target.value)} placeholder="USD" style={{ padding: 6, width: 100 }} />
              <button onClick={() => doInvest(c.id)} style={{ padding: "6px 10px" }}>Invest</button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" min="0" step="0.0001" value={sellAmounts[c.id] || ""} onChange={(e) => setSell(c.id, e.target.value)} placeholder="Units" style={{ padding: 6, width: 100 }} />
              <button onClick={() => doSell(c.id)} style={{ padding: "6px 10px" }}>Sell</button>
            </div>
          </div>
        ))}
        {msg && <div style={{ marginTop: 8, color: "#0ea5e9" }}>{msg}</div>}
      </div>
    </div>
  );
}
