import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CredentialsContext = createContext(null);

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

function randomHex(len = 32) {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

function shaLike(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 131 + str.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}

export function CredentialsProvider({ children }) {
  const [address, setAddress] = useState(() => loadLS("cred_addr", "U" + randomHex(16)));
  const [secret, setSecret] = useState(() => loadLS("cred_sec", randomHex(32)));
  const [publicProof, setPublicProof] = useState(() => {
    const sec = loadLS("cred_sec", null) ?? randomHex(32);
    const proof = shaLike(String(sec));
    // persist secret and proof immediately if missing
    if (!loadLS("cred_sec", null)) {
      try { localStorage.setItem("cred_sec", JSON.stringify(sec)); } catch {}
    }
    try { localStorage.setItem("cred_pub", JSON.stringify(proof)); } catch {}
    return loadLS("cred_pub", proof);
  });

  useEffect(() => saveLS("cred_addr", address), [address]);
  useEffect(() => saveLS("cred_sec", secret), [secret]);
  useEffect(() => saveLS("cred_pub", publicProof), [publicProof]);

  useEffect(() => {
    // Keep proof in sync if secret changes
    const next = shaLike(String(secret));
    setPublicProof(next);
  }, [secret]);

  const regenerate = () => {
    setAddress("U" + randomHex(16));
    setSecret(randomHex(32));
  };

  const sign = (message) => {
    const payload = typeof message === "string" ? message : JSON.stringify(message);
    // Make signature verifiable with publicProof (no need to know secret)
    const sig = shaLike(payload + publicProof);
    return sig;
  };

  const value = useMemo(() => ({ address, secret, publicProof, regenerate, sign }), [address, secret, publicProof]);
  return (
    <CredentialsContext.Provider value={value}>{children}</CredentialsContext.Provider>
  );
}

export function useCredentials() {
  const ctx = useContext(CredentialsContext);
  if (!ctx) throw new Error("useCredentials must be used within CredentialsProvider");
  return ctx;
}
