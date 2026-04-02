const User = require('../models/User');
const Message = require('../models/Message');

// GET /api/users — all users except the logged-in user
const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    let users = await User.find({ _id: { $ne: currentUserId } })
      .select('-password')
      .lean();

    users = await Promise.all(users.map(async (user) => {
      const lastMessage = await Message.findOne({
        $or: [
          { senderId: currentUserId, receiverId: user._id },
          { senderId: user._id, receiverId: currentUserId },
        ],
      }).sort({ createdAt: -1 }).lean();

      return {
        ...user,
        lastMessage: lastMessage || null
      };
    }));

    users.sort((a, b) => {
      const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      if (dateA !== dateB) return dateB - dateA;
      return a.username.localeCompare(b.username);
    });

    res.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user.' });
  }
};

module.exports = { getAllUsers, getUserById };
