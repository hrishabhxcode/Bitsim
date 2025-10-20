import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useCredentials } from "./CredentialsContext";
import { useBlockchain } from "./BlockchainContext";
import { api, getUseServer } from "../api/client";

const AuthContext = createContext(null);

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function saveLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function AuthProvider({ children }) {
  const { address, publicProof, sign } = useCredentials();
  const { users, registerUser, requestChallenge, verifyLogin } = useBlockchain();
  const [session, setSession] = useState(() => loadLS("auth_session", null));

  useEffect(() => saveLS("auth_session", session), [session]);

  const register = (username) => {
    if (getUseServer()) {
      return api.register({ address, username, publicProof }).then((res) => {
        if (res.ok) setSession({ address, username });
        return res;
      }).catch((e) => ({ ok: false, msg: e.message }));
    } else {
      const res = registerUser(address, username, publicProof);
      if (res.ok) setSession({ address, username });
      return res;
    }
  };

  const login = async () => {
    if (getUseServer()) {
      try {
        const rq = await api.challenge({ address });
        if (!rq.ok) return rq;
        const sig = sign(JSON.stringify(rq.challenge));
        const vr = await api.verify({ address, signature: sig });
        if (vr.ok) setSession(vr.user);
        return vr;
      } catch (e) {
        return { ok: false, msg: e.message };
      }
    } else {
      const rq = requestChallenge(address);
      if (!rq.ok) return rq;
      const sig = sign(JSON.stringify(rq.challenge));
      const vr = verifyLogin(address, sig);
      if (vr.ok) setSession(vr.user);
      return vr;
    }
  };

  const logout = () => setSession(null);

  const value = useMemo(() => ({ session, register, login, logout, users }), [session, users]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
