const express = require('express');
const {
  createCommunication,
  getCommunications,
  replyCommunication,
  markAsRead,
  resolveCommunication,
  receiveIncomingMessage,
  warnClient,
  blockClient,
  unblockClient,
  getFeedback,
  createFeedback,
  respondToFeedback,
  updateFeedbackStatus
} = require('../controllers/communicationController');
const { protect, checkPermission, checkTierAndPermission } = require('../middleware/auth');
const { enforceTenantIsolation } = require('../middleware/tenantIsolation');

const router = express.Router();

router.use(protect);
router.use(enforceTenantIsolation);

// Communications - require PRO tier + canViewCommunications permission
const commsCheck = checkTierAndPermission('pro', 'canViewCommunications');

router.route('/')
  .get(commsCheck, getCommunications)
  .post(createCommunication);

router.post('/incoming', receiveIncomingMessage);
router.put('/:id/reply', commsCheck, replyCommunication);
router.put('/:id/read', commsCheck, markAsRead);
router.put('/:id/resolve', commsCheck, resolveCommunication);

// Client management
router.post('/warn-client', commsCheck, warnClient);
router.post('/block-client', commsCheck, blockClient);
router.post('/unblock-client', commsCheck, unblockClient);

// Feedback
router.route('/feedback')
  .get(commsCheck, getFeedback)
  .post(createFeedback);

router.put('/feedback/:id/respond', commsCheck, respondToFeedback);
router.put('/feedback/:id/status', commsCheck, updateFeedbackStatus);

module.exports = router;
