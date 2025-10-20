import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import { User, Token, Block, Balance, MempoolTx, Verification, AdminChild, Miner } from './models.js';
import { shaLike, applyTx } from './utils.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'bitsim-server' });
});

// --- Admin: child access management ---
// List children
app.get('/api/admin/children', requireAdmin, async (_req, res) => {
  const rows = await AdminChild.find().sort({ createdAt: -1 }).limit(500);
  res.json({ ok: true, children: rows });
});
// Add/update child (stores only secret hash)
app.post('/api/admin/children', requireAdmin, async (req, res) => {
  const { address, label, secret } = req.body || {};
  if (!address || !secret) return res.status(400).json({ ok: false, msg: 'address and secret required' });
  const secretHash = shaLike(String(secret));
  const up = await AdminChild.findOneAndUpdate(
    { address },
    { $set: { address, label: label || '', secretHash, enabled: true } },
    { upsert: true, new: true }
  );
  res.json({ ok: true, child: up });
});
// Toggle enable/disable
app.post('/api/admin/children/:address/toggle', requireAdmin, async (req, res) => {
  const { enabled } = req.body || {};
  const { address } = req.params;
  const row = await AdminChild.findOneAndUpdate({ address }, { $set: { enabled: !!enabled } }, { new: true });
  if (!row) return res.status(404).json({ ok: false, msg: 'Not found' });
  res.json({ ok: true, child: row });
});
// Sign a payload using child's secret (provided) if matches stored hash and child is enabled
app.post('/api/admin/children/:address/sign', requireAdmin, async (req, res) => {
  const { address } = req.params;
  const { secret, payload } = req.body || {};
  if (!secret || !payload) return res.status(400).json({ ok: false, msg: 'secret and payload required' });
  const row = await AdminChild.findOne({ address });
  if (!row) return res.status(404).json({ ok: false, msg: 'Not found' });
  if (!row.enabled) return res.status(403).json({ ok: false, msg: 'Child disabled' });
  const providedHash = shaLike(String(secret));
  if (providedHash !== row.secretHash) return res.status(401).json({ ok: false, msg: 'Bad secret' });
  const sig = shaLike(JSON.stringify(payload) + providedHash);
  res.json({ ok: true, sig });
});
// Stats and verifications list
app.get('/api/admin/stats', requireAdmin, async (_req, res) => {
  const children = await AdminChild.countDocuments();
  const verifications = await Verification.countDocuments();
  res.json({ ok: true, counts: { children, verifications } });
});
app.get('/api/admin/verifications', requireAdmin, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = await Verification.find().sort({ createdAt: -1 }).limit(limit);
  res.json({ ok: true, verifications: rows });
});

// --- Admin: miners management ---
// List miners
app.get('/api/admin/miners', requireAdmin, async (_req, res) => {
  const rows = await Miner.find().sort({ createdAt: -1 }).limit(500);
  res.json({ ok: true, miners: rows });
});
// Add/update miner (stores only secret hash)
app.post('/api/admin/miners', requireAdmin, async (req, res) => {
  const { address, label, secret } = req.body || {};
  if (!address || !secret) return res.status(400).json({ ok: false, msg: 'address and secret required' });
  const secretHash = shaLike(String(secret));
  const up = await Miner.findOneAndUpdate(
    { address },
    { $set: { address, label: label || '', secretHash, enabled: true } },
    { upsert: true, new: true }
  );
  res.json({ ok: true, miner: up });
});
// Toggle miner
app.post('/api/admin/miners/:address/toggle', requireAdmin, async (req, res) => {
  const { enabled } = req.body || {};
  const { address } = req.params;
  const row = await Miner.findOneAndUpdate({ address }, { $set: { enabled: !!enabled } }, { new: true });
  if (!row) return res.status(404).json({ ok: false, msg: 'Not found' });
  res.json({ ok: true, miner: row });
});
// Sign payload with miner secret
app.post('/api/admin/miners/:address/sign', requireAdmin, async (req, res) => {
  const { address } = req.params;
  const { secret, payload } = req.body || {};
  if (!secret || !payload) return res.status(400).json({ ok: false, msg: 'secret and payload required' });
  const row = await Miner.findOne({ address });
  if (!row) return res.status(404).json({ ok: false, msg: 'Not found' });
  if (!row.enabled) return res.status(403).json({ ok: false, msg: 'Miner disabled' });
  const providedHash = shaLike(String(secret));
  if (providedHash !== row.secretHash) return res.status(401).json({ ok: false, msg: 'Bad secret' });
  const sig = shaLike(JSON.stringify(payload) + providedHash);
  res.json({ ok: true, sig });
});
// Verify a provided signature using miner secret (admin-triggered)
app.post('/api/admin/miners/:address/verify', requireAdmin, async (req, res) => {
  const { address } = req.params;
  const { payload, signature } = req.body || {};
  if (!payload || !signature) return res.status(400).json({ ok: false, msg: 'payload and signature required' });
  const row = await Miner.findOne({ address });
  if (!row) return res.status(404).json({ ok: false, msg: 'Not found' });
  if (!row.enabled) return res.status(403).json({ ok: false, msg: 'Miner disabled' });
  const expected = shaLike(JSON.stringify(payload) + row.secretHash);
  const valid = expected === signature;
  if (valid) {
    await Miner.updateOne({ _id: row._id }, { $inc: { verifiedCount: 1 } });
  }
  const record = await Verification.create({ tx: payload, valid, reason: valid ? 'Miner signature valid' : 'Signature mismatch', admin: `miner:${address}` });
  res.json({ ok: true, valid, verification: record });
});

