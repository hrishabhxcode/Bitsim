import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

export default function Blocks() {
  const [chain, setChain] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const ch = await api.getChain();
        if (ch?.ok) setChain(ch.chain || []);
      } catch {}
    })();
  }, []);

  const rows = useMemo(() => {
    const rr = [...chain].sort((a, b) => (b.index || 0) - (a.index || 0));
    const qq = q.trim().toLowerCase();
    return rr.filter(b => !qq || [b.hash, b.prevHash, b.miner, String(b.index)].filter(Boolean).some(x => String(x).toLowerCase().includes(qq)));
  }, [chain, q]);

  const exportCsv = () => {
    const header = ["index","hash","prevHash","miner","ts","txCount"];
    const data = rows.map(b => [b.index, b.hash, b.prevHash, b.miner||"", b.ts||"", (b.txs||[]).length]);
    const csv = [header, ...data].map(r => r.map(x => JSON.stringify(x ?? "")).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "blocks.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "blocks.json"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-4">
      <div className="card grid gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <input placeholder="Search (hash/index/miner)" value={q} onChange={(e) => setQ(e.target.value)} />
          <button onClick={exportCsv}>Export CSV</button>
          <button onClick={exportJson}>Export JSON</button>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th align="right">Index</th>
                <th align="left">Hash</th>
                <th align="left">Prev Hash</th>
                <th align="left">Miner</th>
                <th align="right">Txs</th>
                <th align="right">Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b._id || b.hash}>
                  <td align="right">{b.index}</td>
                  <td>{b.hash}</td>
                  <td>{b.prevHash}</td>
                  <td>{b.miner || ""}</td>
                  <td align="right">{(b.txs || []).length}</td>
                  <td align="right">{b.ts ? new Date(b.ts).toLocaleString() : ""}</td>
                </tr>
              ))}
              {rows.length === 0 && (<tr><td colSpan={6} style={{ color: "#64748b" }}>No blocks</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
