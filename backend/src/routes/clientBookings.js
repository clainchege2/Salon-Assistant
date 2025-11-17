const express = require('express');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { protectClient } = require('../middleware/clientAuth');
const logger = require('../config/logger');

const router = express.Router();

// All routes are protected and require client authentication
router.use(protectClient);

// @desc    Get services for client's salon
// @route   GET /api/v1/client/services
// @access  Private (Client)
router.get('/services', async (req, res) => {
  try {
    const services = await Service.find({
      tenantId: req.tenantId
    }).sort({ name: 1 });

    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    logger.error(`Get services error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get client's bookings
// @route   GET /api/v1/client/bookings
// @access  Private (Client)
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find({
      clientId: req.client._id,
      tenantId: req.tenantId
    })
      .populate('assignedTo', 'firstName lastName')
      .populate('stylistId', 'firstName lastName')
      .sort({ scheduledDate: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    logger.error(`Get client bookings error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single booking
// @route   GET /api/v1/client/bookings/:id
// @access  Private (Client)
router.get('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      clientId: req.client._id,
      tenantId: req.tenantId
    })
      .populate('assignedTo', 'firstName lastName')
      .populate('stylistId', 'firstName lastName');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    logger.error(`Get booking error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new booking
// @route   POST /api/v1/client/bookings
// @access  Private (Client)
router.post('/bookings', async (req, res) => {
  try {
    const { scheduledDate, services, customerInstructions, stylistId } = req.body;

    if (!scheduledDate || !services || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide scheduled date and at least one service'
      });
    }

    const totalPrice = services.reduce((sum, s) => sum + (s.price || 0), 0);
    const totalDuration = services.reduce((sum, s) => sum + (s.duration || 0), 0);

    const booking = await Booking.create({
      tenantId: req.tenantId,
      clientId: req.client._id,
      type: 'reserved',
      scheduledDate: new Date(scheduledDate),
      services,
      stylistId: stylistId || null,
      assignedTo: stylistId || null,
      customerInstructions,
      totalPrice,
      totalDuration,
      status: 'pending'
    });

    await booking.populate([
      { path: 'clientId', select: 'firstName lastName phone' },
      { path: 'assignedTo', select: 'firstName lastName' },
      { path: 'stylistId', select: 'firstName lastName' }
    ]);

    logger.info(`Booking created by client: ${req.client._id}, booking: ${booking._id}`);

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully'
    });
  } catch (error) {
    logger.error(`Create booking error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Submit feedback
// @route   POST /api/v1/client/feedback
// @access  Private (Client)
router.post('/feedback', async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Please provide booking ID and rating'
      });
    }

    // Verify booking belongs to client
    const booking = await Booking.findOne({
      _id: bookingId,
      clientId: req.client._id,
      tenantId: req.tenantId
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Add feedback to booking
    booking.feedback = {
      rating,
      comment,
      submittedAt: new Date()
    };
    await booking.save();

    logger.info(`Feedback submitted by client: ${req.client._id}, booking: ${bookingId}`);

    res.json({
      success: true,
      message: 'Thank you for your feedback!',
      data: booking.feedback
    });
  } catch (error) {
    logger.error(`Submit feedback error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get messages for client
// @route   GET /api/v1/client/messages
// @access  Private (Client)
router.get('/messages', async (req, res) => {
  try {
    const Message = require('../models/Message');
    
    const messages = await Message.find({
      tenantId: req.tenantId,
      $or: [
        { recipientType: 'all' },
        { recipientId: req.client._id }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    logger.error(`Get messages error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get campaigns for client
// @route   GET /api/v1/client/campaigns
// @access  Private (Client)
router.get('/campaigns', async (req, res) => {
  try {
    const Campaign = require('../models/Campaign');
    
    const campaigns = await Campaign.find({
      tenantId: req.tenantId,
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    logger.error(`Get campaigns error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Cancel booking
// @route   PUT /api/v1/client/bookings/:id/cancel
// @access  Private (Client)
router.put('/bookings/:id/cancel', async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      clientId: req.client._id,
      tenantId: req.tenantId
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a ${booking.status} booking`
      });
    }

    // Check if booking is in the past
    if (new Date(booking.scheduledDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a past booking'
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    logger.info(`Booking cancelled by client: ${booking._id}`);

    res.json({
      success: true,
      data: booking,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    logger.error(`Cancel booking error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