// --- Admin Auth (username/password) ---
const ADMIN_USER = process.env.ADMIN_USER || 'hrishabh.bit';
const ADMIN_PASS = process.env.ADMIN_PASS || 'hrishabh.bit';
const adminTokens = new Map(); // token -> username

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username !== ADMIN_USER || password !== ADMIN_PASS) return res.status(401).json({ ok: false, msg: 'Invalid credentials' });
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  adminTokens.set(token, username);
  res.json({ ok: true, token });
});

function requireAdmin(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ ok: false, msg: 'Missing token' });
  const token = m[1];
  const user = adminTokens.get(token);
  if (!user) return res.status(401).json({ ok: false, msg: 'Invalid token' });
  req.adminUser = user;
  next();
}

// Verify a transaction signature/content and store the result
app.post('/api/admin/verify-tx', requireAdmin, async (req, res) => {
  try {
    const tx = req.body || {};
    let valid = false;
    let reason = '';
    if (!tx || !tx.type || !tx.token || !tx.to || !(tx.amount > 0)) {
      return res.status(400).json({ ok: false, msg: 'Invalid tx payload' });
    }
    if (tx.type === 'TRANSFER') {
      if (!tx.from || !tx.sig) { reason = 'Missing from/sig'; }
      else {
        const fromUser = await User.findOne({ address: tx.from });
        if (!fromUser) { reason = 'Unknown sender'; }
        else {
          const expected = shaLike(JSON.stringify({ type: tx.type, token: tx.token, from: tx.from, to: tx.to, amount: tx.amount }) + fromUser.publicProof);
          valid = tx.sig === expected;
          reason = valid ? 'Signature matches' : 'Signature mismatch';
        }
      }
    } else if (tx.type === 'MINT') {
      // Optional owner signature check if provided
      const token = await Token.findOne({ symbol: tx.token });
      if (!token) { reason = 'Unknown token'; }
      else if (tx.owner && tx.sig) {
        const ownerUser = await User.findOne({ address: tx.owner });
        if (!ownerUser) { reason = 'Unknown owner'; }
        else {
          const expected = shaLike(JSON.stringify({ type: tx.type, token: tx.token, to: tx.to, amount: tx.amount }) + ownerUser.publicProof);
          valid = tx.sig === expected && token.owner === tx.owner;
          reason = valid ? 'Owner signature matches' : 'Owner/signature mismatch';
        }
      } else {
        // If no signature, just check token exists
        valid = !!token;
        reason = valid ? 'Token exists (no sig provided)' : 'Unknown token';
      }
    } else {
      reason = 'Unsupported type';
    }

    const record = await Verification.create({ tx, valid, reason, admin: req.adminUser });
    res.json({ ok: true, valid, reason, verification: record });
  } catch (e) {
    res.status(500).json({ ok: false, msg: 'Server error' });
  }
});

// Users
app.post('/api/users/register', async (req, res) => {
  try {
    const { address, username, publicProof } = req.body;
    if (!address || !username || !publicProof) return res.status(400).json({ ok: false, msg: 'Missing fields' });
    const exists = await User.findOne({ address });
    if (exists) return res.status(409).json({ ok: false, msg: 'User exists' });
    const user = await User.create({ address, username, publicProof });
    res.json({ ok: true, user });
  } catch (e) {
    res.status(500).json({ ok: false, msg: 'Server error' });
  }
});

