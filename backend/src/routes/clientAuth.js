const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getSalons
} = require('../controllers/clientAuthController');
const { protectClient } = require('../middleware/clientAuth');
const { readLimiter } = require('../middleware/security');

const router = express.Router();

// Public routes with rate limiting
router.get('/salons', readLimiter, getSalons); // Add rate limiting
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protectClient, getMe);
router.get('/profile', protectClient, getMe); // Alias for /me
router.put('/profile', protectClient, updateProfile);
router.put('/change-password', protectClient, changePassword);

module.exports = router;
