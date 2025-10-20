import React, { useMemo, useState } from "react";
import { useCredentials } from "../context/CredentialsContext";

function shaLike(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 131 + str.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}

function PoWDemo({ txs }) {
  const [difficulty, setDifficulty] = useState(3);
  const [nonce, setNonce] = useState(0);
  const [hash, setHash] = useState("");
  const header = useMemo(() => JSON.stringify({ prevHash: "0000abcd", txs }), [txs]);

  const step = () => {
    const n = nonce + 1;
    const h = shaLike(header + n);
    setNonce(n);
    setHash(h);
  };
  const run = () => {
    let n = nonce;
    let h = hash;
    while (!h.startsWith("0".repeat(difficulty))) {
      n += 1;
      h = shaLike(header + n);
      if (n - nonce > 20000) break; // prevent long loop
    }
    setNonce(n);
    setHash(h);
  };
  const reset = () => { setNonce(0); setHash(""); };

  return (
    <div className="card" style={{ display: "grid", gap: 8 }}>
      <div style={{ fontWeight: 600 }}>Proof of Work Demo</div>
      <div style={{ fontSize: 12, color: "#64748b" }}>Find a nonce so that hash(header + nonce) starts with N zeros.</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>Difficulty</div>
        <input type="number" min={1} max={6} value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} style={{ width: 100 }} />
        <button onClick={step}>Step</button>
        <button onClick={run}>Run</button>
        <button onClick={reset}>Reset</button>
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 12, color: "#93c5fd" }}>header: {header}</div>
      <div style={{ fontFamily: "monospace", fontSize: 12 }}>nonce: {nonce} hash: {hash} {hash && (hash.startsWith("0".repeat(difficulty)) ? "✅" : "❌")}</div>
    </div>
  );
}

export default function Simulator() {
  const { address, publicProof, sign } = useCredentials();
  const [payload, setPayload] = useState({ type: "TRANSFER", token: "SIM", from: "", to: "Uabcdef", amount: 1 });
  const [signature, setSignature] = useState("");
  const [valid, setValid] = useState(null);

  const doFill = () => setPayload((p) => ({ ...p, from: address }));
  const doSign = () => setSignature(sign(payload));
  const doVerify = () => {
    const expected = shaLike(JSON.stringify(payload) + publicProof);
    setValid(signature && signature === expected);
  };

  const txs = useMemo(() => [payload], [payload]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card" style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Transaction Signing & Verification</div>
        <div style={{ fontSize: 12, color: "#64748b" }}>Your address: {address} — public proof: {publicProof}</div>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input placeholder="TOKEN" value={payload.token} onChange={(e) => setPayload({ ...payload, token: e.target.value })} style={{ width: 140 }} />
            <input placeholder="FROM" value={payload.from} onChange={(e) => setPayload({ ...payload, from: e.target.value })} style={{ minWidth: 200 }} />
            <input placeholder="TO" value={payload.to} onChange={(e) => setPayload({ ...payload, to: e.target.value })} style={{ minWidth: 200 }} />
            <input type="number" min="0" step="0.000001" placeholder="AMOUNT" value={payload.amount} onChange={(e) => setPayload({ ...payload, amount: Number(e.target.value) })} style={{ width: 160 }} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={doFill}>Use My Address</button>
            <button onClick={doSign}>Sign</button>
            <button onClick={doVerify}>Verify</button>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#93c5fd" }}>payload: {JSON.stringify(payload)}</div>
          <div style={{ fontFamily: "monospace", fontSize: 12 }}>signature: {signature || "<none>"} {valid != null && (valid ? "✅ valid" : "❌ invalid")}</div>
        </div>
      </div>

      <PoWDemo txs={txs} />
    </div>
  );
}
