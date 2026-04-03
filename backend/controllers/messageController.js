const Message = require('../models/Message');
const User = require('../models/User');
const { getIO } = require('../socket/socketHandler');
const { sendPushNotification, getMessagePreview } = require('../utils/notificationUtils');

// POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { receiverId, text, replyTo, isGroup, giphy, messageType, isE2EE, e2ee } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'Receiver/Group is required.' });
    }

    const isGifOrSticker = messageType === 'gif' || messageType === 'sticker';
    // For E2EE messages the text field is intentionally empty; content is in the e2ee envelope.
    const hasTextContent = text && text.trim();
    if (!isGifOrSticker && !isE2EE && !hasTextContent) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty.' });
    }

    // Validate E2EE envelope when flag is set
    if (isE2EE) {
      if (!e2ee || !e2ee.iv || !e2ee.ciphertext || !e2ee.version) {
        return res.status(400).json({
          success: false,
          message: 'Encrypted message is missing required e2ee fields (iv, ciphertext, version).',
        });
      }
    }

    const messageData = {
      senderId,
      text: isE2EE ? '' : (text ? text.trim() : ''),
      messageType: messageType || 'text',
      giphy: giphy || null,
      isE2EE: !!isE2EE,
    };

    // Attach E2EE envelope — stored as opaque payload, server never reads content
    if (isE2EE && e2ee) {
      messageData.e2ee = {
        version:    e2ee.version,
        algorithm:  e2ee.algorithm || 'AES-GCM-256',
        iv:         e2ee.iv,
        ciphertext: e2ee.ciphertext,
        aad:        e2ee.aad || null,
      };
    }

    if (isGroup) {
      messageData.chatType = 'group';
      messageData.groupId = receiverId;
    } else {
      messageData.receiverId = receiverId;
    }

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

    // Emit real-time message
    const io = getIO();
    if (isGroup) {
      io.to(receiverId.toString()).emit('newMessage', populated);
    } else {
      io.to(receiverId.toString()).emit('newMessage', populated);
      io.to(senderId.toString()).emit('newMessage', populated);

      // Trigger Push Notification — body must never contain plaintext for E2EE messages
      const recipient = await User.findById(receiverId);
      if (recipient) {
        sendPushNotification(recipient, {
          title: req.user.displayName || req.user.username,
          body:  isE2EE ? '🔒 New encrypted message' : getMessagePreview(populated),
          senderId: senderId.toString()
        });
      }
    }

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
    const { userId: targetId } = req.params;
    const { isGroup } = req.query;

    let query = { deletedFor: { $ne: senderId } };
    if (isGroup === 'true') {
      query.chatType = 'group';
      query.groupId = targetId;
    } else {
      query.chatType = 'direct';
      query.$or = [
        { senderId, receiverId: targetId },
        { senderId: targetId, receiverId: senderId },
      ];
    }

    const messages = await Message.find(query)
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
    const userId = req.user._id;
    const targetId = req.params.senderId;
    const { isGroup } = req.query;
    const now = new Date();

    const io = getIO();

    if (isGroup === 'true') {
      // Mark group messages as read
      const messagesToUpdate = await Message.find({
        groupId: targetId,
        senderId: { $ne: userId },
        'readBy.user': { $ne: userId }
      });
      
      if (messagesToUpdate.length > 0) {
        await Message.updateMany(
          { _id: { $in: messagesToUpdate.map(m => m._id) } },
          { $push: { readBy: { user: userId, readAt: now } } }
        );
        io.to(targetId).emit('groupMessageRead', { groupId: targetId, userId: userId });
      }
    } else {
      // Direct message logic
      await Message.updateMany(
        { senderId: targetId, receiverId: userId, status: { $ne: 'read' } },
        { $set: { status: 'read', readAt: now } }
      );
      io.to(targetId.toString()).emit('messagesRead', { 
        receiverId: userId.toString(),
        readAt: now.toISOString(),
      });
    }

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
    if (message.chatType !== 'group') {
      if (message.senderId.toString() !== userId.toString() && message.receiverId.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized.' });
      }
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

    const io = getIO();
    const payload = { messageId, reactions: message.reactions };
    
    if (message.chatType === 'group') {
      io.to(message.groupId.toString()).emit('messageReaction', payload);
    } else {
      io.to(message.senderId.toString()).emit('messageReaction', payload);
      if (message.senderId.toString() !== message.receiverId.toString()) {
        io.to(message.receiverId.toString()).emit('messageReaction', payload);
      }
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
    if (message.chatType !== 'group') {
      if (message.senderId.toString() !== userId.toString() && message.receiverId.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized.' });
      }
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

    // Emit to participants so their UI updates instantly
    const io = getIO();
    const payload = { messageId: message._id.toString() };
    if (message.chatType === 'group') {
      io.to(message.groupId.toString()).emit('messageDeletedForEveryone', payload);
    } else {
      io.to(message.senderId.toString()).emit('messageDeletedForEveryone', payload);
      io.to(message.receiverId.toString()).emit('messageDeletedForEveryone', payload);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete for everyone error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message.' });
  }
};

// POST /api/messages/attachment
const sendAttachment = async (req, res) => {
  try {
    const { receiverId, caption, replyTo: replyToRaw, isGroup, duration } = req.body;
    const senderId = req.user._id;
    const file     = req.file;

    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'Receiver/Group is required.' });
    }
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const isImage = file.mimetype.startsWith('image/');
    const isAudio = file.mimetype.startsWith('audio/') || (file.mimetype === 'video/webm' && !caption); 
    const fileUrl = `/uploads/${file.filename}`;

    const messageData = {
      senderId,
      text:        caption ? caption.trim().substring(0, 200) : '',
      messageType: isImage ? 'image' : (isAudio ? 'audio' : 'file'),
      attachment: {
        fileUrl,
        fileName:  file.originalname,
        mimeType:  file.mimetype,
        fileSize:  file.size,
        duration:  duration ? parseFloat(duration) : null,
      },
    };

    if (isGroup) {
      messageData.chatType = 'group';
      messageData.groupId = receiverId;
    } else {
      messageData.receiverId = receiverId;
    }

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
    if (isGroup) {
      io.to(receiverId.toString()).emit('newMessage', populated);
    } else {
      io.to(receiverId.toString()).emit('newMessage', populated);
      io.to(senderId.toString()).emit('newMessage', populated);

      // Trigger Push Notification for direct messages
      const recipient = await User.findById(receiverId);
      if (recipient) {
        sendPushNotification(recipient, {
          title: req.user.displayName || req.user.username,
          body:  getMessagePreview(populated),
          senderId: senderId.toString()
        });
      }
    }

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

    // Block forwarding E2EE messages: the ciphertext is session-specific and
    // cannot be decrypted by a different recipient. The client should prevent this,
    // but we enforce it server-side as a safety net.
    if (original.isE2EE) {
      return res.status(400).json({
        success: false,
        message: 'Encrypted messages cannot be forwarded. The encryption is specific to the original conversation.',
        code: 'E2EE_FORWARD_BLOCKED',
      });
    }

    // Must be a participant in the original chat
    if (original.chatType !== 'group') {
      if (
        original.senderId.toString() !== senderId.toString() &&
        original.receiverId?.toString() !== senderId.toString()
      ) {
        return res.status(403).json({ success: false, message: 'Not authorized to forward this message.' });
      }
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
          duration: original.attachment.duration,
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
    if (message.chatType !== 'group') {
      if (message.senderId.toString() !== userId.toString() && message.receiverId?.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized.' });
      }
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
      // Assuming chatId here is a direct chat. In a real system, you'd check query.isGroup too for starred group messages
      query.$or = [
        { senderId: userId, receiverId: chatId },
        { senderId: chatId, receiverId: userId },
        { groupId: chatId } // safely handles if chatId happened to be a group
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

// GET /api/messages/media/:userId — paginated media (images / videos / files)
const getMediaMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { userId: otherId } = req.params;
    const { isGroup, type = 'image', page = 1, limit = 24 } = req.query;

    const pageNum  = Math.max(1, parseInt(page,  10) || 1);
    const limitNum = Math.min(50, parseInt(limit, 10) || 24);
    const skip     = (pageNum - 1) * limitNum;

    // Base query — only messages between these two users or in this group that have an attachment
    const base = {
      deletedFor:           { $ne: userId },
      isDeletedForEveryone: false,
      'attachment.fileUrl': { $ne: null },
    };

    if (isGroup === 'true') {
      base.chatType = 'group';
      base.groupId = otherId;
    } else {
      base.chatType = 'direct';
      base.$or = [
        { senderId: userId, receiverId: otherId },
        { senderId: otherId, receiverId: userId },
      ];
    }

    // Type-specific filter
    if (type === 'image') {
      base.messageType = 'image';
    } else if (type === 'video') {
      // Videos are stored as 'file' with a video/* mimeType
      base.messageType = 'file';
      base['attachment.mimeType'] = /^video\//;
    } else {
      // Files = non-image, non-video files
      base.messageType = 'file';
      base['attachment.mimeType'] = { $not: /^video\// };
    }

    const [messages, totalCount] = await Promise.all([
      Message.find(base)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('senderId',   'username avatarColor')
        .populate('receiverId', 'username avatarColor')
        .lean(),
      Message.countDocuments(base),
    ]);

    res.json({
      success:    true,
      messages,
      page:       pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      totalCount,
    });
  } catch (error) {
    console.error('Get media messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch media.' });
  }
};

// GET /api/messages/info/:messageId — full metadata for Message Info panel
const getMessageById = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId)
      .populate('senderId',   'username avatarColor')
      .populate('receiverId', 'username avatarColor')
      .populate('readBy.user', 'username avatarColor');

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    // Only participants may view message info
    if (message.chatType !== 'group') {
      const senderId_   = message.senderId?._id?.toString()   ?? message.senderId?.toString();
      const receiverId_ = message.receiverId?._id?.toString() ?? message.receiverId?.toString();
      if (userId.toString() !== senderId_ && userId.toString() !== receiverId_) {
        return res.status(403).json({ success: false, message: 'Not authorized.' });
      }
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
  getMediaMessages,
};

