const mongoose = require('mongoose');

const StatusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video'],
    required: true,
  },
  content: {
    type: String, // String for text, or URL for image/video
    required: true,
  },
  caption: {
    type: String,
    default: '',
  },
  bgColor: {
    type: String, // used if type === 'text'
    default: '#00a884',
  },
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // MongoDB TTL index: 24 hours in seconds
  }
});

module.exports = mongoose.model('Status', StatusSchema);
