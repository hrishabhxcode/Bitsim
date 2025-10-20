import React, { useMemo, useState } from "react";
import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 as nobleSha256 } from "@noble/hashes/sha256";

function ab2b64(arr) { return btoa(String.fromCharCode(...new Uint8Array(arr))); }
function b642ab(b64) { return Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer; }
function str2ab(str) { return new TextEncoder().encode(str).buffer; }
function ab2hex(buffer) { return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join(""); }
function bytesToHex(bytes) { return [...bytes].map(b => b.toString(16).padStart(2, "0")).join(""); }

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1000); } catch {} }}>
      {copied ? "Copied!" : label}
    </button>
  );
}

async function sha256(text) {
  const data = str2ab(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return ab2hex(digest);
}

async function deriveKeyFromPassword(password, saltB64) {
  const salt = saltB64 ? b642ab(saltB64) : crypto.getRandomValues(new Uint8Array(16)).buffer;
  const saltOut = ab2b64(salt);
  const baseKey = await crypto.subtle.importKey("raw", str2ab(password), "PBKDF2", false, ["deriveKey"]);
  const aesKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  return { aesKey, saltOut };
}

async function aesEncrypt(plainText, password) {
  const { aesKey, saltOut } = await deriveKeyFromPassword(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, str2ab(plainText));
  return { cipherB64: ab2b64(ct), ivB64: ab2b64(iv.buffer), saltB64: saltOut };
}

async function aesDecrypt(cipherB64, password, ivB64, saltB64) {
  const { aesKey } = await deriveKeyFromPassword(password, saltB64);
  const iv = new Uint8Array(b642ab(ivB64));
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, b642ab(cipherB64)).catch(() => null);
  return pt ? new TextDecoder().decode(pt) : null;
}

async function genRSA() {
  const keyPair = await crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["encrypt", "decrypt"]
  );
  const pubJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  return { keyPair, pubJwk, privJwk };
}

async function rsaEncrypt(publicJwk, text) {
  const pubKey = await crypto.subtle.importKey("jwk", publicJwk, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);
  const ct = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKey, str2ab(text));
  return ab2b64(ct);
}

async function rsaDecrypt(privateJwk, cipherB64) {
  const privKey = await crypto.subtle.importKey("jwk", privateJwk, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]);
  const pt = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privKey, b642ab(cipherB64));
  return new TextDecoder().decode(pt);
}

