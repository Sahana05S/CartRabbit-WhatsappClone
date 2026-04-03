const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function() {
        return this.chatType === 'direct';
      },
    },
    chatType: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct',
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      index: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      default: '',
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'audio'],
      default: 'text',
    },
    attachment: {
      fileUrl:   { type: String,  default: null },
      fileName:  { type: String,  default: null },
      mimeType:  { type: String,  default: null },
      fileSize:  { type: Number,  default: null },  // bytes
      duration:  { type: Number,  default: null },  // seconds for audio
    },
    replyTo: {
      messageId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
      senderId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    default: null },
      senderName:  { type: String,  default: null },
      previewText: { type: String,  maxlength: 200, default: null },
      messageType: { type: String,  default: 'text' },
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    readAt: { type: Date, default: null }, // for direct messages
    readBy: [ // for group messages ("Seen by")
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      }
    ],
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        emoji: {
          type: String,
          required: true
        }
      }
    ],
    isDeletedForEveryone: { type: Boolean, default: false },
    deletedFor:           [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    deletedBy:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt:            { type: Date, default: null },
    isForwarded:          { type: Boolean, default: false },
    starredBy:            [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Compound indexes for fast conversation lookups in both directions
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
messageSchema.index({ receiverId: 1, senderId: 1, createdAt: 1 });
// Index for group queries
messageSchema.index({ groupId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
