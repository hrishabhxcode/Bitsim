import React, { useState } from "react";
import { useCustomCoins } from "../context/CustomCoinsContext";

export default function CreateCoin() {
  const { createCoin, coins } = useCustomCoins();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [price, setPrice] = useState(1);
  const [rate, setRate] = useState(0.0001);
  const [msg, setMsg] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const res = createCoin(name, symbol, price, rate);
    setMsg(res.ok ? `Created ${symbol}` : res.msg);
    if (res.ok) {
      setName("");
      setSymbol("");
      setPrice(1);
      setRate(0.0001);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <form onSubmit={submit} className="card" style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Create Your Own Coin</div>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: 8 }} />
        <input placeholder="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} style={{ padding: 8 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" step="0.0001" min="0.0001" placeholder="Initial Price" value={price} onChange={(e) => setPrice(e.target.value)} style={{ padding: 8, flex: 1 }} />
          <input type="number" step="0.0001" min="0.0001" placeholder="Mine Rate (per sec)" value={rate} onChange={(e) => setRate(e.target.value)} style={{ padding: 8, flex: 1 }} />
        </div>
        <button type="submit" style={{ padding: "8px 12px" }}>Create</button>
        {msg && <div style={{ color: "#0ea5e9" }}>{msg}</div>}
      </form>

      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Your Coins</div>
        {coins.length === 0 && <div style={{ color: "#64748b" }}>No custom coins yet.</div>}
        {coins.map((c) => (
          <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, padding: "8px 0", borderTop: "1px solid #f1f5f9" }}>
            <div>{c.name} ({c.symbol})</div>
            <div>${c.price.toFixed(4)}</div>
            <div>Holdings: {(c.userHoldings || 0).toFixed(6)}</div>
            <div>Rate: {(c.mineRate || 0).toFixed(6)}/s</div>
          </div>
        ))}
      </div>
    </div>
  );
}
