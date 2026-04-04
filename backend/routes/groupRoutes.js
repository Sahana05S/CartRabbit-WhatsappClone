const express  = require('express');
const router   = express.Router();
const { createGroup, getGroups, getGroupDetails, renameGroup, updateSettings, addMembers, removeMember, leaveGroup } = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');
const { upload, multerErrorHandler } = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.single('avatar'), createGroup, multerErrorHandler);
router.get('/', protect, getGroups);
router.get('/:id', protect, getGroupDetails);
router.put('/:id/rename', protect, renameGroup);
router.put('/:id/settings', protect, updateSettings);
router.put('/:id/members/add', protect, addMembers);
router.put('/:id/members/remove', protect, removeMember);
router.put('/:id/leave', protect, leaveGroup);

module.exports = router;
