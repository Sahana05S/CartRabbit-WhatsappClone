const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, markMessagesAsRead } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, sendMessage);
router.get('/:userId', protect, getMessages);
router.put('/mark-read/:senderId', protect, markMessagesAsRead);

module.exports = router;
