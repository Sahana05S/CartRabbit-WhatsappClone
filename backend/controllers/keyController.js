const UserKeyBundle = require('../models/UserKeyBundle');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE64_RE = /^[A-Za-z0-9+/\-_]+=*$/;

function isValidBase64(str) {
  if (typeof str !== 'string' || str.length < 8) return false;
  // Accept standard and URL-safe base64
  return BASE64_RE.test(str);
}

// ─── POST /api/keys/upload ────────────────────────────────────────────────────
/**
 * Upload or refresh the calling user's public key bundle.
 * Expects: { identityKey: string, sessionSalt: string }
 * The server performs NO cryptographic operations — it only stores and distributes
 * the public key for other users to fetch during session establishment.
 */
const uploadKeyBundle = async (req, res) => {
  try {
    const { identityKey, sessionSalt } = req.body;

    if (!identityKey || !sessionSalt) {
      return res.status(400).json({
        success: false,
        message: 'identityKey and sessionSalt are required.',
      });
    }

    if (!isValidBase64(identityKey) || !isValidBase64(sessionSalt)) {
      return res.status(400).json({
        success: false,
        message: 'identityKey and sessionSalt must be valid base64 strings.',
      });
    }

    const userId = req.user._id;

    const existing = await UserKeyBundle.findOne({ userId });

    if (existing) {
      existing.identityKey = identityKey;
      existing.sessionSalt = sessionSalt;
      existing.keyVersion  = (existing.keyVersion || 1) + 1;
      existing.uploadedAt  = new Date();
      await existing.save();

      return res.json({
        success: true,
        message: 'Key bundle updated.',
        keyVersion: existing.keyVersion,
      });
    }

    const bundle = await UserKeyBundle.create({ userId, identityKey, sessionSalt });

    res.status(201).json({
      success: true,
      message: 'Key bundle uploaded.',
      keyVersion: bundle.keyVersion,
    });
  } catch (err) {
    console.error('uploadKeyBundle error:', err);
    res.status(500).json({ success: false, message: 'Failed to upload key bundle.' });
  }
};

// ─── GET /api/keys/me ─────────────────────────────────────────────────────────
/**
 * Fetch the calling user's own key bundle (useful to verify upload succeeded).
 */
const getMyKeyBundle = async (req, res) => {
  try {
    const bundle = await UserKeyBundle.findOne({ userId: req.user._id });

    if (!bundle) {
      return res.status(404).json({ success: false, message: 'No key bundle found.' });
    }

    res.json({
      success: true,
      bundle: {
        identityKey: bundle.identityKey,
        sessionSalt: bundle.sessionSalt,
        keyVersion:  bundle.keyVersion,
        uploadedAt:  bundle.uploadedAt,
      },
    });
  } catch (err) {
    console.error('getMyKeyBundle error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch key bundle.' });
  }
};

// ─── GET /api/keys/:userId ────────────────────────────────────────────────────
/**
 * Fetch another user's public key bundle for session establishment.
 * Returns ONLY the public key and salt — never any private material.
 */
const getPeerKeyBundle = async (req, res) => {
  try {
    const { userId } = req.params;
    const bundle = await UserKeyBundle.findOne({ userId });

    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: 'This user has not set up encrypted messaging yet.',
        code: 'NO_KEY_BUNDLE',
      });
    }

    res.json({
      success: true,
      bundle: {
        userId:      userId,
        identityKey: bundle.identityKey,
        sessionSalt: bundle.sessionSalt,
        keyVersion:  bundle.keyVersion,
      },
    });
  } catch (err) {
    console.error('getPeerKeyBundle error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch peer key bundle.' });
  }
};

module.exports = { uploadKeyBundle, getMyKeyBundle, getPeerKeyBundle };
