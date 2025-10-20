import React from "react";
import { useCredentials } from "../context/CredentialsContext";

export default function Credentials() {
  const { address, secret, regenerate } = useCredentials();
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Blockchain Credentials</div>
        <div style={{ wordBreak: "break-all" }}><strong>Address:</strong> {address}</div>
        <div style={{ wordBreak: "break-all" }}><strong>Secret:</strong> {secret}</div>
        <button onClick={regenerate} style={{ marginTop: 10, padding: "8px 12px" }}>Regenerate</button>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
          This is a demo-only identity stored in your browser. Do not use for real funds.
        </div>
      </div>
    </div>
  );
}
