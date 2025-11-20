const express = require('express');
const { register, login, refreshToken, getMe, fixMyPermissions, logout } = require('../controllers/authController');
const { authLimiter } = require('../middleware/security');
const { protect } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLogger');

const router = express.Router();

// Apply rate limiting and audit logging to auth endpoints
router.post('/register', authLimiter, auditLog('Auth'), register);
router.post('/login', authLimiter, auditLog('Auth'), login);
router.post('/logout', protect, auditLog('Auth'), logout);
router.post('/refresh', auditLog('Auth'), refreshToken);
router.get('/me', protect, getMe);
router.post('/fix-permissions', protect, auditLog('Auth', { sensitive: true }), fixMyPermissions);

module.exports = router;
