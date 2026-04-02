const Message = require('../models/Message');
const { getIO } = require('../socket/socketHandler');

// POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'Receiver is required.' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty.' });
    }

    const message = await Message.create({ senderId, receiverId, text: text.trim() });

    const populated = await message.populate([
      { path: 'senderId', select: 'username avatarColor' },
      { path: 'receiverId', select: 'username avatarColor' },
    ]);

    // Emit real-time message to receiver and sender (for multi-device sync)
    const io = getIO();
    io.to(receiverId.toString()).emit('newMessage', populated);
    io.to(senderId.toString()).emit('newMessage', populated);

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};

// GET /api/messages/:userId — fetch conversation between current user and :userId
const getMessages = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { userId: receiverId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('senderId', 'username avatarColor')
      .populate('receiverId', 'username avatarColor');

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
};

module.exports = { sendMessage, getMessages };
