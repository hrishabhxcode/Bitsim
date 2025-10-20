import React, { useEffect, useMemo, useState } from "react";
import { getBaseUrl } from "../api/client";

export default function Verifications() {
  const [token, setToken] = useState("");
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [valid, setValid] = useState("");

  const b = getBaseUrl();

  async function load(limit = 100) {
    try {
      const res = await fetch(`${b}/api/admin/verifications?limit=${limit}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then(r => r.json());
      if (res?.ok) setRows(res.verifications || []);
    } catch {}
  }

  useEffect(() => { /* lazy load until token provided */ }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter(v =>
      (!valid || String(v.valid) === valid) &&
      (!qq || JSON.stringify(v.tx || {}).toLowerCase().includes(qq) || (v.reason||"").toLowerCase().includes(qq) || (v.admin||"").toLowerCase().includes(qq))
    );
  }, [rows, q, valid]);

  const exportCsv = () => {
    const header = ["valid","reason","admin","createdAt","tx"];
    const data = filtered.map(v => [v.valid, v.reason, v.admin, v.createdAt, JSON.stringify(v.tx)]);
    const csv = [header, ...data].map(r => r.map(x => JSON.stringify(x ?? "")).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "verifications.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "verifications.json"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-4">
      <div className="card grid gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <input placeholder="Admin token (from /admin login)" value={token} onChange={(e) => setToken(e.target.value)} />
          <button onClick={() => load(100)} disabled={!token}>Load</button>
          <input placeholder="Search (tx/admin/reason)" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={valid} onChange={(e) => setValid(e.target.value)} className="px-2 py-2 rounded-md bg-slate-800 text-slate-100 border border-slate-700">
            <option value="">All</option>
            <option value="true">Valid</option>
            <option value="false">Invalid</option>
          </select>
          <button onClick={exportCsv} disabled={filtered.length===0}>Export CSV</button>
          <button onClick={exportJson} disabled={filtered.length===0}>Export JSON</button>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th>Valid</th>
                <th align="left">Reason</th>
                <th align="left">Admin</th>
                <th align="right">Time</th>
                <th align="left">Tx (preview)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v._id}>
                  <td>{String(v.valid)}</td>
                  <td>{v.reason}</td>
                  <td>{v.admin}</td>
                  <td align="right">{v.createdAt ? new Date(v.createdAt).toLocaleString() : ""}</td>
                  <td><code style={{ fontSize: 12 }}>{JSON.stringify(v.tx).slice(0, 120)}{JSON.stringify(v.tx).length>120?"…":""}</code></td>
                </tr>
              ))}
              {filtered.length === 0 && (<tr><td colSpan={5} style={{ color: "#64748b" }}>No verifications yet. Login on /admin to get a token, paste it, then Load.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