const challenges = new Map();
app.post('/api/users/challenge', async (req, res) => {
  const { address } = req.body || {};
  const user = await User.findOne({ address });
  if (!user) return res.status(404).json({ ok: false, msg: 'Unknown user' });
  const nonce = Math.random().toString(36).slice(2);
  challenges.set(address, nonce);
  res.json({ ok: true, challenge: nonce });
});
app.post('/api/users/verify', async (req, res) => {
  const { address, signature } = req.body || {};
  const user = await User.findOne({ address });
  const chal = challenges.get(address);
  if (!user || !chal) return res.status(400).json({ ok: false, msg: 'No challenge' });
  const expected = shaLike(JSON.stringify(chal) + user.publicProof);
  const ok = signature === expected;
  if (ok) challenges.delete(address);
  res.json(ok ? { ok: true, user: { address: user.address, username: user.username } } : { ok: false, msg: 'Bad signature' });
});

// Tokens
app.get('/api/tokens', async (_req, res) => {
  const tokens = await Token.find().sort({ symbol: 1 });
  res.json({ ok: true, tokens });
});
app.post('/api/tokens', async (req, res) => {
  const { symbol, name, decimals, owner } = req.body || {};
  if (!symbol || !owner) return res.status(400).json({ ok: false, msg: 'Missing fields' });
  const exists = await Token.findOne({ symbol });
  if (exists) return res.status(409).json({ ok: false, msg: 'Token exists' });
  const token = await Token.create({ symbol, name, decimals: decimals ?? 6, owner });
  res.json({ ok: true, token });
});

// Mempool
app.get('/api/mempool', async (_req, res) => {
  const txs = await MempoolTx.find().sort({ ts: -1 }).limit(100);
  res.json({ ok: true, txs });
});
app.post('/api/mempool', async (req, res) => {
  const { type, token, from, to, amount, sig, owner } = req.body || {};
  if (!type || !token || !to || !(amount > 0)) return res.status(400).json({ ok: false, msg: 'Invalid tx' });
  const tx = await MempoolTx.create({ type, token, from, to, amount, sig, owner });
  res.json({ ok: true, tx });
});

// Helper to get balances map
async function loadBalancesMap() {
  const rows = await Balance.find();
  const map = {};
  for (const r of rows) {
    if (!map[r.address]) map[r.address] = {};
    map[r.address][r.token] = r.amount;
  }
  return map;
}
async function saveBalancesMap(map) {
  const ops = [];
  for (const addr of Object.keys(map)) {
    for (const token of Object.keys(map[addr])) {
      const amt = map[addr][token];
      ops.push(Balance.updateOne({ address: addr, token }, { $set: { amount: amt } }, { upsert: true }));
    }
  }
  await Promise.all(ops);
}

// Chain
app.get('/api/chain', async (_req, res) => {
  const blocks = await Block.find().sort({ index: 1 });
  res.json({ ok: true, chain: blocks });
});

app.post('/api/mine', async (req, res) => {
  const { minerAddress = 'miner' } = req.body || {};
  const prev = await Block.findOne().sort({ index: -1 });
  const prevIndex = prev ? prev.index : 0;
  const prevHash = prev ? prev.hash : '00000000';
  const mem = await MempoolTx.find().sort({ ts: 1 }).limit(10);
  const txs = mem.map(m => ({ type: m.type, token: m.token, from: m.from, to: m.to, amount: m.amount, sig: m.sig, owner: m.owner }));
  const ts = Date.now();
  let nonce = 0; let hash = '';
  const headerBase = JSON.stringify({ idx: prevIndex + 1, prevHash, ts, txs });
  do { nonce++; hash = shaLike(headerBase + nonce); } while (!hash.startsWith('000'));
  const block = await Block.create({ index: prevIndex + 1, prevHash, ts, nonce, txs, hash, miner: minerAddress });

  // apply balances
  let map = await loadBalancesMap();
  for (const tx of txs) map = applyTx(map, tx);
  // reward POW in POW token
  const reward = 1;
  if (!map[minerAddress]) map[minerAddress] = {};
  if (!map[minerAddress]['POW']) map[minerAddress]['POW'] = 0;
  map[minerAddress]['POW'] += reward;
  await saveBalancesMap(map);
  // clear included from mempool
  const ids = mem.map(m => m._id);
  await MempoolTx.deleteMany({ _id: { $in: ids } });

  res.json({ ok: true, block });
});

// Export app for serverless (Vercel) usage
export default app;

// Local dev server: only listen when not running under Vercel
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bitsim';

connectDB(MONGODB_URI)
  .then(() => {
    if (!process.env.VERCEL) {
      app.listen(PORT, () => console.log(`bitsim-server listening on http://localhost:${PORT}`));
    }
  })
  .catch((e) => {
    console.error('DB connect error', e);
    if (!process.env.VERCEL) process.exit(1);
  });
