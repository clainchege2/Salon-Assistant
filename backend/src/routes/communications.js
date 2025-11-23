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
  updateFeedbackStatus,
  getStaffClientCommunications,
  blockCommunication,
  unblockCommunication,
  flagCommunication,
  unflagCommunication
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

// Staff-Client Communication Monitoring
const monitorCheck = checkTierAndPermission('pro', 'canMonitorCommunications');
router.get('/staff-client', commsCheck, getStaffClientCommunications);
router.post('/block', monitorCheck, blockCommunication);
router.post('/unblock', monitorCheck, unblockCommunication);
router.put('/:id/flag', monitorCheck, flagCommunication);
router.put('/:id/unflag', monitorCheck, unflagCommunication);

// Birthday alerts
router.get('/birthdays', commsCheck, async (req, res) => {
  try {
    const Client = require('../models/Client');
    const Message = require('../models/Message');
    const logger = require('../config/logger');
    
    // Get clients with birthdays in the next 30 days
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const clients = await Client.find({
      tenantId: req.tenantId,
      dateOfBirth: { $exists: true, $ne: null }
    }).select('firstName lastName phone dateOfBirth totalVisits category');
    
    // Get birthday messages sent this year
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const sentBirthdayMessages = await Message.find({
      tenantId: req.tenantId,
      subject: 'Happy Birthday! 🎂',
      sentAt: { $gte: yearStart }
    }).select('recipientId');
    
    const sentClientIds = new Set(sentBirthdayMessages.map(m => m.recipientId.toString()));
    
    // Filter and calculate days until birthday
    const upcomingBirthdays = clients
      .map(client => {
        const dob = new Date(client.dateOfBirth);
        const thisYear = today.getFullYear();
        
        // Create birthday for this year
        let nextBirthday = new Date(thisYear, dob.getMonth(), dob.getDate());
        
        // If birthday already passed this year, use next year
        if (nextBirthday < today) {
          nextBirthday = new Date(thisYear + 1, dob.getMonth(), dob.getDate());
        }
        
        const daysUntil = Math.floor((nextBirthday - today) / (1000 * 60 * 60 * 24));
        const messageSent = sentClientIds.has(client._id.toString());
        
        return {
          ...client.toObject(),
          nextBirthday,
          daysUntil,
          messageSent
        };
      })
      .filter(client => client.daysUntil <= 30 && !client.messageSent) // Only show unsent
      .sort((a, b) => a.daysUntil - b.daysUntil);
    
    logger.info(`Found ${upcomingBirthdays.length} upcoming birthdays (unsent) for tenant ${req.tenantId}`);
    
    res.json({
      success: true,
      count: upcomingBirthdays.length,
      data: upcomingBirthdays
    });
  } catch (error) {
    console.error('Get birthdays error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.post('/send-birthday', commsCheck, async (req, res) => {
  try {
    const { clientId, message } = req.body;
    const Client = require('../models/Client');
    const Message = require('../models/Message');
    const logger = require('../config/logger');
    
    const client = await Client.findOne({ _id: clientId, tenantId: req.tenantId });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Create message record
    await Message.create({
      tenantId: req.tenantId,
      recipientId: client._id,
      recipientType: 'individual',
      subject: 'Happy Birthday! 🎂',
      message: message,
      type: 'general',
      status: 'sent',
      sentBy: req.user._id,
      sentAt: new Date()
    });
    
    logger.info(`Birthday message sent to client ${client.phone}`);
    
    res.json({
      success: true,
      message: 'Birthday message sent successfully'
    });
  } catch (error) {
    console.error('Send birthday message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
