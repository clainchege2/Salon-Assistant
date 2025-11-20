const express = require('express');
const { register, login, refreshToken, getMe, fixMyPermissions, logout } = require('../controllers/authController');
const { authLimiter } = require('../middleware/security');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply rate limiting to auth endpoints
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', protect, logout);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);
router.post('/fix-permissions', protect, fixMyPermissions);

module.exports = router;
