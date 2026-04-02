const Message = require('../models/Message');
const { getIO } = require('../socket/socketHandler');

// POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { receiverId, text, replyTo } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'Receiver is required.' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty.' });
    }

    const messageData = { senderId, receiverId, text: text.trim() };

    // Attach reply metadata if provided
    if (replyTo && replyTo.messageId) {
      messageData.replyTo = {
        messageId:   replyTo.messageId,
        senderId:    replyTo.senderId,
        senderName:  replyTo.senderName  || '',
        previewText: (replyTo.previewText || '').substring(0, 200),
        messageType: replyTo.messageType || 'text',
      };
    }

    const message = await Message.create(messageData);

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
      // Exclude messages the requester deleted for themselves
      deletedFor: { $ne: senderId },
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

// PUT /api/messages/mark-read/:senderId
const markMessagesAsRead = async (req, res) => {
  try {
    const receiverId = req.user._id;
    const senderId = req.params.senderId;
    const now = new Date();

    await Message.updateMany(
      { senderId, receiverId, status: { $ne: 'read' } },
      { $set: { status: 'read', readAt: now } }
    );

    // Emit socket event to sender so their UI updates (include readAt for seen timestamp)
    const io = getIO();
    io.to(senderId.toString()).emit('messagesRead', { 
      receiverId: receiverId.toString(),
      readAt: now.toISOString(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark messages as read.' });
  }
};

// POST /api/messages/:messageId/react
const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ success: false, message: 'Emoji is required.' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    // Authorization check
    if (message.senderId.toString() !== userId.toString() && message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const existingReactionIndex = message.reactions.findIndex(r => r.userId.toString() === userId.toString());
    
    if (existingReactionIndex > -1) {
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        // Toggle off if same emoji clicked
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Update reaction
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      // Add new reaction
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    // Emit socket event to both sender and receiver
    const io = getIO();
    const payload = { messageId, reactions: message.reactions };
    io.to(message.senderId.toString()).emit('messageReaction', payload);
    if (message.senderId.toString() !== message.receiverId.toString()) {
      io.to(message.receiverId.toString()).emit('messageReaction', payload);
    }

    res.json({ success: true, reactions: message.reactions });
  } catch (error) {
    console.error('React to message error:', error);
    res.status(500).json({ success: false, message: 'Failed to react to message.' });
  }
};

// DELETE /api/messages/:messageId/for-me
const deleteForMe = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });

    // Must be a participant
    if (message.senderId.toString() !== userId.toString() && message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Idempotent — add only if not already present
    if (!message.deletedFor.map(id => id.toString()).includes(userId.toString())) {
      message.deletedFor.push(userId);
      await message.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete for me error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message.' });
  }
};

// DELETE /api/messages/:messageId/for-everyone
const deleteForEveryone = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });

    // Only the sender can delete for everyone
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the sender can delete for everyone.' });
    }

    message.isDeletedForEveryone = true;
    message.deletedBy = userId;
    message.deletedAt = new Date();
    await message.save();

    // Emit to both participants so their UI updates instantly
    const io = getIO();
    const payload = { messageId: message._id.toString() };
    io.to(message.senderId.toString()).emit('messageDeletedForEveryone', payload);
    io.to(message.receiverId.toString()).emit('messageDeletedForEveryone', payload);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete for everyone error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message.' });
  }
};

// POST /api/messages/attachment
const sendAttachment = async (req, res) => {
  try {
    const { receiverId, caption, replyTo: replyToRaw } = req.body;
    const senderId = req.user._id;
    const file     = req.file;

    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'Receiver is required.' });
    }
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const isImage = file.mimetype.startsWith('image/');
    const fileUrl = `/uploads/${file.filename}`;

    const messageData = {
      senderId,
      receiverId,
      text:        caption ? caption.trim().substring(0, 200) : '',
      messageType: isImage ? 'image' : 'file',
      attachment: {
        fileUrl,
        fileName:  file.originalname,
        mimeType:  file.mimetype,
        fileSize:  file.size,
      },
    };

    // Attach reply metadata if provided
    if (replyToRaw) {
      const rt = typeof replyToRaw === 'string' ? JSON.parse(replyToRaw) : replyToRaw;
      if (rt.messageId) {
        messageData.replyTo = {
          messageId:   rt.messageId,
          senderId:    rt.senderId,
          senderName:  rt.senderName  || '',
          previewText: (rt.previewText || '').substring(0, 200),
          messageType: rt.messageType || 'text',
        };
      }
    }

    const message  = await Message.create(messageData);
    const populated = await message.populate([
      { path: 'senderId',   select: 'username avatarColor' },
      { path: 'receiverId', select: 'username avatarColor' },
    ]);

    const io = getIO();
    io.to(receiverId.toString()).emit('newMessage', populated);
    io.to(senderId.toString()).emit('newMessage', populated);

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    console.error('Send attachment error:', error);
    res.status(500).json({ success: false, message: 'Failed to send attachment.' });
  }
};