export default function LearnCrypto() {
  // Hashing state
  const [hashInput, setHashInput] = useState("Hello, Bitcoin!");
  const [hashOut, setHashOut] = useState("");

  // Symmetric AES-GCM state
  const [symPlain, setSymPlain] = useState("Top secret text");
  const [symPass, setSymPass] = useState("password123");
  const [symCipher, setSymCipher] = useState("");
  const [symIv, setSymIv] = useState("");
  const [symSalt, setSymSalt] = useState("");
  const [symDecrypted, setSymDecrypted] = useState("");

  // RSA state
  const [rsaPub, setRsaPub] = useState(null);
  const [rsaPriv, setRsaPriv] = useState(null);
  const [rsaMsg, setRsaMsg] = useState("Confidential message");
  const [rsaCipher, setRsaCipher] = useState("");
  const [rsaPlain, setRsaPlain] = useState("");
  const hasRSA = useMemo(() => !!rsaPub && !!rsaPriv, [rsaPub, rsaPriv]);

  // ECDSA (P-256) signing state
  const [ecdsaPub, setEcdsaPub] = useState(null);
  const [ecdsaPriv, setEcdsaPriv] = useState(null);
  const [ecdsaMsg, setEcdsaMsg] = useState("I authorize this action");
  const [ecdsaSig, setEcdsaSig] = useState("");
  const [ecdsaVerified, setEcdsaVerified] = useState(null);
  const hasECDSA = useMemo(() => !!ecdsaPub && !!ecdsaPriv, [ecdsaPub, ecdsaPriv]);

  // secp256k1 (Bitcoin-style) signing demo using noble
  const [k1PrivHex, setK1PrivHex] = useState("");
  const [k1PubHex, setK1PubHex] = useState("");
  const [k1Msg, setK1Msg] = useState("Pay 1 BTC to address X");
  const [k1HashHex, setK1HashHex] = useState("");
  const [k1SigHex, setK1SigHex] = useState("");
  const [k1Verified, setK1Verified] = useState(null);

  return (
    <div className="grid gap-5">
      <div className="card shadow-soft" style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Learn: Hashing (SHA-256)</div>
        <div style={{ display: "grid", gap: 8 }}>
          <textarea rows={3} value={hashInput} onChange={(e) => setHashInput(e.target.value)} placeholder="Enter text" />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={async () => setHashOut(await sha256(hashInput))}>Hash</button>
            {hashOut && <button onClick={() => navigator.clipboard.writeText(hashOut)}>Copy Hash</button>}
          </div>
          {hashOut && <div style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>{hashOut}</div>}
        </div>
      </div>

      <div className="card shadow-soft" style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Learn: Symmetric Encryption (AES-GCM + Password)</div>
        <div style={{ display: "grid", gap: 8 }}>
          <textarea rows={3} value={symPlain} onChange={(e) => setSymPlain(e.target.value)} placeholder="Plaintext" />
          <input value={symPass} onChange={(e) => setSymPass(e.target.value)} placeholder="Password" type="password" />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={async () => { const r = await aesEncrypt(symPlain, symPass); setSymCipher(r.cipherB64); setSymIv(r.ivB64); setSymSalt(r.saltB64); setSymDecrypted(""); }}>Encrypt</button>
            <button onClick={async () => { const pt = await aesDecrypt(symCipher, symPass, symIv, symSalt); setSymDecrypted(pt ?? "(failed)"); }}>Decrypt</button>
          </div>
          {(symCipher || symDecrypted) && (
            <div style={{ display: "grid", gap: 6, fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>
              {symCipher && <div>cipher: {symCipher}</div>}
              {symIv && <div>iv: {symIv}</div>}
              {symSalt && <div>salt: {symSalt}</div>}
              {symDecrypted && <div>decrypted: {symDecrypted}</div>}
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-soft" style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Learn: Public/Private Keys (RSA-OAEP)</div>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={async () => { const { pubJwk, privJwk } = await genRSA(); setRsaPub(pubJwk); setRsaPriv(privJwk); setRsaCipher(""); setRsaPlain(""); }}>Generate Key Pair</button>
            {hasRSA && <button onClick={() => { setRsaPub(null); setRsaPriv(null); setRsaCipher(""); setRsaPlain(""); }}>Reset Keys</button>}
          </div>
          {hasRSA && (
            <div style={{ display: "grid", gap: 6, fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>
              <div>public JWK: {JSON.stringify(rsaPub)}</div>
              <div>private JWK: {JSON.stringify(rsaPriv)}</div>
            </div>
          )}
          <textarea rows={3} value={rsaMsg} onChange={(e) => setRsaMsg(e.target.value)} placeholder="Message to encrypt" />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button disabled={!hasRSA} onClick={async () => setRsaCipher(await rsaEncrypt(rsaPub, rsaMsg))}>Encrypt with Public Key</button>
            <button disabled={!hasRSA || !rsaCipher} onClick={async () => setRsaPlain(await rsaDecrypt(rsaPriv, rsaCipher))}>Decrypt with Private Key</button>
          </div>
          {(rsaCipher || rsaPlain) && (
            <div style={{ display: "grid", gap: 6, fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>
              {rsaCipher && <div>cipher: {rsaCipher}</div>}
              {rsaPlain && <div>decrypted: {rsaPlain}</div>}
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-soft" style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Learn: Digital Signatures (ECDSA P-256)</div>
        <div style={{ color: "#94a3b8", fontSize: 14 }}>
          Sign a message with your <b>private key</b> and let anyone verify it using your <b>public key</b>. This proves authenticity and integrity.
          Note: Bitcoin uses secp256k1; here we demo P-256 with WebCrypto for portability.
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={async () => {
              const kp = await crypto.subtle.generateKey(
                { name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]
              );
              const pub = await crypto.subtle.exportKey("jwk", kp.publicKey);
              const priv = await crypto.subtle.exportKey("jwk", kp.privateKey);
              setEcdsaPub(pub); setEcdsaPriv(priv); setEcdsaSig(""); setEcdsaVerified(null);
            }}>Generate Key Pair</button>
            {hasECDSA && <button onClick={() => { setEcdsaPub(null); setEcdsaPriv(null); setEcdsaSig(""); setEcdsaVerified(null); }}>Reset Keys</button>}
          </div>
          {hasECDSA && (
            <div style={{ display: "grid", gap: 6, fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>
              <div>public JWK: {JSON.stringify(ecdsaPub)}</div>
              <div>private JWK: {JSON.stringify(ecdsaPriv)}</div>
            </div>
          )}
          <textarea rows={3} value={ecdsaMsg} onChange={(e) => setEcdsaMsg(e.target.value)} placeholder="Message to sign" />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button disabled={!hasECDSA} onClick={async () => {
              const priv = await crypto.subtle.importKey("jwk", ecdsaPriv, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
              const sig = await crypto.subtle.sign({ name: "ECDSA", hash: { name: "SHA-256" } }, priv, str2ab(ecdsaMsg));
              setEcdsaSig(ab2b64(sig)); setEcdsaVerified(null);
            }}>Sign Message (Private Key)</button>
            <button disabled={!hasECDSA || !ecdsaSig} onClick={async () => {
              const pub = await crypto.subtle.importKey("jwk", ecdsaPub, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
              const ok = await crypto.subtle.verify({ name: "ECDSA", hash: { name: "SHA-256" } }, pub, b642ab(ecdsaSig), str2ab(ecdsaMsg));
              setEcdsaVerified(ok);
            }}>Verify Signature (Public Key)</button>
          </div>
          {(ecdsaSig || ecdsaVerified !== null) && (
            <div style={{ display: "grid", gap: 6, fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>
              {ecdsaSig && (
                <div>
                  <div>signature (DER-like raw WebCrypto format, base64): {ecdsaSig}</div>
                  <div style={{ marginTop: 6 }}><CopyButton text={ecdsaSig} label="Copy Signature" /></div>
                </div>
              )}
              {ecdsaVerified !== null && <div>verified: {String(ecdsaVerified)}</div>}
            </div>
          )}
          <div className="anim-fade-up" style={{ color: "#94a3b8", fontSize: 13 }}>
            Flow: You sign → others verify with your public key. If the message or signature changes, verification fails.
          </div>
        </div>
      </div>

      <div className="card shadow-soft" style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Learn: Digital Signatures (ECDSA secp256k1 - Bitcoin style)</div>
        <div style={{ color: "#94a3b8", fontSize: 14 }}>
          This mirrors Bitcoin's signature scheme using the <b>secp256k1</b> curve. We hash the message with <b>SHA-256</b> and sign the hash with the private key.
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card" style={{ display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 600 }}>1) Key Pair</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => {
                const priv = secp256k1.utils.randomPrivateKey();
                const privHex = bytesToHex(priv);
                const pub = secp256k1.getPublicKey(priv, true); // compressed
                const pubHex = bytesToHex(pub);
                setK1PrivHex(privHex); setK1PubHex(pubHex);
              }}>Generate</button>
              {(k1PrivHex || k1PubHex) && <button onClick={() => { setK1PrivHex(""); setK1PubHex(""); setK1SigHex(""); setK1Verified(null); }}>Reset</button>}
            </div>
            {k1PrivHex && (
              <div style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>
                <div>priv (hex): {k1PrivHex}</div>
                <div style={{ marginTop: 6 }}><CopyButton text={k1PrivHex} label="Copy Private" /></div>
              </div>
            )}
            {k1PubHex && (
              <div style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>
                <div>pub (hex, compressed): {k1PubHex}</div>
                <div style={{ marginTop: 6 }}><CopyButton text={k1PubHex} label="Copy Public" /></div>
              </div>
            )}
          </div>
          <div className="card" style={{ display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 600 }}>2) Message → Hash</div>
            <textarea rows={4} value={k1Msg} onChange={(e) => setK1Msg(e.target.value)} placeholder="Message to sign" />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => {
                const h = nobleSha256(new TextEncoder().encode(k1Msg));
                setK1HashHex(bytesToHex(h));
              }}>Hash (SHA-256)</button>
              {k1HashHex && <CopyButton text={k1HashHex} label="Copy Hash" />}
            </div>
            {k1HashHex && <div style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>hash (hex): {k1HashHex}</div>}
          </div>
          <div className="card" style={{ display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 600 }}>3) Sign → Verify</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button disabled={!k1PrivHex || !k1HashHex} onClick={() => {
                const sig = secp256k1.sign(k1HashHex, k1PrivHex, { recovered: false });
                setK1SigHex(sig.toCompactHex()); // 64-byte compact hex
                setK1Verified(null);
              }}>Sign</button>
              <button disabled={!k1PubHex || !k1SigHex || !k1HashHex} onClick={() => {
                const ok = secp256k1.verify(k1SigHex, k1HashHex, k1PubHex);
                setK1Verified(ok);
              }}>Verify</button>
              {k1SigHex && <CopyButton text={k1SigHex} label="Copy Signature" />}
            </div>
            {(k1SigHex || k1Verified !== null) && (
              <div style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all", display: "grid", gap: 6 }}>
                {k1SigHex && <div>sig (compact hex): {k1SigHex}</div>}
                {k1Verified !== null && <div>verified: {String(k1Verified)}</div>}
              </div>
            )}
          </div>
        </div>
        <div className="anim-fade-up" style={{ color: "#94a3b8", fontSize: 13 }}>
          Visual flow:
          <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
            <div>Message → SHA-256 → <b>Hash</b></div>
            <div><b>Hash</b> + <b>Private Key</b> → <b>Signature</b></div>
            <div><b>Hash</b> + <b>Signature</b> + <b>Public Key</b> → Verify = true/false</div>
          </div>
        </div>
      </div>
    </div>
  );
}
