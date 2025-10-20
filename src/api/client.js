const LS_USE = "api_use_server";
const LS_BASE = "api_base_url";

export function getBaseUrl() {
  try {
    const saved = localStorage.getItem(LS_BASE);
    if (saved) return saved;
    const isLocal = typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)/.test(window.location.hostname);
    return isLocal ? "http://localhost:4000" : "/api";
  } catch {
    return "/api";
  }
}
export function setBaseUrl(url) {
  try { localStorage.setItem(LS_BASE, url); } catch {}
}
export function getUseServer() {
  try { return (localStorage.getItem(LS_USE) || "false") === "true"; } catch { return false; }
}
export function setUseServer(v) {
  try { localStorage.setItem(LS_USE, v ? "true" : "false"); } catch {}
}

async function req(path, opts = {}) {
  const base = getBaseUrl();
  const res = await fetch(base + path, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.msg || "Request failed"), { status: res.status, data });
  return data;
}

export const api = {
  health: () => req("/api/health"),
  // users
  register: (payload) => req("/api/users/register", { method: "POST", body: JSON.stringify(payload) }),
  challenge: (payload) => req("/api/users/challenge", { method: "POST", body: JSON.stringify(payload) }),
  verify: (payload) => req("/api/users/verify", { method: "POST", body: JSON.stringify(payload) }),
  // tokens
  listTokens: () => req("/api/tokens"),
  createToken: (payload) => req("/api/tokens", { method: "POST", body: JSON.stringify(payload) }),
  // mempool
  listMempool: () => req("/api/mempool"),
  enqueueTx: (payload) => req("/api/mempool", { method: "POST", body: JSON.stringify(payload) }),
  // chain
  getChain: () => req("/api/chain"),
  mine: (payload) => req("/api/mine", { method: "POST", body: JSON.stringify(payload) }),
};
