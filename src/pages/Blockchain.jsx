import React, { useState } from "react";
import { useBlockchain } from "../context/BlockchainContext";
import { useCredentials } from "../context/CredentialsContext";
import BlockGraph from "../components/BlockGraph";

function BalancesTable({ balances }) {
  const addresses = Object.keys(balances);
  if (addresses.length === 0) return <div style={{ color: "#64748b" }}>No balances yet.</div>;
  const tokens = Array.from(new Set(addresses.flatMap((a) => Object.keys(balances[a] || {}))));
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 6, borderBottom: "1px solid #e5e7eb" }}>Address</th>
            {tokens.map((t) => (
              <th key={t} style={{ textAlign: "right", padding: 6, borderBottom: "1px solid #e5e7eb" }}>{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {addresses.map((a) => (
            <tr key={a}>
              <td style={{ padding: 6, borderBottom: "1px solid #f1f5f9", wordBreak: "break-all" }}>{a}</td>
              {tokens.map((t) => (
                <td key={t} style={{ padding: 6, borderBottom: "1px solid #f1f5f9", textAlign: "right" }}>{(balances[a]?.[t] || 0).toFixed(6)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Blockchain() {
  const { address } = useCredentials();
  const { tokens, mempool, balances, chain, createToken, enqueueMint, enqueueTransfer, mineBlock } = useBlockchain();

  const [tokSymbol, setTokSymbol] = useState("");
  const [tokName, setTokName] = useState("");
  const [decimals, setDecimals] = useState(6);
  const [mintToken, setMintToken] = useState("");
  const [mintTo, setMintTo] = useState("");
  const [mintAmt, setMintAmt] = useState(0);
  const [trToken, setTrToken] = useState("");
  const [trTo, setTrTo] = useState("");
  const [trAmt, setTrAmt] = useState(0);
  const [msg, setMsg] = useState("");

  const doCreate = () => {
    const res = createToken(tokSymbol, tokName, decimals);
    setMsg(res.ok ? "Token created" : res.msg);
    if (res.ok) { setTokSymbol(""); setTokName(""); setDecimals(6); }
  };
  const doMint = () => {
    const res = enqueueMint(mintToken, mintTo || address, mintAmt);
    setMsg(res.ok ? "Mint enqueued" : res.msg);
  };
  const doTransfer = () => {
    const res = enqueueTransfer(trToken, address, trTo, trAmt);
    setMsg(res.ok ? "Transfer enqueued" : res.msg);
  };
  const doMine = () => {
    const res = mineBlock();
    setMsg(res.ok ? `Mined block #${res.block?.index}` : res.msg);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <BlockGraph chain={chain} />
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Your Address</div>
        <div style={{ wordBreak: "break-all" }}>{address}</div>
      </div>

      <div className="card" style={{ display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 600 }}>Create Token</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="SYMBOL" value={tokSymbol} onChange={(e) => setTokSymbol(e.target.value)} style={{ padding: 8, width: 140 }} />
          <input placeholder="Name" value={tokName} onChange={(e) => setTokName(e.target.value)} style={{ padding: 8, flex: 1, minWidth: 180 }} />
          <input type="number" min="0" step="1" placeholder="Decimals" value={decimals} onChange={(e) => setDecimals(e.target.value)} style={{ padding: 8, width: 120 }} />
          <button onClick={doCreate} style={{ padding: "8px 12px" }}>Create</button>
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>Owner is your current address; demo-only ledger.</div>
      </div>

      <div className="card" style={{ display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 600 }}>Enqueue Transactions</div>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ width: 80 }}>Mint</div>
            <input placeholder="TOKEN" value={mintToken} onChange={(e) => setMintToken(e.target.value)} style={{ padding: 8, width: 120 }} />
            <input placeholder="To Address" value={mintTo} onChange={(e) => setMintTo(e.target.value)} style={{ padding: 8, flex: 1, minWidth: 200 }} />
            <input type="number" min="0" step="0.000001" placeholder="Amount" value={mintAmt} onChange={(e) => setMintAmt(e.target.value)} style={{ padding: 8, width: 160 }} />
            <button onClick={doMint} style={{ padding: "8px 12px" }}>Enqueue</button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ width: 80 }}>Transfer</div>
            <input placeholder="TOKEN" value={trToken} onChange={(e) => setTrToken(e.target.value)} style={{ padding: 8, width: 120 }} />
            <div>From: {address}</div>
            <input placeholder="To Address" value={trTo} onChange={(e) => setTrTo(e.target.value)} style={{ padding: 8, flex: 1, minWidth: 200 }} />
            <input type="number" min="0" step="0.000001" placeholder="Amount" value={trAmt} onChange={(e) => setTrAmt(e.target.value)} style={{ padding: 8, width: 160 }} />
            <button onClick={doTransfer} style={{ padding: "8px 12px" }}>Enqueue</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 600 }}>Mempool ({mempool.length})</div>
          <button onClick={doMine} style={{ padding: "8px 12px" }}>Mine Block</button>
        </div>
        {mempool.length === 0 && <div style={{ color: "#64748b" }}>No transactions in mempool.</div>}
        {mempool.slice(0, 10).map((tx, i) => (
          <div key={i} style={{ fontFamily: "monospace", fontSize: 12, padding: "4px 0", borderTop: "1px solid #1f2937" }}>
            {tx.type} {tx.token} {tx.from ? `from ${tx.from} ` : ""}to {tx.to} amount {tx.amount}
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Balances</div>
        <BalancesTable balances={balances} />
      </div>

      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Chain ({chain.length} blocks)</div>
        <div style={{ display: "grid", gap: 6 }}>
          {chain.map((b) => (
            <div key={b.index} style={{ border: "1px solid #1f2937", borderRadius: 8, padding: 8, background: "#111827" }}>
              <div><strong>#</strong>{b.index} <strong>hash</strong> {b.hash} <strong>prev</strong> {b.prevHash}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>txs: {b.txs.length} | nonce: {b.nonce} | {new Date(b.ts).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {msg && <div style={{ color: "#0ea5e9" }}>{msg}</div>}
    </div>
  );
}
