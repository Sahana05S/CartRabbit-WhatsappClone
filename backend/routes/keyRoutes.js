const express = require('express');
const router  = express.Router();
const { uploadKeyBundle, getMyKeyBundle, getPeerKeyBundle } = require('../controllers/keyController');
const { protect } = require('../middleware/authMiddleware');

// All key routes require authentication
router.post('/upload',    protect, uploadKeyBundle);
router.get('/me',         protect, getMyKeyBundle);
router.get('/:userId',    protect, getPeerKeyBundle);

module.exports = router;
