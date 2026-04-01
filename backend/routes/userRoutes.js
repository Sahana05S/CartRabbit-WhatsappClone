const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getAllUsers);
router.get('/:id', protect, getUserById);

module.exports = router;
