const express = require('express');
const { sendSlugToEmail } = require('../controllers/slugRecoveryController');
const { readLimiter } = require('../middleware/security');

const router = express.Router();

// Public route - rate limited to prevent abuse
router.post('/send-slug', readLimiter, sendSlugToEmail);

module.exports = router;
