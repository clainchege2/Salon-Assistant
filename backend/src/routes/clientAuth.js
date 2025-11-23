const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getSalons,
  verify2FA,
  resend2FA
} = require('../controllers/clientAuthController');
const { protectClient } = require('../middleware/clientAuth');
const { readLimiter, authLimiter } = require('../middleware/security');
const { auditLog } = require('../middleware/auditLogger');

const router = express.Router();

// Public routes with rate limiting and audit logging
router.get('/salons', readLimiter, getSalons);
router.post('/register', authLimiter, auditLog('ClientAuth'), register);
router.post('/login', authLimiter, auditLog('ClientAuth'), login);
router.post('/verify', authLimiter, auditLog('ClientAuth'), verify2FA);
router.post('/resend', authLimiter, auditLog('ClientAuth'), resend2FA);

// Protected routes
router.get('/me', protectClient, getMe);
router.get('/profile', protectClient, getMe); // Alias for /me
router.put('/profile', protectClient, auditLog('ClientAuth'), updateProfile);
router.put('/change-password', protectClient, auditLog('ClientAuth', { sensitive: true }), changePassword);

module.exports = router;
