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

    // Check for double booking (only if specific stylist selected)
    if (stylistId) {
      const requestedDate = new Date(scheduledDate);
      const requestedHour = requestedDate.getHours();
      const durationHours = Math.ceil(totalDuration / 60);
      const requestedEndHour = requestedHour + durationHours;

      // Get bookings for the same day and stylist
      const startOfDay = new Date(requestedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(requestedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const query = {
        tenantId: req.tenantId,
        scheduledDate: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        status: { $nin: ['cancelled', 'no-show'] },
        $or: [
          { assignedTo: stylistId },
          { stylistId: stylistId }
        ]
      };

      const existingBookings = await Booking.find(query);

      // Check for conflicts
      const hasConflict = existingBookings.some(booking => {
        const bookingHour = new Date(booking.scheduledDate).getHours();
        const bookingDuration = Math.ceil((booking.totalDuration || 60) / 60);
        const bookingEndHour = bookingHour + bookingDuration;

        // Check if time slots overlap
        return (
          (requestedHour >= bookingHour && requestedHour < bookingEndHour) ||
          (requestedEndHour > bookingHour && requestedEndHour <= bookingEndHour) ||
          (requestedHour <= bookingHour && requestedEndHour >= bookingEndHour)
        );
      });

      if (hasConflict) {
        return res.status(409).json({
          success: false,
          message: 'This time slot is already booked for the selected stylist. Please choose a different time or stylist.'
        });
      }
    }
    // If no stylist selected, skip conflict check - system will auto-assign to available stylist

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

    // Also create a Feedback document for Communications Hub
    logger.info('Attempting to create Feedback document...');
    try {
      const Feedback = require('../models/Feedback');
      logger.info('Feedback model loaded');
      
      const feedbackData = {
        tenantId: req.tenantId,
        clientId: req.client._id,
        bookingId: booking._id,
        overallRating: rating,
        comment: comment || '',
        source: 'portal',
        status: 'pending'
      };
      logger.info('Feedback data:', feedbackData);
      
      const feedbackDoc = await Feedback.create(feedbackData);
      logger.info(`✅ Feedback document created successfully: ${feedbackDoc._id}`);
    } catch (feedbackError) {
      logger.error(`❌ Error creating feedback document: ${feedbackError.message}`);
      logger.error('Full error:', feedbackError);
      // Don't fail the whole request if feedback doc creation fails
    }

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

// @desc    Get available staff/stylists
// @route   GET /api/v1/client/staff
// @access  Private (Client)
router.get('/staff', async (req, res) => {
  try {
    const User = require('../models/User');
    
    logger.info(`Fetching staff for tenant: ${req.tenantId}`);
    
    const staff = await User.find({
      tenantId: req.tenantId,
      role: 'stylist',
      status: 'active'
    }).select('firstName lastName role');

    logger.info(`Found ${staff.length} staff members`);

    res.json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (error) {
    logger.error(`Get staff error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get available time slots for a date and optional staff member
// @route   GET /api/v1/client/availability
// @access  Private (Client)
router.get('/availability', async (req, res) => {
  try {
    const { date, staffId } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Parse the date (date comes as YYYY-MM-DD string)
    const [year, month, day] = date.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
    
    logger.info(`Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    // Build query
    const query = {
      tenantId: req.tenantId,
      scheduledDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $nin: ['cancelled', 'no-show'] }
    };

    // Filter by staff if provided (check both assignedTo and stylistId)
    if (staffId) {
      query.$or = [
        { assignedTo: staffId },
        { stylistId: staffId }
      ];
      logger.info(`Checking availability for staff: ${staffId} on ${date}`);
    }

    // Get all bookings for the day
    const bookings = await Booking.find(query).select('scheduledDate totalDuration assignedTo stylistId services status');
    logger.info(`Found ${bookings.length} bookings for query:`, JSON.stringify(query, null, 2));
    bookings.forEach(booking => {
      logger.info(`Booking: ${booking._id}, Date: ${booking.scheduledDate}, AssignedTo: ${booking.assignedTo}, StylistId: ${booking.stylistId}, Status: ${booking.status}`);
    });

    // Operating hours (9 AM to 6 PM)
    const operatingStart = 9; // 9 AM
    const operatingEnd = 18; // 6 PM

    // Generate hourly slots
    const slots = [];
    for (let hour = operatingStart; hour < operatingEnd; hour++) {
      const slotTime = new Date(date);
      slotTime.setHours(hour, 0, 0, 0);
      
      // Check if this slot is available
      let isBooked = false;
      
      if (staffId) {
        // If specific stylist selected, check only their availability
        isBooked = bookings.some(booking => {
          const bookingStart = new Date(booking.scheduledDate);
          const bookingHour = bookingStart.getHours();
          
          // Round duration to nearest hour
          const durationHours = Math.ceil((booking.totalDuration || 60) / 60);
          const bookingEnd = bookingHour + durationHours;
          
          // Check if slot overlaps with booking
          return hour >= bookingHour && hour < bookingEnd;
        });
      }
      // If no stylist selected, all slots are available (system will auto-assign)
      // This allows booking even if some stylists are busy

      slots.push({
        time: slotTime.toISOString(),
        hour: `${hour.toString().padStart(2, '0')}:00`,
        display: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        available: !isBooked,
        staffId: staffId || null
      });
    }

    logger.info(`Generated ${slots.length} slots, ${slots.filter(s => s.available).length} available`);
    logger.info(`Slots:`, slots.map(s => `${s.hour}: ${s.available ? 'Available' : 'Booked'}`).join(', '));

    res.json({
      success: true,
      data: slots,
      totalSlots: slots.length,
      availableSlots: slots.filter(s => s.available).length
    });
  } catch (error) {
    logger.error(`Get availability error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update booking instructions
// @route   PUT /api/v1/client/bookings/:id/instructions
// @access  Private (Client)
router.put('/bookings/:id/instructions', async (req, res) => {
  try {
    const { customerInstructions } = req.body;

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

    // Only allow editing for pending or confirmed bookings
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit instructions for this booking'
      });
    }

    booking.customerInstructions = customerInstructions;
    await booking.save();

    logger.info(`Instructions updated by client: ${req.client._id}, booking: ${booking._id}`);

    res.json({
      success: true,
      data: booking,
      message: 'Instructions updated successfully'
    });
  } catch (error) {
    logger.error(`Update instructions error: ${error.message}`);
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
