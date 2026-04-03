const User = require('../models/User');
const Message = require('../models/Message');

// GET /api/users — all users except the logged-in user
const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    const currentUserDoc = await User.findById(currentUserId).select('pinnedChats archivedChats');
    const pinnedSet = new Set((currentUserDoc.pinnedChats || []).map(id => id.toString()));
    const archivedSet = new Set((currentUserDoc.archivedChats || []).map(id => id.toString()));

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
        isPinned: pinnedSet.has(user._id.toString()),
        isArchived: archivedSet.has(user._id.toString()),
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

// POST /api/users/:id/pin
const togglePinChat = async (req, res) => {
  try {
    const userIdToPin = req.params.id;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) return res.status(404).json({ success: false, message: 'User not found.' });

    const isPinned = currentUser.pinnedChats.some(id => id.toString() === userIdToPin);
    if (isPinned) {
      currentUser.pinnedChats = currentUser.pinnedChats.filter(id => id.toString() !== userIdToPin);
    } else {
      currentUser.pinnedChats.push(userIdToPin);
    }
    await currentUser.save();
    
    res.json({ success: true, isPinned: !isPinned });
  } catch (error) {
    console.error('Toggle pin chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to pin/unpin chat.' });
  }
};

// POST /api/users/:id/archive
const toggleArchiveChat = async (req, res) => {
  try {
    const userIdToArchive = req.params.id;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) return res.status(404).json({ success: false, message: 'User not found.' });

    const isArchived = currentUser.archivedChats.some(id => id.toString() === userIdToArchive);
    if (isArchived) {
      currentUser.archivedChats = currentUser.archivedChats.filter(id => id.toString() !== userIdToArchive);
    } else {
      currentUser.archivedChats.push(userIdToArchive);
    }
    await currentUser.save();
    
    res.json({ success: true, isArchived: !isArchived });
  } catch (error) {
    console.error('Toggle archive chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to archive/unarchive chat.' });
  }
};

// GET /api/users/me — current user with all fields populated
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
};

// PATCH /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { displayName, bio } = req.body;
    const user = await User.findById(req.user._id);

    if (displayName !== undefined) user.displayName = displayName.trim().substring(0, 50);
    if (bio !== undefined)         user.bio         = bio.trim().substring(0, 150);

    await user.save();
    const updated = await User.findById(user._id).select('-password');
    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// PATCH /api/users/settings
const updateSettings = async (req, res) => {
  try {
    const { privacy, notifications, chat, appearance } = req.body;
    const user = await User.findById(req.user._id);

    if (privacy)       user.settings.privacy       = { ...user.settings.privacy.toObject(),       ...privacy       };
    if (notifications) user.settings.notifications = { ...user.settings.notifications.toObject(), ...notifications };
    if (chat)          user.settings.chat          = { ...user.settings.chat.toObject(),          ...chat          };
    if (appearance)    user.settings.appearance    = { ...(user.settings.appearance?.toObject ? user.settings.appearance.toObject() : user.settings.appearance), ...appearance };

    await user.save();
    const updated = await User.findById(user._id).select('-password');
    res.json({ success: true, user: updated });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
};

// POST /api/users/avatar
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl },
      { new: true }
    ).select('-password');

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upload avatar.' });
  }
};

// POST /api/users/wallpaper
const uploadWallpaper = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const wallpaperUrl = `/uploads/${req.file.filename}`;
    const user = await User.findById(req.user._id);
    
    user.settings.appearance = { 
      ...(user.settings.appearance?.toObject ? user.settings.appearance.toObject() : user.settings.appearance), 
      chatWallpaper: { type: 'custom', value: wallpaperUrl } 
    };

    await user.save();
    const updated = await User.findById(user._id).select('-password');
    res.json({ success: true, user: updated });
  } catch (error) {
    console.error('Wallpaper upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload wallpaper.' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getMe,
  updateProfile,
  updateSettings,
  updateAvatar,
  uploadWallpaper,
  togglePinChat,
  toggleArchiveChat
};
