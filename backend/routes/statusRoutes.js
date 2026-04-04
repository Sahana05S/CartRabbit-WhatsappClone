const express = require('express');
const router = express.Router();
const { createStatus, getStatuses, deleteStatus, viewStatus } = require('../controllers/statusController');
const { protect } = require('../middleware/authMiddleware');
const { upload, multerErrorHandler } = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.single('file'), multerErrorHandler, createStatus);
router.get('/', protect, getStatuses);
router.delete('/:statusId', protect, deleteStatus);
router.post('/:statusId/view', protect, viewStatus);

module.exports = router;
