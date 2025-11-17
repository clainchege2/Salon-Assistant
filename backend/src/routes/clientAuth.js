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

const router = express.Router();

// Public routes
router.get('/salons', getSalons);
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protectClient, getMe);
router.put('/profile', protectClient, updateProfile);
router.put('/change-password', protectClient, changePassword);

module.exports = router;
