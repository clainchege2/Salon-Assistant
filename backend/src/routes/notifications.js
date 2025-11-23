const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');
const logger = require('../config/logger');

// All routes require authentication
router.use(protect);

// @desc    Get all notifications for tenant
// @route   GET /api/v1/notifications
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { unreadOnly, type, limit = 50 } = req.query;

    const query = { tenantId: req.tenantId };
    
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .populate('relatedClient', 'firstName lastName phone')
      .populate('relatedBooking', 'scheduledDate status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({
      tenantId: req.tenantId,
      read: false
    });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    logger.error(`Get notifications error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get unread notification count
// @route   GET /api/v1/notifications/count
// @access  Private
router.get('/count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      tenantId: req.tenantId,
      read: false
    });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    logger.error(`Get notification count error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    notification.readAt = new Date();
    notification.readBy = req.user._id;
    await notification.save();

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    logger.error(`Mark notification as read error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Mark all notifications as read (optionally filter by type)
// @route   PUT /api/v1/notifications/read-all
// @access  Private
router.put('/read-all', async (req, res) => {
  try {
    const { type } = req.body;
    
    // Build query
    const query = { tenantId: req.tenantId, read: false };
    
    // Add type filter if provided
    if (type) {
      query.type = type;
    }
    
    const result = await Notification.updateMany(
      query,
      { 
        read: true, 
        readAt: new Date(),
        readBy: req.user._id
      }
    );

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`
    });
  } catch (error) {
    logger.error(`Mark all notifications as read error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    logger.error(`Delete notification error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
