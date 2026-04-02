const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, togglePinChat, toggleArchiveChat } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getAllUsers);
router.get('/:id', protect, getUserById);
router.post('/:id/pin', protect, togglePinChat);
router.post('/:id/archive', protect, toggleArchiveChat);

module.exports = router;
