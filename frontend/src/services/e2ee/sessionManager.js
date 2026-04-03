/**
 * sessionManager.js — ECDH session key derivation and in-memory cache.
 *
 * For each direct chat peer, we:
 *   1. Fetch their public key bundle from the server (once per page session)
 *   2. Derive a shared session key via ECDH + HKDF
 *   3. Cache the resulting AES-GCM key in a Map keyed by peerId
 *
 * The cache is in-memory only — it clears on page refresh.
 * This is intentional: re-deriving from stable keys is trivial and keeps
 * no sensitive material in long-lived storage beyond the private key itself.
 *
 * Future upgrade path: replace the stable session key with a Double-Ratchet
 * state machine stored in IndexedDB.
 */

import { importPublicKey, deriveSessionKey } from './crypto';
import { fetchPeerBundle } from './keyService';
import { loadKeyPair } from './keyStore';

// In-memory cache: peerId → CryptoKey (AES-GCM-256)
const sessionKeyCache = new Map();

// In-memory cache: peerId → { identityKey, sessionSalt } (raw bundle)
const bundleCache = new Map();

// ─── Core API ─────────────────────────────────────────────────────────────────

/**
 * Return the AES-GCM session key for a given peer, deriving it if needed.
 * Returns null if:
 *   - The peer has no key bundle on the server (not E2EE capable)
 *   - Our own private key is missing (device reset / logged out)
 *   - Any cryptographic operation fails
 *
 * @param {string} peerId
 * @returns {Promise<CryptoKey|null>}
 */
export async function getSessionKey(peerId) {
  if (sessionKeyCache.has(peerId)) {
    return sessionKeyCache.get(peerId);
  }

  try {
    // Load our private key from IndexedDB
    const myKeyPair = await loadKeyPair();
    if (!myKeyPair) {
      console.warn('[E2EE] No local key pair found — cannot derive session key');
      return null;
    }

    // Fetch peer's public bundle
    const bundle = await fetchPeerBundle(peerId);
    if (!bundle) {
      return null; // Peer has not set up E2EE
    }

    bundleCache.set(peerId, bundle);

    // Import peer's SPKI public key
    const peerPublicKey = await importPublicKey(bundle.identityKey);

    // Derive session key: ECDH → HKDF → AES-GCM-256
    const sessionKey = await deriveSessionKey(
      myKeyPair.privateKey,
      peerPublicKey,
      bundle.sessionSalt
    );

    sessionKeyCache.set(peerId, sessionKey);
    return sessionKey;
  } catch (err) {
    console.error('[E2EE] Session key derivation failed:', err);
    return null;
  }
}

/**
 * Check whether a peer is E2EE capable (has a key bundle on the server).
 * Uses the bundle cache to avoid redundant API calls.
 *
 * @param {string} peerId
 * @returns {Promise<boolean>}
 */
export async function isPeerE2EECapable(peerId) {
  if (bundleCache.has(peerId)) return true;
  const key = await getSessionKey(peerId);
  return key !== null;
}

/**
 * Evict a peer's session key from the cache — useful when a peer rotates keys.
 * The next call to getSessionKey() will re-derive.
 *
 * @param {string} peerId
 */
export function evictSession(peerId) {
  sessionKeyCache.delete(peerId);
  bundleCache.delete(peerId);
}

/**
 * Clear all cached session keys (e.g. on logout).
 */
export function clearAllSessions() {
  sessionKeyCache.clear();
  bundleCache.clear();
}
