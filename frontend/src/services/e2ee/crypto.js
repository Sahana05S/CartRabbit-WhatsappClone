/**
 * crypto.js — Core Web Crypto API operations for NexTalk E2EE v1.
 *
 * Protocol:
 *   ECDH P-256  →  HKDF-SHA-256  →  AES-GCM-256  (per-message random IV)
 *
 * All operations use the native Web Crypto API (window.crypto.subtle).
 * No third-party cryptographic libraries are used.
 *
 * Security properties (v1):
 *   ✅ Content confidentiality (AES-GCM authenticated encryption)
 *   ✅ Integrity / tamper detection (GCM authentication tag)
 *   ✅ Per-message uniqueness (random 12-byte IV)
 *   ✅ Conversation binding (sender/receiver/timestamp in AAD)
 *   ❌ Forward secrecy — deferred to v2 (Double Ratchet)
 *   ❌ Multi-device — deferred to v2
 */

const ECDH_PARAMS  = { name: 'ECDH', namedCurve: 'P-256' };
const HKDF_HASH    = 'SHA-256';
const AES_ALGO     = 'AES-GCM';
const AES_LENGTH   = 256;
const IV_BYTES     = 12;  // 96-bit nonce recommended for AES-GCM
const HKDF_INFO    = new TextEncoder().encode('NexTalk-E2EE-v1-session');

// ─── Encoding helpers ─────────────────────────────────────────────────────────

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary  = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function base64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// ─── Key Generation ───────────────────────────────────────────────────────────

/**
 * Generate a new ECDH P-256 identity key pair.
 * privateKey is NON-EXTRACTABLE — it never leaves the browser's crypto engine.
 * publicKey is EXTRACTABLE so it can be serialised to SPKI for server upload.
 *
 * @returns {Promise<CryptoKeyPair>}
 */
export async function generateIdentityKeyPair() {
  return crypto.subtle.generateKey(
    ECDH_PARAMS,
    false,           // privateKey: non-extractable
    ['deriveKey', 'deriveBits']
  );
}

// ─── Key Export / Import ──────────────────────────────────────────────────────

/**
 * Export a public CryptoKey to base64-encoded SPKI format for server upload.
 * @param {CryptoKey} publicKey
 * @returns {Promise<string>} base64
 */
export async function exportPublicKey(publicKey) {
  const spki = await crypto.subtle.exportKey('spki', publicKey);
  return arrayBufferToBase64(spki);
}

/**
 * Import a base64 SPKI public key received from the server.
 * @param {string} base64Spki
 * @returns {Promise<CryptoKey>}
 */
export async function importPublicKey(base64Spki) {
  const spki = base64ToArrayBuffer(base64Spki);
  return crypto.subtle.importKey(
    'spki',
    spki,
    ECDH_PARAMS,
    true,            // extractable — it's just a public key
    []               // usages are empty for ECDH recipient keys
  );
}

// ─── Session Key Derivation ───────────────────────────────────────────────────

/**
 * Perform ECDH + HKDF to derive a symmetric AES-GCM session key.
 *
 * Step 1: ECDH(myPrivateKey, peerPublicKey) → sharedSecret
 * Step 2: HKDF(sharedSecret, salt=sessionSalt, info="NexTalk-E2EE-v1-session") → AES-GCM-256 key
 *
 * The resulting key is cached in sessionManager.js on a per-peer basis.
 *
 * @param {CryptoKey}  myPrivateKey  — non-extractable ECDH private key from IndexedDB
 * @param {CryptoKey}  peerPublicKey — imported from server key bundle
 * @param {string}     sessionSalt   — base64 16-byte salt from server key bundle
 * @returns {Promise<CryptoKey>}     — AES-GCM-256 key (non-extractable)
 */
