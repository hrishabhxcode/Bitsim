import React, { useState } from "react";
import { useSim } from "../context/SimContext";

export default function TradePanel() {
  const { buy, sell, price, usd, btc } = useSim();
  const [buyUsd, setBuyUsd] = useState(100);
  const [sellBtc, setSellBtc] = useState(0.001);
  const [msg, setMsg] = useState("");

  const onBuy = () => {
    const res = buy(buyUsd);
    setMsg(res.ok ? "Bought" : res.msg);
  };
  const onSell = () => {
    const res = sell(sellBtc);
    setMsg(res.ok ? "Sold" : res.msg);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Buy BTC</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input value={buyUsd} onChange={(e) => setBuyUsd(e.target.value)} type="number" min="0" step="10" style={{ flex: 1, padding: 8 }} />
          <button onClick={onBuy} style={{ padding: "8px 12px" }}>Buy</button>
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>You get ~ {(Number(buyUsd) / price || 0).toFixed(6)} BTC</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>USD Available: ${usd.toLocaleString()}</div>
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Sell BTC</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input value={sellBtc} onChange={(e) => setSellBtc(e.target.value)} type="number" min="0" step="0.0001" style={{ flex: 1, padding: 8 }} />
          <button onClick={onSell} style={{ padding: "8px 12px" }}>Sell</button>
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>You get ~ ${(Number(sellBtc) * price || 0).toFixed(2)} USD</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>BTC Available: {btc.toFixed(6)} BTC</div>
      </div>
      {msg && <div style={{ gridColumn: "1 / -1", color: "#0ea5e9" }}>{msg}</div>}
    </div>
  );
}
