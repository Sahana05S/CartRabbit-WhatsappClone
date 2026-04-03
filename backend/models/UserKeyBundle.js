const mongoose = require('mongoose');

/**
 * Stores each user's public identity key bundle for E2EE.
 * Private keys NEVER leave the client; only the SPKI-exported public key is stored here.
 */
const userKeyBundleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // base64url-encoded SubjectPublicKeyInfo (SPKI) of an ECDH P-256 key
    identityKey: {
      type: String,
      required: true,
    },
    // base64url-encoded 16-byte random salt used during HKDF session-key derivation
    sessionSalt: {
      type: String,
      required: true,
    },
    // Incremented each time the user rotates their key pair
    keyVersion: {
      type: Number,
      default: 1,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model('UserKeyBundle', userKeyBundleSchema);
