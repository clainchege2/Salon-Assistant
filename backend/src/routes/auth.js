const express = require('express');
const { register, login, refreshToken, getMe, fixMyPermissions } = require('../controllers/authController');
const { authLimiter } = require('../middleware/security');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Temporarily disabled rate limiting for testing
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);
router.post('/fix-permissions', protect, fixMyPermissions);

module.exports = router;
