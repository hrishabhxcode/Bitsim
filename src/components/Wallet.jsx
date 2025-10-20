import React from "react";
import { useSim } from "../context/SimContext";

export default function Wallet() {
  const { usd, btc, price } = useSim();
  const total = usd + btc * price;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
        <div style={{ fontSize: 12, color: "#64748b" }}>USD Balance</div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>${usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
        <div style={{ fontSize: 12, color: "#64748b" }}>BTC Balance</div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>{btc.toFixed(6)} BTC</div>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
        <div style={{ fontSize: 12, color: "#64748b" }}>Portfolio Value</div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
      </div>
    </div>
  );
}
