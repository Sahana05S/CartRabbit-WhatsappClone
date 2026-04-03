const Group = require('../models/Group');
const User = require('../models/User');
const { getIO } = require('../socket/socketHandler');

// POST /api/groups - Create a group
const createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const userId = req.user._id;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    // Ensure creator is in the members array and uniquely parsed
    const memberSet = new Set(members || []);
    memberSet.add(userId.toString());
    const memberArray = Array.from(memberSet);

    // Group needs at least 2 people (creator + 1)
    if (memberArray.length < 2) {
      return res.status(400).json({ success: false, message: 'Group must have at least 2 members' });
    }

    const group = await Group.create({
      name,
      description: description || '',
      members: memberArray,
      admins: [userId],
      createdBy: userId,
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'username avatarColor')
      .populate('admins', 'username avatarColor')
      .populate('createdBy', 'username avatarColor');

    // Notify all members that a group was created so they can join the room client-side
    // or just emit 'groupCreated' to their personal rooms
    const io = getIO();
    memberArray.forEach((memberId) => {
      io.to(memberId).emit('groupCreated', populatedGroup);
    });

    res.status(201).json({ success: true, group: populatedGroup });
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ success: false, message: 'Failed to create group.' });
  }
};

// GET /api/groups - Get all groups for current user
const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    let groups = await Group.find({ members: userId })
      .populate('members', 'username avatarColor lastSeen')
      .populate('admins', 'username avatarColor')
      .lean();

    const Message = require('../models/Message');

    groups = await Promise.all(groups.map(async (group) => {
      const lastMessage = await Message.findOne({ groupId: group._id })
        .sort({ createdAt: -1 })
        .lean();
      
      return {
        ...group,
        isGroup: true,
        // Using "username" to map to the UI cleanly
        username: group.name,
        lastMessage: lastMessage || null,
        isPinned: false, // Could implement pinned groups later
        isArchived: false,
      };
    }));

    groups.sort((a, b) => {
      const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    res.json({ success: true, groups });
  } catch (err) {
    console.error('Get groups error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch groups.' });
  }
};

// GET /api/groups/:id - Get specific group details
const getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'username avatarColor lastSeen')
      .populate('admins', 'username avatarColor');
      
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    // Check if user is a member
    if (!group.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, group });
  } catch (err) {
    console.error('Get group details error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch group details.' });
  }
};

// PUT /api/groups/:id/rename - Rename group
const renameGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user._id.toString();
    
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    if (!group.members.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check permissions
    const isAdmin = group.admins.includes(userId);
    if (group.settings.editGroupInfo === 'admins' && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can rename this group.' });
    }

    group.name = name;
    await group.save();

    const io = getIO();
    io.to(group._id.toString()).emit('groupUpdated', { groupId: group._id, name: group.name });

    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to rename group.' });
  }
};

// PUT /api/groups/:id/settings - Update group settings (admins only)
const updateSettings = async (req, res) => {
  try {
    const { editGroupInfo } = req.body;
    const userId = req.user._id.toString();
    
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    if (!group.admins.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Only admins can change settings.' });
    }

    if (editGroupInfo && ['all', 'admins'].includes(editGroupInfo)) {
      group.settings.editGroupInfo = editGroupInfo;
    }
    
    await group.save();

    const io = getIO();
    io.to(group._id.toString()).emit('groupUpdated', { groupId: group._id, settings: group.settings });

    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
};

// PUT /api/groups/:id/members/add - Add members (admins only usually)
const addMembers = async (req, res) => {
  try {
    const { userIds } = req.body; // array
    const userId = req.user._id.toString();
    
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    if (!group.admins.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Only admins can add members.' });
    }

    const newMembers = userIds.filter(id => !group.members.includes(id));
    if (newMembers.length === 0) {
       return res.status(400).json({ success: false, message: 'Users are already in the group.' });
    }

    group.members.push(...newMembers);
    await group.save();

    const populatedGroup = await Group.findById(group._id).populate('members', 'username avatarColor');

    const io = getIO();
    // Emit to room
    io.to(group._id.toString()).emit('groupUpdated', populatedGroup);
    
    // Notify new members they were added
    newMembers.forEach(id => {
      io.to(id).emit('groupCreated', populatedGroup);
    });

    res.json({ success: true, group: populatedGroup });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add members.' });
  }
};

// PUT /api/groups/:id/members/remove - Remove members (admins only)
const removeMember = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user._id.toString();
    
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    if (!group.admins.includes(userId)) {
      return res.status(403).json({ success: false, message: 'Only admins can remove members.' });
    }

    // Cannot remove creator if we wanted to be strict, but any admin can remove anyone (or only creator?). 
    // Usually WhatsApp: anyone admin can remove anyone.
    
    group.members = group.members.filter(id => id.toString() !== targetUserId);
    group.admins = group.admins.filter(id => id.toString() !== targetUserId);

    await group.save();

    const io = getIO();
    io.to(group._id.toString()).emit('groupUpdated', await Group.findById(group._id).populate('members', 'username avatarColor'));
    
    // Notify the removed user
    io.to(targetUserId).emit('groupRemoved', { groupId: group._id });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove member.' });
  }
};

// PUT /api/groups/:id/leave - Leave group
const leaveGroup = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    group.members = group.members.filter(id => id.toString() !== userId);
    group.admins = group.admins.filter(id => id.toString() !== userId);

    await group.save();

    const io = getIO();
    io.to(group._id.toString()).emit('groupUpdated', await Group.findById(group._id).populate('members', 'username avatarColor'));

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to leave group.' });
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroupDetails,
  renameGroup,
  updateSettings,
  addMembers,
  removeMember,
  leaveGroup
};
