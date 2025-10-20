import React from "react";

export default function BlockGraph({ chain }) {
  if (!Array.isArray(chain) || chain.length === 0) return null;
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Graphical Chain Simulation</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, minHeight: 120 }}>
        {chain.map((b, i) => (
          <React.Fragment key={b.index}>
            <div className="anim-pop" style={{
              minWidth: 220,
              border: "1px solid #1f2937",
              borderRadius: 10,
              padding: 10,
              background: i === 0 ? "#111827" : "#0f172a",
              boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
              animationDelay: `${i * 80}ms`
            }}>
              <div style={{ fontWeight: 700 }}>#{b.index}{i === 0 ? " (Genesis)" : ""}</div>
              <div style={{ fontSize: 12, color: "#93c5fd", wordBreak: "break-all" }}>prev: {b.prevHash}</div>
              <div style={{ fontSize: 12, wordBreak: "break-all" }}>hash: {b.hash}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>txs: {b.txs?.length || 0} | nonce: {b.nonce}</div>
            </div>
            {i < chain.length - 1 && (
              <div className="anim-pulse" style={{ color: "#64748b" }}>➜</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
