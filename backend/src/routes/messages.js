const express = require('express');
const {
  getTemplates,
  createTemplate,
  sendMessage,
  seedDefaultTemplates
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/templates', getTemplates);
router.post('/templates', createTemplate);
router.post('/templates/seed', seedDefaultTemplates);
router.post('/send', sendMessage);

module.exports = router;
