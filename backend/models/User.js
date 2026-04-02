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
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    pinnedChats:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    archivedChats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
