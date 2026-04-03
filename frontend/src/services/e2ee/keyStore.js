/**
 * keyStore.js — IndexedDB adapter for E2EE key material.
 *
 * Private keys are stored as NON-EXTRACTABLE CryptoKey objects inside
 * IndexedDB. They can never be serialised to JS strings — the browser
 * enforces this at the WebCrypto API level.
 *
 * On logout call wipeKeys() to clear the entire store.
 */

const DB_NAME    = 'nextalk-e2ee';
const STORE_NAME = 'identity';
const KEY_ID     = 'identity-keypair';
const DB_VERSION = 1;

// ─── Open / initialise DB ─────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

// ─── Save key pair ─────────────────────────────────────────────────────────────

/**
 * Persist a CryptoKeyPair ({ privateKey, publicKey }) to IndexedDB.
 * Overwrites any existing entry.
 */
export async function saveKeyPair(keyPair) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.put({ id: KEY_ID, privateKey: keyPair.privateKey, publicKey: keyPair.publicKey });
    req.onsuccess = () => resolve();
    req.onerror   = (e) => reject(e.target.error);
  });
}

// ─── Load key pair ─────────────────────────────────────────────────────────────

/**
 * Load the stored CryptoKeyPair. Returns null if none exists.
 * @returns {Promise<CryptoKeyPair|null>}
 */
export async function loadKeyPair() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req   = store.get(KEY_ID);
      req.onsuccess = (e) => {
        const record = e.target.result;
        if (record) {
          resolve({ privateKey: record.privateKey, publicKey: record.publicKey });
        } else {
          resolve(null);
        }
      };
      req.onerror = (e) => reject(e.target.error);
    });
  } catch {
    return null;
  }
}

// ─── Wipe all keys ────────────────────────────────────────────────────────────

/**
 * Delete all key material from IndexedDB.
 * Must be called on logout so the private key does not persist.
 */
export async function wipeKeys() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req   = store.clear();
      req.onsuccess = () => resolve();
      req.onerror   = (e) => reject(e.target.error);
    });
  } catch {
    // Best-effort — do not throw on logout
  }
}

// ─── Check existence ──────────────────────────────────────────────────────────

export async function hasKeyPair() {
  const pair = await loadKeyPair();
  return pair !== null;
}
