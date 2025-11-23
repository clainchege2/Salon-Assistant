const express = require('express');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { protectClient } = require('../middleware/clientAuth');
const logger = require('../config/logger');

const router = express.Router();

// All routes are protected and require client authentication
router.use(protectClient);

// @desc    Get salon info (including tier)
// @route   GET /api/v1/client-bookings/salon-info
// @access  Private (Client)
router.get('/salon-info', async (req, res) => {
  try {
    const Tenant = require('../models/Tenant');
    const salon = await Tenant.findById(req.tenantId)
      .select('businessName subscriptionTier slug');

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    res.json({
      success: true,
      data: salon
    });
  } catch (error) {
    logger.error(`Get salon info error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get services for client's salon
// @route   GET /api/v1/client-bookings/services
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

// @desc    Get messages for client
// @route   GET /api/v1/client-bookings/messages
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
// @route   GET /api/v1/client-bookings/campaigns
// @access  Private (Client)
router.get('/campaigns', async (req, res) => {
  try {
    const Marketing = require('../models/Marketing');
    
    // Get sent campaigns (show all sent campaigns regardless of dates for now)
    const campaigns = await Marketing.find({
      tenantId: req.tenantId,
      status: 'sent'
    }).sort({ sentAt: -1 });

    logger.info(`Found ${campaigns.length} campaigns for tenant ${req.tenantId}`);

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
// @route   GET /api/v1/client-bookings/staff
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
// @route   GET /api/v1/client-bookings/availability
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

// @desc    Get client profile
// @route   GET /api/v1/client-bookings/profile
// @access  Private (Client)
router.get('/profile', async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.client
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get client's bookings
// @route   GET /api/v1/client-bookings
// @access  Private (Client)
router.get('/', async (req, res) => {
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
// @route   GET /api/v1/client-bookings/:id
// @access  Private (Client)
router.get('/:id', async (req, res) => {
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
// @route   POST /api/v1/client-bookings
// @access  Private (Client)
router.post('/', async (req, res) => {
  try {
    const { scheduledDate, services, customerInstructions } = req.body;
    let stylistId = req.body.stylistId; // Use let instead of const so we can reassign

    if (!scheduledDate || !services || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide scheduled date and at least one service'
      });
    }

    const totalPrice = services.reduce((sum, s) => sum + (s.price || 0), 0);
    const totalDuration = services.reduce((sum, s) => sum + (s.duration || 0), 0);

    // Check for double booking
    const requestedDate = new Date(scheduledDate);
    const requestedHour = requestedDate.getHours();
    const durationHours = Math.ceil(totalDuration / 60);
    const requestedEndHour = requestedHour + durationHours;

    // Get bookings for the same day
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
      status: { $nin: ['cancelled', 'no-show'] }
    };

    // If specific stylist selected, check only their availability
    if (stylistId) {
      query.$or = [
        { assignedTo: stylistId },
        { stylistId: stylistId }
      ];
    }

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

    if (stylistId && hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked for the selected stylist. Please choose a different time or stylist.'
      });
    }

    // If no stylist selected, check if ANY staff is available
    if (!stylistId) {
      // Get all active stylists
      const User = require('../models/User');
      const allStylists = await User.find({
        tenantId: req.tenantId,
        role: 'stylist',
        status: 'active'
      }).select('_id');

      // If no staff exists (free tier), allow booking without staff assignment
      if (allStylists.length === 0) {
        logger.info('No staff members found - free tier salon, proceeding without staff assignment');
        stylistId = null; // Explicitly set to null for free tier
      } else {

        // Group bookings by stylist to find who's available
        const stylistBookings = {};
        existingBookings.forEach(booking => {
          const staffId = (booking.assignedTo || booking.stylistId)?.toString();
          if (staffId) {
            if (!stylistBookings[staffId]) {
              stylistBookings[staffId] = [];
            }
            stylistBookings[staffId].push(booking);
          }
        });

        // Find an available stylist
        let availableStylist = null;
        for (const stylist of allStylists) {
          const currentStylistId = stylist._id.toString();
          const bookings = stylistBookings[currentStylistId] || [];
          
          const isAvailable = !bookings.some(booking => {
            const bookingHour = new Date(booking.scheduledDate).getHours();
            const bookingDuration = Math.ceil((booking.totalDuration || 60) / 60);
            const bookingEndHour = bookingHour + bookingDuration;

            return (
              (requestedHour >= bookingHour && requestedHour < bookingEndHour) ||
              (requestedEndHour > bookingHour && requestedEndHour <= bookingEndHour) ||
              (requestedHour <= bookingHour && requestedEndHour >= bookingEndHour)
            );
          });

          if (isAvailable) {
            availableStylist = stylist._id;
            break;
          }
        }

        if (!availableStylist) {
          return res.status(409).json({
            success: false,
            message: 'This time slot is fully booked. All staff are busy. Please choose a different time.'
          });
        }

        // Auto-assign to available stylist
        stylistId = availableStylist;
        logger.info(`Auto-assigned booking to stylist: ${stylistId}`);
      }
    }

    const booking = await Booking.create({
      tenantId: req.tenantId,
      clientId: req.client._id,
      type: 'reserved',
      scheduledDate: new Date(scheduledDate),
      services,
      stylistId: stylistId,
      assignedTo: stylistId,
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

    // Send booking confirmation message to client
    const Message = require('../models/Message');
    const Communication = require('../models/Communication');
    
    const serviceNames = services.map(s => s.serviceName).join(', ');
    const bookingDate = new Date(scheduledDate).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const bookingTime = new Date(scheduledDate).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Message to client
    await Message.create({
      tenantId: req.tenantId,
      recipientType: 'individual',
      recipientId: req.client._id,
      type: 'confirmation',
      subject: 'Booking Confirmation',
      message: `Your appointment has been booked! 🎉\n\nService: ${serviceNames}\nDate: ${bookingDate}\nTime: ${bookingTime}\n\nWe'll send you a reminder closer to your appointment. Looking forward to seeing you!`,
      channel: 'app',
      status: 'sent',
      sentAt: new Date()
    }).catch(err => logger.error(`Failed to create booking message: ${err.message}`));

    // Log in Communications Hub for owner/staff reference
    const clientName = `${req.client.firstName} ${req.client.lastName}`;
    await Communication.create({
      tenantId: req.tenantId,
      clientId: req.client._id,
      direction: 'incoming',
      messageType: 'confirmation',
      channel: 'portal',
      subject: 'New Booking Created',
      message: `${clientName} booked an appointment\n\nService: ${serviceNames}\nDate: ${bookingDate}\nTime: ${bookingTime}\n\nStatus: Pending confirmation`,
      status: 'sent',
      requiresAction: true,
      sentAt: new Date()
    }).catch(err => logger.error(`Failed to log booking communication: ${err.message}`));

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

// @desc    Cancel booking with fee tracking
// @route   PUT /api/v1/client-bookings/:id/cancel
// @access  Private (Client)
router.put('/:id/cancel', async (req, res) => {
  try {
    const { cancellationFee } = req.body;

    // Find booking that belongs to this client
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
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed booking'
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancellationFee = cancellationFee || 0;
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.client._id;
    
    // Log the fee for future enforcement
    if (cancellationFee > 0) {
      booking.notes = `${booking.notes || ''}\nCancellation fee of KSh ${cancellationFee} logged on ${new Date().toLocaleDateString()}. Late cancellation (within 48 hours).`.trim();
      logger.info(`Cancellation fee logged: KSh ${cancellationFee} for booking ${booking._id}, client ${req.client._id}`);
    }

    await booking.save();

    // Send cancellation confirmation message to client
    const Message = require('../models/Message');
    const Communication = require('../models/Communication');
    
    await booking.populate('services clientId');
    const serviceNames = booking.services?.map(s => s.serviceName).join(', ') || 'your appointment';
    const bookingDate = new Date(booking.scheduledDate).toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
    const bookingTime = new Date(booking.scheduledDate).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    let cancellationMessage = `Your appointment has been cancelled.\n\nService: ${serviceNames}\nDate: ${bookingDate}\nTime: ${bookingTime}\n\n`;
    
    if (cancellationFee > 0) {
      cancellationMessage += `A cancellation fee of KSh ${cancellationFee} has been applied as this was cancelled within 48 hours of your appointment.\n\n`;
    }
    
    cancellationMessage += `Need to reschedule? You can book a new appointment anytime!`;

    // Message to client
    await Message.create({
      tenantId: req.tenantId,
      recipientType: 'individual',
      recipientId: req.client._id,
      type: 'general',
      subject: 'Booking Cancelled',
      message: cancellationMessage,
      channel: 'app',
      status: 'sent',
      sentAt: new Date()
    }).catch(err => logger.error(`Failed to create cancellation message: ${err.message}`));

    // Log in Communications Hub
    const clientName = booking.clientId ? `${booking.clientId.firstName} ${booking.clientId.lastName}` : 'Client';
    await Communication.create({
      tenantId: req.tenantId,
      clientId: booking.clientId._id,
      direction: 'incoming',
      messageType: 'general',
      channel: 'portal',
      subject: 'Booking Cancelled by Client',
      message: `${clientName} cancelled their appointment\n\nService: ${serviceNames}\nDate: ${bookingDate}\nTime: ${bookingTime}\n\n${cancellationFee > 0 ? `Cancellation fee: KSh ${cancellationFee} (within 48 hours)` : 'No fee (cancelled with sufficient notice)'}`,
      status: 'sent',
      requiresAction: false,
      sentAt: new Date()
    }).catch(err => logger.error(`Failed to log cancellation communication: ${err.message}`));

    res.json({
      success: true,
      data: booking,
      message: cancellationFee > 0 
        ? `Booking cancelled. Cancellation fee of KSh ${cancellationFee} has been logged.`
        : 'Booking cancelled successfully'
    });
  } catch (error) {
    logger.error(`Cancel booking error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Submit feedback
// @route   POST /api/v1/client-bookings/feedback
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

// @desc    Get client profile
// @route   GET /api/v1/client-bookings/profile
// @access  Private (Client)
router.get('/profile', async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.client
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Mark message as read
// @route   PUT /api/v1/client-bookings/messages/:id/read
// @access  Private (Client)
router.put('/messages/:id/read', async (req, res) => {
  try {
    const Message = require('../models/Message');
    
    // Find message that belongs to this tenant and is either for this client or for all
    const message = await Message.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenantId,
        $or: [
          { recipientType: 'all' },
          { recipientId: req.client._id }
        ]
      },
      { readAt: new Date() },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    logger.error(`Mark message as read error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get campaigns for client
// @route   GET /api/v1/client-bookings/campaigns
// @access  Private (Client)
router.get('/campaigns', async (req, res) => {
  try {
    const Marketing = require('../models/Marketing');
    
    // Get sent campaigns (show all sent campaigns regardless of dates for now)
    const campaigns = await Marketing.find({
      tenantId: req.tenantId,
      status: 'sent'
    }).sort({ sentAt: -1 });

    logger.info(`Found ${campaigns.length} campaigns for tenant ${req.tenantId}`);

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
// @route   GET /api/v1/client-bookings/staff
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
// @route   GET /api/v1/client-bookings/availability
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
// @route   PUT /api/v1/client-bookings/:id/instructions
// @access  Private (Client)
router.put('/:id/instructions', async (req, res) => {
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

// @desc    Reactivate cancelled booking (undo cancellation)
// @route   PUT /api/v1/client-bookings/:id/reactivate
// @access  Private (Client)
router.put('/:id/reactivate', async (req, res) => {
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

    // Only allow reactivating cancelled bookings
    if (booking.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Only cancelled bookings can be reactivated'
      });
    }

    // Check if booking is still in the future
    if (new Date(booking.scheduledDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reactivate a past booking'
      });
    }

    // Restore booking to pending status
    booking.status = 'pending';
    booking.cancellationFee = 0; // Remove any cancellation fee
    booking.cancelledAt = null;
    booking.cancelledBy = null;
    
    // Add note about reactivation
    booking.notes = `${booking.notes || ''}\nBooking reactivated on ${new Date().toLocaleDateString()} - cancellation fee waived.`.trim();
    
    await booking.save();

    logger.info(`Booking reactivated by client: ${req.client._id}, booking: ${booking._id}`);

    res.json({
      success: true,
      data: booking,
      message: 'Booking restored successfully. No fee charged.'
    });
  } catch (error) {
    logger.error(`Reactivate booking error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