// POST /api/messages/:messageId/forward
const forwardMessage = async (req, res) => {
  try {
    const { messageId }   = req.params;
    const { receiverIds } = req.body;   // array of user IDs to forward to
    const senderId        = req.user._id;

    if (!receiverIds || !Array.isArray(receiverIds) || receiverIds.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one recipient is required.' });
    }

    // Find the original message
    const original = await Message.findById(messageId);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Original message not found.' });
    }

    // Block forwarding deleted messages
    if (original.isDeletedForEveryone) {
      return res.status(400).json({ success: false, message: 'Cannot forward a deleted message.' });
    }

    // Must be a participant in the original chat
    if (
      original.senderId.toString() !== senderId.toString() &&
      original.receiverId.toString() !== senderId.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to forward this message.' });
    }

    const io = getIO();
    const forwardedMessages = [];

    for (const receiverId of receiverIds) {
      const messageData = {
        senderId,
        receiverId,
        messageType:  original.messageType,
        text:         original.text || '',
        isForwarded:  true,
      };

      // Copy attachment metadata for image/file forwards (reuse same file URL)
      if ((original.messageType === 'image' || original.messageType === 'file') && original.attachment?.fileUrl) {
        messageData.attachment = {
          fileUrl:  original.attachment.fileUrl,
          fileName: original.attachment.fileName,
          mimeType: original.attachment.mimeType,
          fileSize: original.attachment.fileSize,
        };
      }

      const newMessage  = await Message.create(messageData);
      const populated   = await newMessage.populate([
        { path: 'senderId',   select: 'username avatarColor' },
        { path: 'receiverId', select: 'username avatarColor' },
      ]);

      // Emit to both parties
      io.to(receiverId.toString()).emit('newMessage', populated);
      io.to(senderId.toString()).emit('newMessage', populated);

      forwardedMessages.push(populated);
    }

    res.status(201).json({ success: true, messages: forwardedMessages });
  } catch (error) {
    console.error('Forward message error:', error);
    res.status(500).json({ success: false, message: 'Failed to forward message.' });
  }
};

// POST /api/messages/:messageId/star  — toggle star for current user
const toggleStar = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId        = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });

    // Must be a participant
    if (message.senderId.toString() !== userId.toString() && message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const alreadyStarred = message.starredBy.map(id => id.toString()).includes(userId.toString());
    if (alreadyStarred) {
      message.starredBy = message.starredBy.filter(id => id.toString() !== userId.toString());
    } else {
      message.starredBy.push(userId);
    }
    await message.save();

    res.json({ success: true, isStarred: !alreadyStarred });
  } catch (error) {
    console.error('Toggle star error:', error);
    res.status(500).json({ success: false, message: 'Failed to update star.' });
  }
};

// GET /api/messages/starred  — fetch all messages starred by current user
const getStarredMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.query;

    const query = { starredBy: userId, isDeletedForEveryone: false };

    if (chatId) {
       query.$or = [
        { senderId: userId, receiverId: chatId },
        { senderId: chatId, receiverId: userId },
      ];
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .populate('senderId',   'username avatarColor')
      .populate('receiverId', 'username avatarColor');

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get starred messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch starred messages.' });
  }
};

// GET /api/messages/info/:messageId — full metadata for Message Info panel
const getMessageById = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId)
      .populate('senderId',   'username avatarColor')
      .populate('receiverId', 'username avatarColor');

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    // Only participants may view message info
    const senderId_   = message.senderId?._id?.toString()   ?? message.senderId?.toString();
    const receiverId_ = message.receiverId?._id?.toString() ?? message.receiverId?.toString();
    if (userId.toString() !== senderId_ && userId.toString() !== receiverId_) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    res.json({ success: true, message });
  } catch (error) {
    console.error('Get message by id error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch message info.' });
  }
};

module.exports = {
  sendMessage, getMessages, markMessagesAsRead,
  reactToMessage, deleteForMe, deleteForEveryone,
  sendAttachment, forwardMessage,
  toggleStar, getStarredMessages,
  getMessageById,
};

