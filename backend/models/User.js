const mongoose = require('mongoose');
const crypto = require('crypto');

const AVATAR_COLORS = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#db2777', '#0891b2'];

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must not exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      // Optional for OAuth users
      required: false,
      minlength: [6, 'Password must be at least 6 characters'],
    },
    googleId: {
      type: String,
      default: null,
      index: true,
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    avatarColor: {
      type: String,
      default: function () {
        return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      },
    },
    displayName: { type: String, trim: true, default: '' },
    avatarUrl:   { type: String, default: null },
    bio:         { type: String, maxlength: 150, default: 'Hey there! I am using NexTalk.' },
    settings: {
      privacy: {
        lastSeen:     { type: Boolean, default: true },
        onlineStatus: { type: Boolean, default: true },
        readReceipts: { type: Boolean, default: true },
      },
      notifications: {
        sounds:  { type: Boolean, default: true },
        desktop: { type: Boolean, default: true },
      },
      chat: {
        enterToSend: { type: Boolean, default: true },
      },
      appearance: {
        chatWallpaper: {
          type: { type: String, enum: ['preset', 'color', 'none', 'custom'], default: 'none' },
          value: { type: String, default: '' },
        }
      }
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    pinnedChats:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    archivedChats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    contacts:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pushSubscriptions: [{
      endpoint: { type: String, required: true },
      keys: {
        auth:    { type: String, required: true },
        p256dh:  { type: String, required: true }
      }
    }],

    // ─── Multi-Factor Authentication (TOTP) ────────────────────────────────────
    // All fields are nullable/off by default so existing users are never affected.

    /**
     * Whether the user has successfully enrolled TOTP-based MFA.
     * Set to true only after the user verifies their first TOTP code.
     */
    mfaEnabled: {
      type: Boolean,
      default: false,
      index: true,           // useful for admin queries / forced-MFA audits
    },

    /**
     * The TOTP shared secret, stored AES-encrypted at rest.
     * Encryption/decryption is handled in the controller (never in the model).
     * Raw value is a base32 string compatible with apps like Google Authenticator.
     * Intentionally excluded from default query projections (select: false).
     */
    mfaSecret: {
      type: String,
      default: null,
      select: false,         // never sent to client accidentally
    },

    /**
     * One-time recovery codes.
     * Each entry is a bcrypt hash of the original code (never stored plain).
     * A code is deleted from this array after it is used once.
     * Recommended: generate 8–12 codes on enrolment.
     */
    mfaRecoveryCodes: {
      type: [String],
      default: [],
      select: false,         // never sent to client accidentally
    },

    /**
     * Timestamp of when MFA was successfully enabled.
     * Useful for compliance, audit logs, and "MFA enabled since" UI labels.
     */
    mfaEnabledAt: {
      type: Date,
      default: null,
    },

    // ─── Forgot Password Fields ──────────────────────────────────────────────
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (15 minutes)
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
