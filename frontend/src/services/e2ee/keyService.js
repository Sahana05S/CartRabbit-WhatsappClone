/**
 * keyService.js — Key lifecycle management.
 *
 * Responsibilities:
 *  - Generate identity key pair on first login
 *  - Export public key and upload to server
 *  - Fetch peer public key bundles for session establishment
 *  - Initialise and wipe key material on login/logout
 */

import api from '../../api/axios';
import { generateIdentityKeyPair, exportPublicKey, generateSessionSalt } from './crypto';
import { saveKeyPair, loadKeyPair, wipeKeys } from './keyStore';

// ─── Bootstrap ────────────────────────────────────────────────────────────────

/**
 * Called on every login.
 * If a key pair already exists in IndexedDB, it re-uploads the public key to
 * the server (handles cases where the server DB was wiped).
 * If no key pair exists, generates a new one and uploads it.
 *
 * @returns {Promise<CryptoKeyPair>}
 */
export async function initE2EE() {
  let keyPair = await loadKeyPair();

  if (!keyPair) {
    // First-time setup on this device
    keyPair = await generateIdentityKeyPair();
    keyPair.sessionSalt = generateSessionSalt();
    await saveKeyPair(keyPair);
  }

  // Always (re)upload the public key in case the server lost it
  await uploadPublicKey(keyPair.publicKey, keyPair.sessionSalt);

  return keyPair;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Export the public key to SPKI base64 and POST it to the server.
 * The server stores only the public key — private key never leaves IndexedDB.
 * A new random salt is generated each time (upgrading the session key for new chats).
 */
async function uploadPublicKey(publicKey, sessionSalt) {
  try {
    const identityKey = await exportPublicKey(publicKey);

    await api.post('/keys/upload', { identityKey, sessionSalt });
  } catch (err) {
    // Non-fatal on login — the user can still send plaintext if the upload fails.
    // The E2EEContext will mark itself as not-ready for encrypted mode.
    console.warn('[E2EE] Public key upload failed:', err?.response?.data?.message || err.message);
    throw err;
  }
}

// ─── Fetch peer bundle ─────────────────────────────────────────────────────────

/**
 * Fetch another user's public key bundle from the server.
 * Returns null if the peer has not set up E2EE yet.
 *
 * @param {string} peerId
 * @returns {Promise<{ identityKey: string, sessionSalt: string } | null>}
 */
export async function fetchPeerBundle(peerId) {
  try {
    const { data } = await api.get(`/keys/${peerId}`);
    if (data.success && data.bundle) {
      return data.bundle;
    }
    return null;
  } catch (err) {
    if (err.response?.status === 404) return null; // Peer has no keys yet
    console.error('[E2EE] fetchPeerBundle error:', err);
    return null;
  }
}

// ─── Wipe ─────────────────────────────────────────────────────────────────────

/**
 * Called on logout — deletes all local key material from IndexedDB.
 * After this, old encrypted messages stored on the server cannot be decrypted
 * from this device. This is an accepted v1 constraint (no key backup).
 */
export async function wipeE2EE() {
  await wipeKeys();
}

// ─── Re-export for convenience ────────────────────────────────────────────────

export { loadKeyPair };
