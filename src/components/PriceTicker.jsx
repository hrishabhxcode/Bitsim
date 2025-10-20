import React from "react";
import { useSim } from "../context/SimContext";

function Sparkline({ data, width = 240, height = 60, stroke = "#16a34a" }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const norm = (v) => (max === min ? height / 2 : height - ((v - min) / (max - min)) * height);
  const step = width / (data.length - 1);
  const d = data
    .map((v, i) => `${i === 0 ? "M" : "L"}${i * step.toFixed ? (i * step).toFixed(2) : i * step},${norm(v).toFixed(2)}`)
    .join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

export default function PriceTicker() {
  const { price, prices } = useSim();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 14, color: "#64748b" }}>BTC/USD</div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>${price.toLocaleString()}</div>
      </div>
      <Sparkline data={prices} />
    </div>
  );
}
