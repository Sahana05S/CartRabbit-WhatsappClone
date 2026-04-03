const mongoose = require('mongoose');

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
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
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
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    pinnedChats:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    archivedChats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pushSubscriptions: [{
      endpoint: { type: String, required: true },
      keys: {
        auth:    { type: String, required: true },
        p256dh:  { type: String, required: true }
      }
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