export async function deriveSessionKey(myPrivateKey, peerPublicKey, sessionSalt) {
  const saltBuffer = base64ToArrayBuffer(sessionSalt);

  // Step 1: ECDH → raw shared bits (we use deriveBits → importKey as HKDF)
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPublicKey },
    myPrivateKey,
    256
  );

  // Import shared bits as HKDF base key material
  const hkdfKey = await crypto.subtle.importKey(
    'raw',
    sharedBits,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  // Step 2: HKDF → AES-GCM-256 session key
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: HKDF_HASH,
      salt: saltBuffer,
      info: HKDF_INFO,
    },
    hkdfKey,
    { name: AES_ALGO, length: AES_LENGTH },
    false,           // non-extractable session key
    ['encrypt', 'decrypt']
  );
}

// ─── Encrypt ──────────────────────────────────────────────────────────────────

/**
 * Encrypt a plaintext string with the shared session key using AES-GCM.
 *
 * Returns base64-encoded iv and ciphertext. The AAD (Additional Authenticated Data)
 * cryptographically binds the ciphertext to the sender, receiver, and timestamp,
 * preventing replay or swapping of ciphertexts between conversations.
 *
 * @param {CryptoKey} sessionKey
 * @param {string}    plaintext
 * @param {object}    aadData   — { senderId, receiverId, t: timestamp }
 * @returns {Promise<{ iv: string, ciphertext: string, aad: string }>}
 */
export async function encryptMessage(sessionKey, plaintext, aadData) {
  const iv      = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plaintext);
  const aadJson = JSON.stringify(aadData);
  const aadBuf  = new TextEncoder().encode(aadJson);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: AES_ALGO, iv, additionalData: aadBuf },
    sessionKey,
    encoded
  );

  return {
    iv:         arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    aad:        arrayBufferToBase64(aadBuf),
  };
}

// ─── Decrypt ──────────────────────────────────────────────────────────────────

/**
 * Decrypt an AES-GCM ciphertext. Returns null on any failure (tamper / wrong key).
 *
 * IMPORTANT: decryption must be treated as untrusted input — we validate AAD
 * to confirm the ciphertext belongs to the expected conversation before trusting it.
 *
 * @param {CryptoKey} sessionKey
 * @param {string}    iv64         base64 nonce
 * @param {string}    ciphertext64 base64 ciphertext
 * @param {string}    aad64        base64 AAD
 * @param {object}    expectedAad  — { senderId, receiverId } to validate against
 * @returns {Promise<string|null>}
 */
export async function decryptMessage(sessionKey, iv64, ciphertext64, aad64, expectedAad) {
  try {
    const iv         = base64ToArrayBuffer(iv64);
    const ciphertext = base64ToArrayBuffer(ciphertext64);
    const aadBuf     = base64ToArrayBuffer(aad64);

    // Validate AAD before trusting it — prevents ciphertext-swapping attacks
    if (expectedAad) {
      try {
        const aadJson = new TextDecoder().decode(aadBuf);
        const parsed  = JSON.parse(aadJson);
        if (
          parsed.senderId   !== expectedAad.senderId   ||
          parsed.receiverId !== expectedAad.receiverId
        ) {
          console.warn('[E2EE] AAD conversation mismatch — rejecting message');
          return null;
        }
      } catch {
        console.warn('[E2EE] AAD parse failed — rejecting message');
        return null;
      }
    }

    const plaintextBuffer = await crypto.subtle.decrypt(
      { name: AES_ALGO, iv, additionalData: aadBuf },
      sessionKey,
      ciphertext
    );

    return new TextDecoder().decode(plaintextBuffer);
  } catch (err) {
    // DOMException is expected when key is wrong, ciphertext is tampered, or
    // the user has lost their key (logged out and back in).
    if (err.name !== 'OperationError' && err.name !== 'DOMException') {
      console.error('[E2EE] Unexpected decrypt error:', err);
    }
    return null;
  }
}

// ─── Salt Generation ──────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random 16-byte session salt for HKDF.
 * This is uploaded to the server as part of the key bundle.
 * @returns {string} base64
 */
export function generateSessionSalt() {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return arrayBufferToBase64(salt);
}
