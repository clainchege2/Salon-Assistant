const express = require('express');
const router = express.Router();
const {
  send2FACode,
  verify2FACode,
  resend2FACode,
  update2FASettings,
  get2FAStats
} = require('../controllers/twoFactorController');
const { protect } = require('../middleware/auth');

// Public routes (no auth required for registration flow)
router.post('/send', send2FACode);
router.post('/verify', verify2FACode);
router.post('/resend', resend2FACode);

// Protected routes (require authentication)
router.put('/settings', protect, update2FASettings);

module.exports = router;
