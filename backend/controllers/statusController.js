const Status = require('../models/Status');
const User = require('../models/User');
const { getIO } = require('../socket/socketHandler');

const createStatus = async (req, res) => {
  try {
    const { type, content, caption, bgColor } = req.body;
    const userId = req.user._id;
    let actualContent = content;

    // Handle file upload case for images/videos
    if (req.file) {
      actualContent = `/uploads/${req.file.filename}`;
    }

    if (!actualContent) {
      return res.status(400).json({ success: false, message: 'Content is required.' });
    }

    let resolvedType = type;
    if (!resolvedType) {
      if (req.file) {
        resolvedType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      } else {
        resolvedType = 'text';
      }
    }

    const statusObj = await Status.create({
      userId,
      type: resolvedType,
      content: actualContent,
      caption: caption || '',
      bgColor: bgColor || '#00a884'
    });

    const populated = await statusObj.populate('userId', 'username avatarColor avatarUrl displayName');

    // Emit event that user has a new status
    getIO().emit('newStatus', populated);

    res.status(201).json({ success: true, status: populated });
  } catch (error) {
    console.error('Create status error:', error);
    res.status(500).json({ success: false, message: 'Failed to create status.' });
  }
};

const getStatuses = async (req, res) => {
  try {
    // Return all unexpired statuses, since we might want to group by user on the frontend
    const statuses = await Status.find({})
      .sort({ createdAt: 1 }) // Ascending by default for stories
      .populate('userId', 'username avatarColor avatarUrl displayName');

    res.json({ success: true, statuses });
  } catch (error) {
    console.error('Get statuses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statuses.' });
  }
};

const deleteStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user._id;

    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ success: false, message: 'Status not found' });

    if (status.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this status.' });
    }

    await status.deleteOne();
    
    getIO().emit('statusDeleted', { statusId, userId });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete status error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete status.' });
  }
};

module.exports = { createStatus, getStatuses, deleteStatus };
