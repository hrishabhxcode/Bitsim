import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSim } from "./SimContext";

const CustomCoinsContext = createContext(null);

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

export function CustomCoinsProvider({ children }) {
  const { debitUsd, creditUsd } = useSim();
  const [coins, setCoins] = useState(() => loadLS("cc_coins", []));
  const [miners, setMiners] = useState(() => loadLS("cc_miners", {})); // { [coinId]: running:boolean }
  const timerRef = useRef(null);

  useEffect(() => saveLS("cc_coins", coins), [coins]);
  useEffect(() => saveLS("cc_miners", miners), [miners]);

  // Price simulation for custom coins
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCoins((list) =>
        list.map((c) => {
          const drift = (Math.random() - 0.5) * 0.02; // +/-2%
          const nextP = Math.max(0.01, Number((c.price * (1 + drift)).toFixed(4)));
          const nextSeries = [...(c.prices || [c.price]), nextP].slice(-120);
          return { ...c, price: nextP, prices: nextSeries };
        })
      );
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Mining tick
  useEffect(() => {
    const miningTimer = setInterval(() => {
      setCoins((list) =>
        list.map((c) => {
          if (!miners[c.id]) return c;
          const rate = c.mineRate || 0.0001; // coins per second
          const newHold = (c.userHoldings || 0) + rate;
          return { ...c, userHoldings: newHold };
        })
      );
    }, 1000);
    return () => clearInterval(miningTimer);
  }, [miners]);

  const createCoin = (name, symbol, initialPrice = 1, mineRate = 0.0001) => {
    const n = name?.trim();
    const s = symbol?.trim().toUpperCase();
    if (!n || !s) return { ok: false, msg: "Name and symbol required" };
    const exists = coins.some((c) => c.symbol === s);
    if (exists) return { ok: false, msg: "Symbol already exists" };
    const id = `${s}-${Date.now()}`;
    const coin = {
      id,
      name: n,
      symbol: s,
      price: Number(initialPrice) || 1,
      prices: [Number(initialPrice) || 1],
      supply: 0,
      userHoldings: 0,
      mineRate: Number(mineRate) || 0.0001,
    };
    setCoins((list) => [coin, ...list]);
    return { ok: true, coin };
  };

  const investUsd = (coinId, usdAmount) => {
    const amt = Number(usdAmount);
    if (!isFinite(amt) || amt <= 0) return { ok: false, msg: "Invalid amount" };
    const idx = coins.findIndex((c) => c.id === coinId);
    if (idx === -1) return { ok: false, msg: "Coin not found" };
    const res = debitUsd(amt);
    if (!res.ok) return res;
    const coin = coins[idx];
    const units = amt / coin.price;
    const updated = { ...coin, userHoldings: (coin.userHoldings || 0) + units };
    setCoins((list) => list.map((c) => (c.id === coinId ? updated : c)));
    return { ok: true };
  };

  const sellUnits = (coinId, units) => {
    const u = Number(units);
    if (!isFinite(u) || u <= 0) return { ok: false, msg: "Invalid amount" };
    const coin = coins.find((c) => c.id === coinId);
    if (!coin) return { ok: false, msg: "Coin not found" };
    if ((coin.userHoldings || 0) < u) return { ok: false, msg: "Insufficient units" };
    const proceeds = u * coin.price;
    creditUsd(proceeds);
    setCoins((list) =>
      list.map((c) => (c.id === coinId ? { ...c, userHoldings: c.userHoldings - u } : c))
    );
    return { ok: true };
  };

  const startMining = (coinId) => {
    setMiners((m) => ({ ...m, [coinId]: true }));
  };
  const stopMining = (coinId) => {
    setMiners((m) => ({ ...m, [coinId]: false }));
  };

  // Export/Import/Reset helpers
  const exportState = () => JSON.stringify({ coins, miners });
  const importState = (json) => {
    try {
      const obj = typeof json === "string" ? JSON.parse(json) : json;
      setCoins(Array.isArray(obj.coins) ? obj.coins : []);
      setMiners(obj.miners || {});
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: "Invalid import" };
    }
  };
  const resetState = () => {
    setCoins([]);
    setMiners({});
  };

  const value = useMemo(
    () => ({ coins, createCoin, investUsd, sellUnits, miners, startMining, stopMining, exportState, importState, resetState }),
    [coins, miners]
  );

  return <CustomCoinsContext.Provider value={value}>{children}</CustomCoinsContext.Provider>;
}

export function useCustomCoins() {
  const ctx = useContext(CustomCoinsContext);
  if (!ctx) throw new Error("useCustomCoins must be used within CustomCoinsProvider");
  return ctx;
}
