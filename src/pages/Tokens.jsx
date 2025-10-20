import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

export default function Tokens() {
  const [tokens, setTokens] = useState([]);
  const [chain, setChain] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [tks, ch] = await Promise.all([api.listTokens(), api.getChain()]);
        if (tks?.ok) setTokens(tks.tokens || []);
        if (ch?.ok) setChain(ch.chain || []);
      } catch {}
    })();
  }, []);

  const computed = useMemo(() => {
    // compute total supply and holders per token from chain
    const holders = {}; // token -> address -> amount
    for (const b of chain) {
      for (const tx of (b.txs || [])) {
        const t = tx.token; const amt = Number(tx.amount) || 0;
        if (!holders[t]) holders[t] = {};
        if (tx.type === "MINT") {
          holders[t][tx.to] = (holders[t][tx.to] || 0) + amt;
        } else if (tx.type === "TRANSFER") {
          holders[t][tx.from] = (holders[t][tx.from] || 0) - amt;
          holders[t][tx.to] = (holders[t][tx.to] || 0) + amt;
        }
      }
      if (b.miner) {
        const t = "POW"; holders[t] = holders[t] || {}; holders[t][b.miner] = (holders[t][b.miner] || 0) + 1;
      }
    }
    const byToken = {};
    for (const tok of tokens) {
      const h = holders[tok.symbol] || {};
      const holderList = Object.entries(h).filter(([, v]) => (v || 0) > 0);
      const total = holderList.reduce((acc, [, v]) => acc + v, 0);
      byToken[tok.symbol] = { totalSupply: total, holders: holderList.length };
    }
    return byToken;
  }, [tokens, chain]);

  const view = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return tokens.filter(t => !qq || t.symbol.toLowerCase().includes(qq) || (t.owner||"").toLowerCase().includes(qq));
  }, [tokens, q]);

  const exportCsv = () => {
    const rows = [["symbol","name","decimals","owner","holders","totalSupply"], ...view.map(t => [t.symbol, t.name, t.decimals, t.owner, computed[t.symbol]?.holders||0, computed[t.symbol]?.totalSupply||0])];
    const csv = rows.map(r => r.map(x => JSON.stringify(x ?? "")).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "tokens.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const exportJson = () => {
    const data = view.map(t => ({...t, stats: computed[t.symbol]}));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "tokens.json"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-4">
      <div className="card grid gap-3">
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input placeholder="Search symbol / owner" value={q} onChange={(e) => setQ(e.target.value)} />
          <button onClick={exportCsv}>Export CSV</button>
          <button onClick={exportJson}>Export JSON</button>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr><th align="left">Symbol</th><th align="left">Name</th><th>Decimals</th><th align="left">Owner</th><th>Holders</th><th>Total Supply</th></tr>
            </thead>
            <tbody>
              {view.map((t) => (
                <tr key={t.symbol}>
                  <td>{t.symbol}</td>
                  <td>{t.name}</td>
                  <td align="center">{t.decimals}</td>
                  <td>{t.owner}</td>
                  <td align="center">{computed[t.symbol]?.holders || 0}</td>
                  <td align="right">{computed[t.symbol]?.totalSupply || 0}</td>
                </tr>
              ))}
              {view.length === 0 && (<tr><td colSpan={6} style={{ color: "#64748b" }}>No tokens</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
