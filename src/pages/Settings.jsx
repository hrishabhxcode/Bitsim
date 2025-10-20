import React, { useState } from "react";
import { useSim } from "../context/SimContext";
import { useCustomCoins } from "../context/CustomCoinsContext";
import { useBlockchain } from "../context/BlockchainContext";
import { getUseServer, setUseServer, getBaseUrl, setBaseUrl } from "../api/client";

export default function Settings() {
  const { exportState: expSim, importState: impSim, resetState: resetSim } = useSim();
  const { exportState: expCc, importState: impCc, resetState: resetCc } = useCustomCoins();
  const { exportState: expBc, importState: impBc, resetState: resetBc, minerAddress, setMinerAddress, feeFlat, setFeeFlat, rewardPow, setRewardPow } = useBlockchain();

  const [io, setIo] = useState("");
  const [msg, setMsg] = useState("");
  const [useServer, setUseServerState] = useState(() => getUseServer());
  const [baseUrl, setBaseUrlState] = useState(() => getBaseUrl());

  const exportAll = () => {
    const payload = {
      sim: JSON.parse(expSim()),
      custom: JSON.parse(expCc()),
      chain: JSON.parse(expBc()),
    };
    setIo(JSON.stringify(payload, null, 2));
    setMsg("Exported");
  };

  const importAll = () => {
    try {
      const obj = JSON.parse(io);
      impSim(obj.sim);
      impCc(obj.custom);
      impBc(obj.chain);
      setMsg("Imported");
    } catch (e) {
      setMsg("Invalid JSON");
    }
  };

  const resetAll = () => {
    resetSim();
    resetCc();
    resetBc();
    setMsg("Reset all");
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card" style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Backend Settings</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={useServer} onChange={(e) => setUseServerState(e.target.checked)} />
            Use Server (MongoDB)
          </label>
          <div>Base URL</div>
          <input value={baseUrl} onChange={(e) => setBaseUrlState(e.target.value)} style={{ padding: 8, minWidth: 280, flex: 1 }} />
          <button onClick={() => { setUseServer(useServer); setBaseUrl(baseUrl); window.location.reload(); }} style={{ padding: "8px 12px" }}>Apply & Reload</button>
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>When enabled, actions use your server (e.g., http://localhost:4000). Apply & reload to sync.</div>
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Mining & Fees</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div>Miner Address</div>
          <input value={minerAddress} onChange={(e) => setMinerAddress(e.target.value)} style={{ padding: 8, minWidth: 260, flex: 1 }} />
          <div>Fee (flat per transfer unit)</div>
          <input type="number" step="0.000001" value={feeFlat} onChange={(e) => setFeeFlat(Number(e.target.value))} style={{ padding: 8, width: 160 }} />
          <div>Reward (POW per block)</div>
          <input type="number" step="0.000001" value={rewardPow} onChange={(e) => setRewardPow(Number(e.target.value))} style={{ padding: 8, width: 160 }} />
        </div>
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Export / Import / Reset</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={exportAll} style={{ padding: "8px 12px" }}>Export All</button>
          <button onClick={importAll} style={{ padding: "8px 12px" }}>Import All</button>
          <button onClick={resetAll} style={{ padding: "8px 12px" }}>Reset All</button>
        </div>
        <textarea value={io} onChange={(e) => setIo(e.target.value)} rows={12} style={{ width: "100%", padding: 8, fontFamily: "monospace" }} />
        {msg && <div style={{ color: "#0ea5e9" }}>{msg}</div>}
      </div>
    </div>
  );
}
