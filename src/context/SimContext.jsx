import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const SimContext = createContext(null);

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

export function SimProvider({ children }) {
  const [price, setPrice] = useState(() => loadLS("sim_price", 50000));
  const [usd, setUsd] = useState(() => loadLS("sim_usd", 10000));
  const [btc, setBtc] = useState(() => loadLS("sim_btc", 0));
  const [history, setHistory] = useState(() => loadLS("sim_history", []));
  const [prices, setPrices] = useState(() => loadLS("sim_prices", [50000]));
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setPrice((p) => {
        const drift = (Math.random() - 0.5) * 0.01; // +/-1%
        const next = Math.max(1000, Math.round(p * (1 + drift)));
        setPrices((arr) => {
          const nextArr = [...arr, next].slice(-120);
          saveLS("sim_prices", nextArr);
          return nextArr;
        });
        saveLS("sim_price", next);
        return next;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => saveLS("sim_usd", usd), [usd]);
  useEffect(() => saveLS("sim_btc", btc), [btc]);
  useEffect(() => saveLS("sim_history", history), [history]);

  const creditUsd = (amount) => {
    const amt = Number(amount);
    if (!isFinite(amt) || amt <= 0) return { ok: false, msg: "Invalid amount" };
    setUsd((u) => Math.round((u + amt) * 100) / 100);
    return { ok: true };
  };

  const debitUsd = (amount) => {
    const amt = Number(amount);
    if (!isFinite(amt) || amt <= 0) return { ok: false, msg: "Invalid amount" };
    if (amt > usd) return { ok: false, msg: "Insufficient USD" };
    setUsd((u) => Math.round((u - amt) * 100) / 100);
    return { ok: true };
  };

  const buy = (usdAmount) => {
    const amt = Number(usdAmount);
    if (!isFinite(amt) || amt <= 0) return { ok: false, msg: "Invalid amount" };
    if (amt > usd) return { ok: false, msg: "Insufficient USD" };
    const btcBought = amt / price;
    setUsd((u) => Math.round((u - amt) * 100) / 100);
    setBtc((b) => b + btcBought);
    const entry = { type: "BUY", usd: amt, btc: btcBought, price, ts: Date.now() };
    setHistory((h) => [entry, ...h].slice(0, 200));
    return { ok: true };
  };

  const sell = (btcAmount) => {
    const amt = Number(btcAmount);
    if (!isFinite(amt) || amt <= 0) return { ok: false, msg: "Invalid amount" };
    if (amt > btc) return { ok: false, msg: "Insufficient BTC" };
    const usdGained = amt * price;
    setBtc((b) => b - amt);
    setUsd((u) => Math.round((u + usdGained) * 100) / 100);
    const entry = { type: "SELL", usd: usdGained, btc: amt, price, ts: Date.now() };
    setHistory((h) => [entry, ...h].slice(0, 200));
    return { ok: true };
  };

  // Export/Import/Reset helpers
  const exportState = () => JSON.stringify({ price, usd, btc, history, prices });
  const importState = (json) => {
    try {
      const obj = typeof json === "string" ? JSON.parse(json) : json;
      if (typeof obj.price === "number") setPrice(obj.price);
      if (typeof obj.usd === "number") setUsd(obj.usd);
      if (typeof obj.btc === "number") setBtc(obj.btc);
      if (Array.isArray(obj.history)) setHistory(obj.history);
      if (Array.isArray(obj.prices)) setPrices(obj.prices);
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: "Invalid import" };
    }
  };
  const resetState = () => {
    setPrice(50000);
    setUsd(10000);
    setBtc(0);
    setHistory([]);
    setPrices([50000]);
  };

  const value = useMemo(
    () => ({ price, usd, btc, history, prices, buy, sell, creditUsd, debitUsd, exportState, importState, resetState }),
    [price, usd, btc, history, prices]
  );

  return <SimContext.Provider value={value}>{children}</SimContext.Provider>;
}

export function useSim() {
  const ctx = useContext(SimContext);
  if (!ctx) throw new Error("useSim must be used within SimProvider");
  return ctx;
}
