/**
 * E2EEContext.jsx — React context that exposes E2EE capabilities to all components.
 *
 * Provides:
 *   isE2EEReady     — boolean: local keys initialised and uploaded successfully
 *   encryptFor      — async (peerId, plaintext) => { iv, ciphertext, aad } | null
 *   decryptMessage  — async (message) => string | null
 *   isPeerSecure    — async (peerId) => boolean
 *   e2eeStatus      — 'initialising' | 'ready' | 'error'
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { initE2EE, wipeE2EE } from '../services/e2ee/keyService';
import { getSessionKey, isPeerE2EECapable, clearAllSessions } from '../services/e2ee/sessionManager';
import { encryptMessage, decryptMessage as decryptRaw } from '../services/e2ee/crypto';

const E2EEContext = createContext(null);

export const E2EEProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [e2eeStatus, setE2EEStatus] = useState('initialising'); // 'initialising' | 'ready' | 'error'

  // ── Initialise when user logs in ────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      // User logged out — wipe session key cache (IndexedDB wipe is in AuthContext)
      clearAllSessions();
      setE2EEStatus('initialising');
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        setE2EEStatus('initialising');
        await initE2EE();
        if (!cancelled) setE2EEStatus('ready');
      } catch (err) {
        if (!cancelled) {
          console.error('[E2EE] Initialisation failed:', err);
          setE2EEStatus('error');
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, [currentUser?._id]);  // Re-run only on actual user change

  // ── Encrypt a message for a peer ────────────────────────────────────────────
  /**
   * Encrypt `plaintext` for the given peer.
   * Returns null if the peer is not E2EE capable or if encryption fails.
   *
   * @param {string} peerId
   * @param {string} plaintext
   * @returns {Promise<{ iv, ciphertext, aad } | null>}
   */
  const encryptFor = useCallback(async (peerId, plaintext) => {
    if (e2eeStatus !== 'ready' || !currentUser) return null;

    try {
      const sessionKey = await getSessionKey(peerId);
      if (!sessionKey) return null;

      const aadData = {
        senderId:   currentUser._id,
        receiverId: peerId,
        t:          Date.now(),
      };

      const envelope = await encryptMessage(sessionKey, plaintext, aadData);
      return { ...envelope, version: 1, algorithm: 'AES-GCM-256' };
    } catch (err) {
      console.error('[E2EE] encryptFor failed:', err);
      return null;
    }
  }, [e2eeStatus, currentUser]);

  // ── Decrypt a received message ───────────────────────────────────────────────
  /**
   * Decrypt a message object that has an e2ee envelope.
   * Returns the plaintext string, or null on failure.
   *
   * The AAD is validated to confirm the ciphertext belongs to this conversation.
   *
   * @param {object} message — full message document from server
   * @returns {Promise<string|null>}
   */
  const decryptMsg = useCallback(async (message) => {
    if (!message?.isE2EE || !message?.e2ee) return null;
    if (!currentUser) return null;

    const { iv, ciphertext, aad } = message.e2ee;
    if (!iv || !ciphertext) return null;

    try {
      const senderId = message.senderId?._id || message.senderId;
      // We decrypt using the sender's session key (ECDH is symmetric)
      const peerId   = senderId === currentUser._id
        ? (message.receiverId?._id || message.receiverId)
        : senderId;

      const sessionKey = await getSessionKey(peerId);
      if (!sessionKey) return null;

      const expectedAad = {
        senderId:   senderId,
        receiverId: message.receiverId?._id || message.receiverId,
      };

      return await decryptRaw(sessionKey, iv, ciphertext, aad, expectedAad);
    } catch (err) {
      console.error('[E2EE] decryptMsg failed:', err);
      return null;
    }
  }, [currentUser]);

  // ── Check if a peer is E2EE capable ─────────────────────────────────────────
  const isPeerSecure = useCallback(async (peerId) => {
    if (e2eeStatus !== 'ready') return false;
    return isPeerE2EECapable(peerId);
  }, [e2eeStatus]);

  const value = {
    isE2EEReady:    e2eeStatus === 'ready',
    e2eeStatus,
    encryptFor,
    decryptMsg,
    isPeerSecure,
  };

  return (
    <E2EEContext.Provider value={value}>
      {children}
    </E2EEContext.Provider>
  );
};

export const useE2EE = () => {
  const ctx = useContext(E2EEContext);
  if (!ctx) throw new Error('useE2EE must be used inside <E2EEProvider>');
  return ctx;
};
