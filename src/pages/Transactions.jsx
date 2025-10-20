import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

export default function Transactions() {
  const [chain, setChain] = useState([]);
  const [mempool, setMempool] = useState([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [ch, mp] = await Promise.all([api.getChain(), api.listMempool()]);
        if (ch?.ok) setChain(ch.chain || []);
        if (mp?.ok) setMempool(mp.txs || []);
      } catch {}
    })();
  }, []);

  const rows = useMemo(() => {
    const out = [];
    for (const b of chain) {
      for (const tx of (b.txs || [])) {
        out.push({ ...tx, status: "MINED", blockIndex: b.index, ts: b.ts });
      }
    }
    for (const tx of mempool) out.push({ ...tx, status: "PENDING" });
    return out.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }, [chain, mempool]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter(r =>
      (!type || r.type === type) &&
      (!token || (r.token || "").toLowerCase() === token.toLowerCase()) &&
      (!qq || [r.from, r.to, r.token, r.type].filter(Boolean).some(x => String(x).toLowerCase().includes(qq)))
    );
  }, [rows, q, type, token]);

  const exportCsv = () => {
    const header = ["status","type","token","from","to","amount","blockIndex","ts"];
    const data = filtered.map(r => [r.status, r.type, r.token, r.from||"", r.to||"", r.amount||0, r.blockIndex??"", r.ts??""]);
    const csv = [header, ...data].map(r => r.map(x => JSON.stringify(x ?? "")).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "transactions.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "transactions.json"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-4">
      <div className="card grid gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <input placeholder="Search (addr/token/type)" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={type} onChange={(e) => setType(e.target.value)} className="px-2 py-2 rounded-md bg-slate-800 text-slate-100 border border-slate-700">
            <option value="">All types</option>
            <option value="MINT">MINT</option>
            <option value="TRANSFER">TRANSFER</option>
          </select>
          <input placeholder="Token" value={token} onChange={(e) => setToken(e.target.value)} />
          <button onClick={exportCsv}>Export CSV</button>
          <button onClick={exportJson}>Export JSON</button>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th align="left">Status</th>
                <th align="left">Type</th>
                <th align="left">Token</th>
                <th align="left">From</th>
                <th align="left">To</th>
                <th align="right">Amount</th>
                <th align="center">Block</th>
                <th align="right">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i}>
                  <td>{r.status}</td>
                  <td>{r.type}</td>
                  <td>{r.token}</td>
                  <td>{r.from || ""}</td>
                  <td>{r.to || ""}</td>
                  <td align="right">{r.amount || 0}</td>
                  <td align="center">{r.blockIndex ?? ""}</td>
                  <td align="right">{r.ts ? new Date(r.ts).toLocaleString() : ""}</td>
                </tr>
              ))}
              {filtered.length === 0 && (<tr><td colSpan={8} style={{ color: "#64748b" }}>No transactions</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
