import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  address: { type: String, unique: true, index: true },
  username: String,
  publicProof: String,
  createdAt: { type: Date, default: Date.now },
});

const TokenSchema = new mongoose.Schema({
  symbol: { type: String, unique: true, index: true },
  name: String,
  decimals: { type: Number, default: 6 },
  owner: String,
});

const TxSchema = new mongoose.Schema({
  type: { type: String, enum: ['MINT', 'TRANSFER'] },
  token: String,
  from: String,
  to: String,
  amount: Number,
  sig: String,
  owner: String,
  ts: { type: Date, default: Date.now },
});

const BlockSchema = new mongoose.Schema({
  index: Number,
  prevHash: String,
  hash: String,
  nonce: Number,
  ts: { type: Date, default: Date.now },
  txs: [TxSchema],
  miner: String,
});

const BalanceSchema = new mongoose.Schema({
  address: { type: String, index: true },
  token: { type: String, index: true },
  amount: { type: Number, default: 0 },
}, { indexes: [{ fields: { address: 1, token: 1 }, options: { unique: true } }] });

const CustomCoinSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  symbol: String,
  price: Number,
  prices: [Number],
  mineRate: Number,
  userHoldings: Number,
  owner: String,
});

export const User = mongoose.model('User', UserSchema);
export const Token = mongoose.model('Token', TokenSchema);
export const Block = mongoose.model('Block', BlockSchema);
export const Balance = mongoose.model('Balance', BalanceSchema);
export const CustomCoin = mongoose.model('CustomCoin', CustomCoinSchema);
export const MempoolTx = mongoose.model('MempoolTx', TxSchema);

// Admin verification records
const VerificationSchema = new mongoose.Schema({
  tx: TxSchema,
  valid: Boolean,
  reason: String,
  admin: String, // username
  createdAt: { type: Date, default: Date.now },
});

export const Verification = mongoose.model('Verification', VerificationSchema);

// Admin-managed child access (stores only secret hash)
const AdminChildSchema = new mongoose.Schema({
  address: { type: String, unique: true, index: true },
  label: String,
  secretHash: String,
  enabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const AdminChild = mongoose.model('AdminChild', AdminChildSchema);

// Miners managed by admin
const MinerSchema = new mongoose.Schema({
  address: { type: String, unique: true, index: true },
  label: String,
  secretHash: String,
  enabled: { type: Boolean, default: true },
  verifiedCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const Miner = mongoose.model('Miner', MinerSchema);
