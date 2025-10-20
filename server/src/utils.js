export function shaLike(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 131 + str.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}

export function applyTx(balancesMap, tx) {
  const { type, token, to, from, amount } = tx;
  const t = token;
  const amt = Number(amount) || 0;
  if (!t || amt <= 0) return balancesMap;
  const ensure = (addr) => {
    if (!balancesMap[addr]) balancesMap[addr] = {};
    if (!balancesMap[addr][t]) balancesMap[addr][t] = 0;
  };
  if (type === "MINT") {
    ensure(to);
    balancesMap[to][t] += amt;
  } else if (type === "TRANSFER") {
    ensure(from);
    ensure(to);
    if (balancesMap[from][t] >= amt) {
      balancesMap[from][t] -= amt;
      balancesMap[to][t] += amt;
    }
  }
  return balancesMap;
}
