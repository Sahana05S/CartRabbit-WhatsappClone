const express  = require('express');
const router   = express.Router();
const {
  sendMessage, getMessages, markMessagesAsRead,
  reactToMessage, deleteForMe, deleteForEveryone,
  sendAttachment, forwardMessage,
  toggleStar, getStarredMessages,
  getMessageById,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const upload    = require('../middleware/uploadMiddleware');

router.post('/',                            protect, sendMessage);
router.post('/attachment',                  protect, upload.single('file'), sendAttachment);
router.get('/starred',                      protect, getStarredMessages);   // must be before /:userId
router.get('/info/:messageId',              protect, getMessageById);        // message info panel
router.get('/:userId',                      protect, getMessages);
router.put('/mark-read/:senderId',          protect, markMessagesAsRead);
router.post('/:messageId/react',           protect, reactToMessage);
router.post('/:messageId/forward',         protect, forwardMessage);
router.post('/:messageId/star',            protect, toggleStar);
router.delete('/:messageId/for-me',        protect, deleteForMe);
router.delete('/:messageId/for-everyone',  protect, deleteForEveryone);

module.exports = router;

