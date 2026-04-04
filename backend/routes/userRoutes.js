const express = require('express');
const router = express.Router();
const {
  searchUsers, getAllUsers, getUserById, getMe, updateProfile, updateSettings, updateAvatar,
  uploadWallpaper, togglePinChat, toggleArchiveChat, addContact
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { upload, multerErrorHandler } = require('../middleware/uploadMiddleware');

router.get('/', protect, getAllUsers);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.patch('/settings', protect, updateSettings);
router.post('/add', protect, addContact);
router.post('/avatar', protect, upload.single('file'), multerErrorHandler, updateAvatar);
router.post('/wallpaper', protect, upload.single('file'), multerErrorHandler, uploadWallpaper);
router.get('/search', protect, searchUsers);
router.get('/:id', protect, getUserById);
router.post('/:id/pin', protect, togglePinChat);
router.post('/:id/archive', protect, toggleArchiveChat);

module.exports = router;
