import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useCredentials } from "./CredentialsContext";
import { api, getUseServer } from "../api/client";

const BlockchainContext = createContext(null);

function loadLS(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function saveLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function shaLike(str) {
  // very naive hash placeholder
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function applyTx(balances, tx) {
  const { type, token, to, from, amount } = tx;
  const t = token;
  const amt = Number(amount) || 0;
  if (!t || amt <= 0) return balances;
  const copy = { ...balances };
  const ensure = (addr) => {
    if (!copy[addr]) copy[addr] = {};
    if (!copy[addr][t]) copy[addr][t] = 0;
  };
  if (type === "MINT") {
    ensure(to);
    copy[to][t] += amt;
  } else if (type === "TRANSFER") {
    ensure(from);
    ensure(to);
    if (copy[from][t] >= amt) {
      copy[from][t] -= amt;
      copy[to][t] += amt;
    }
  }
  return copy;
}

export function BlockchainProvider({ children }) {
  const { address, sign } = useCredentials();
  const [tokens, setTokens] = useState(() => loadLS("bc_tokens", []));
  const [mempool, setMempool] = useState(() => loadLS("bc_mempool", []));
  const [balances, setBalances] = useState(() => loadLS("bc_balances", {}));
  const [chain, setChain] = useState(() => loadLS("bc_chain", [
    { index: 0, prevHash: "0".repeat(8), nonce: 0, ts: Date.now(), txs: [], hash: "genesis" }
  ]));
  const [minerAddress, setMinerAddress] = useState(() => loadLS("bc_miner", address));
  const [feeFlat, setFeeFlat] = useState(() => loadLS("bc_feeFlat", 0.0001));
  const [rewardPow, setRewardPow] = useState(() => loadLS("bc_rewardPow", 1));
  const [users, setUsers] = useState(() => loadLS("bc_users", {})); // { address: { username, publicProof } }
  const [challenges, setChallenges] = useState(() => loadLS("bc_challenges", {})); // { address: nonce }

  useEffect(() => saveLS("bc_tokens", tokens), [tokens]);
  useEffect(() => saveLS("bc_mempool", mempool), [mempool]);
  useEffect(() => saveLS("bc_balances", balances), [balances]);
  useEffect(() => saveLS("bc_chain", chain), [chain]);
  useEffect(() => saveLS("bc_miner", minerAddress), [minerAddress]);
  useEffect(() => saveLS("bc_feeFlat", feeFlat), [feeFlat]);
  useEffect(() => saveLS("bc_rewardPow", rewardPow), [rewardPow]);
  useEffect(() => saveLS("bc_users", users), [users]);
  useEffect(() => saveLS("bc_challenges", challenges), [challenges]);

  // Server sync (optional): when server mode is on, pull state from backend
  useEffect(() => {
    let cancelled = false;
    async function syncFromServer() {
      if (!getUseServer()) return;
      try {
        const [tks, mp, ch] = await Promise.all([
          api.listTokens(),
          api.listMempool(),
          api.getChain(),
        ]);
        if (cancelled) return;
        if (tks?.ok) setTokens(tks.tokens || []);
        if (mp?.ok) setMempool(mp.txs || []);
        if (ch?.ok) {
          setChain(ch.chain || []);
          // recompute balances based on chain as a view
          const next = {};
          for (const b of (ch.chain || [])) {
            for (const tx of (b.txs || [])) {
              const t = tx.token;
              const amt = Number(tx.amount) || 0;
              const ensure = (addr) => { if (!next[addr]) next[addr] = {}; if (!next[addr][t]) next[addr][t] = 0; };
              if (tx.type === "MINT") {
                ensure(tx.to); next[tx.to][t] += amt;
              } else if (tx.type === "TRANSFER") {
                ensure(tx.from); ensure(tx.to);
                if (next[tx.from][t] >= amt) { next[tx.from][t] -= amt; next[tx.to][t] += amt; }
              }
            }
            // POW reward (server uses 1 POW per block)
            if (b.miner) {
              if (!next[b.miner]) next[b.miner] = {};
              if (!next[b.miner]["POW"]) next[b.miner]["POW"] = 0;
              next[b.miner]["POW"] += 1;
            }
          }
          setBalances(next);
        }
      } catch (e) {
        // ignore fetch errors; remain in local state
      }
    }
    syncFromServer();
    return () => { cancelled = true; };
  }, [minerAddress]);

  // User registration and challenge-based auth (demo)
  const registerUser = (addr, username, publicProof) => {
    const a = (addr || "").trim();
    const u = (username || "").trim();
    const p = (publicProof || "").trim();
    if (!a || !u || !p) return { ok: false, msg: "Missing fields" };
    if (users[a]) return { ok: false, msg: "User exists" };
    setUsers((map) => ({ ...map, [a]: { username: u, publicProof: p } }));
    return { ok: true };
  };
  const requestChallenge = (addr) => {
    const a = (addr || "").trim();
    if (!a || !users[a]) return { ok: false, msg: "Unknown user" };
    const nonce = Math.random().toString(36).slice(2);
    setChallenges((m) => ({ ...m, [a]: nonce }));
    return { ok: true, challenge: nonce };
  };
  const verifyLogin = (addr, signature) => {
    const a = (addr || "").trim();
    const user = users[a];
    const chal = challenges[a];
    if (!user || !chal) return { ok: false, msg: "No challenge" };
    // Verify by recomputing expected signature from publicProof
    const expected = shaLike(JSON.stringify(chal) + user.publicProof);
    const ok = signature === expected;
    if (ok) setChallenges((m) => ({ ...m, [a]: null }));
    return ok ? { ok: true, user: { address: a, username: user.username } } : { ok: false, msg: "Bad signature" };
  };

  const createToken = (symbol, name = "User Token", decimals = 6) => {
    const s = symbol?.trim().toUpperCase();
    if (!s) return { ok: false, msg: "Symbol required" };
    if (tokens.some((t) => t.symbol === s)) return { ok: false, msg: "Token exists" };
    if (getUseServer()) {
      return api.createToken({ symbol: s, name: name?.trim() || "User Token", decimals: Number(decimals) || 6, owner: address })
        .then(async (res) => {
          try { const tks = await api.listTokens(); if (tks?.ok) setTokens(tks.tokens || []); } catch {}
          return res.ok ? { ok: true, token: res.token } : { ok: false, msg: res.msg };
        })
        .catch((e) => ({ ok: false, msg: e.message }));
    } else {
      const tok = { symbol: s, name: name?.trim() || "User Token", decimals: Number(decimals) || 6, owner: address };
      setTokens((arr) => [tok, ...arr]);
      return { ok: true, token: tok };
    }
  };

  const enqueueMint = (token, to, amount) => {
    const amt = Number(amount);
    if (!token || !to || !isFinite(amt) || amt <= 0) return { ok: false, msg: "Invalid tx" };
    const tmeta = tokens.find((t) => t.symbol === token);
    const payload = { type: "MINT", token, to, amount: amt };
    const sig = tmeta && tmeta.owner === address ? sign(payload) : null;
    if (getUseServer()) {
      return api.enqueueTx({ ...payload, owner: tmeta?.owner, sig }).then(async (res) => {
        try { const mp = await api.listMempool(); if (mp?.ok) setMempool(mp.txs || []); } catch {}
        return res.ok ? { ok: true } : { ok: false, msg: res.msg };
      }).catch((e) => ({ ok: false, msg: e.message }));
    } else {
      setMempool((m) => [{ ...payload, owner: tmeta?.owner, sig, ts: Date.now() }, ...m]);
      return { ok: true };
    }
  };

  const enqueueTransfer = (token, from, to, amount) => {
    const amt = Number(amount);
    if (!token || !from || !to || !isFinite(amt) || amt <= 0) return { ok: false, msg: "Invalid tx" };
    const payload = { type: "TRANSFER", token, from, to, amount: amt };
    const sig = from === address ? sign(payload) : null;
    if (getUseServer()) {
      return api.enqueueTx({ ...payload, sig }).then(async (res) => {
        try { const mp = await api.listMempool(); if (mp?.ok) setMempool(mp.txs || []); } catch {}
        return res.ok ? { ok: true } : { ok: false, msg: res.msg };
      }).catch((e) => ({ ok: false, msg: e.message }));
    } else {
      setMempool((m) => [{ ...payload, sig, ts: Date.now() }, ...m]);
      return { ok: true };
    }
  };

  const mineBlock = () => {
    if (getUseServer()) {
      return api.mine({ minerAddress }).then(async (res) => {
        try {
          const [mp, ch] = await Promise.all([api.listMempool(), api.getChain()]);
          if (mp?.ok) setMempool(mp.txs || []);
          if (ch?.ok) {
            setChain(ch.chain || []);
            const next = {};
            for (const b of (ch.chain || [])) {
              for (const tx of (b.txs || [])) {
                const t = tx.token; const amt = Number(tx.amount) || 0;
                const ensure = (addr) => { if (!next[addr]) next[addr] = {}; if (!next[addr][t]) next[addr][t] = 0; };
                if (tx.type === "MINT") { ensure(tx.to); next[tx.to][t] += amt; }
                else if (tx.type === "TRANSFER") { ensure(tx.from); ensure(tx.to); if (next[tx.from][t] >= amt) { next[tx.from][t] -= amt; next[tx.to][t] += amt; } }
              }
              if (b.miner) { if (!next[b.miner]) next[b.miner] = {}; if (!next[b.miner]["POW"]) next[b.miner]["POW"] = 0; next[b.miner]["POW"] += 1; }
            }
            setBalances(next);
          }
        } catch {}
        return res.ok ? { ok: true, block: res.block } : { ok: false, msg: res.msg };
      }).catch((e) => ({ ok: false, msg: e.message }));
    }
    if (mempool.length === 0) return { ok: false, msg: "No transactions" };
    const prev = chain[chain.length - 1];
    const candidate = mempool.slice(0, 10).reverse();
    // Validate signatures (basic): if tx.from === our address, require correct sig; if MINT and token owner is our address, require correct sig
    const valid = candidate.filter((tx) => {
      if (tx.type === "TRANSFER") {
        const payload = { type: tx.type, token: tx.token, from: tx.from, to: tx.to, amount: tx.amount };
        if (tx.from === address) {
          return tx.sig && tx.sig.length > 0; // we signed when enqueuing; accept
        }
        return !!tx.sig; // accept signed by others (cannot verify here)
      } else if (tx.type === "MINT") {
        const payload = { type: tx.type, token: tx.token, to: tx.to, amount: tx.amount };
        if (tx.owner === address) return !!tx.sig;
        return true; // allow mints from others for demo
      }
      return false;
    });
    const ts = Date.now();
    let nonce = 0;
    let hash = "";
    const headerBase = JSON.stringify({ idx: prev.index + 1, prevHash: prev.hash, ts, txs: valid });
    // simple proof of work: find hash starting with '000'
    do {
      nonce++;
      hash = shaLike(headerBase + nonce);
    } while (!hash.startsWith("000"));

    const block = { index: prev.index + 1, prevHash: prev.hash, ts, nonce, txs: valid, hash, miner: minerAddress };
    // Apply state changes
    let nextBalances = { ...balances };
    for (const tx of valid) {
      nextBalances = applyTx(nextBalances, tx);
      if (tx.type === "TRANSFER" && feeFlat > 0) {
        const t = tx.token;
        if (!nextBalances[tx.from]) nextBalances[tx.from] = {};
        if (!nextBalances[tx.from][t]) nextBalances[tx.from][t] = 0;
        if (!nextBalances[minerAddress]) nextBalances[minerAddress] = {};
        if (!nextBalances[minerAddress][t]) nextBalances[minerAddress][t] = 0;
        if (nextBalances[tx.from][t] >= feeFlat) {
          nextBalances[tx.from][t] -= feeFlat;
          nextBalances[minerAddress][t] += feeFlat;
        }
      }
    }
    // block reward in POW token
    if (!nextBalances[minerAddress]) nextBalances[minerAddress] = {};
    if (!nextBalances[minerAddress]["POW"]) nextBalances[minerAddress]["POW"] = 0;
    nextBalances[minerAddress]["POW"] += rewardPow;
    setBalances(nextBalances);
    setChain((c) => [...c, block]);
    setMempool((m) => m.slice(candidate.length));
    return { ok: true, block };
  };

  // Export/Import/Reset helpers
  const exportState = () => JSON.stringify({ tokens, mempool, balances, chain, minerAddress, feeFlat, rewardPow, users });
  const importState = (json) => {
    try {
      const obj = typeof json === "string" ? JSON.parse(json) : json;
      setTokens(obj.tokens || []);
      setMempool(obj.mempool || []);
      setBalances(obj.balances || {});
      setChain(obj.chain || []);
      setMinerAddress(obj.minerAddress || address);
      setFeeFlat(obj.feeFlat ?? 0.0001);
      setRewardPow(obj.rewardPow ?? 1);
      setUsers(obj.users || {});
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: "Invalid import" };
    }
  };
  const resetState = () => {
    setTokens([]);
    setMempool([]);
    setBalances({});
    setChain([{ index: 0, prevHash: "0".repeat(8), nonce: 0, ts: Date.now(), txs: [], hash: "genesis" }]);
    setMinerAddress(address);
    setFeeFlat(0.0001);
    setRewardPow(1);
    setUsers({});
    setChallenges({});
  };

  const value = useMemo(
    () => ({ tokens, mempool, balances, chain, createToken, enqueueMint, enqueueTransfer, mineBlock, address, minerAddress, setMinerAddress, feeFlat, setFeeFlat, rewardPow, setRewardPow, exportState, importState, resetState, users, registerUser, requestChallenge, verifyLogin }),
    [tokens, mempool, balances, chain, address, minerAddress, feeFlat, rewardPow, users]
  );

  return <BlockchainContext.Provider value={value}>{children}</BlockchainContext.Provider>;
}

export function useBlockchain() {
  const ctx = useContext(BlockchainContext);
  if (!ctx) throw new Error("useBlockchain must be used within BlockchainProvider");
  return ctx;
}
