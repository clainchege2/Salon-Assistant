const Booking = require('../models/Booking');
const Client = require('../models/Client');
const Material = require('../models/Material');
const logger = require('../config/logger');

exports.createBooking = async (req, res) => {
  try {
    const { clientId, type, scheduledDate, services, stylistId, assignedTo, customerInstructions } = req.body;

    // Verify client belongs to tenant
    const client = await Client.findOne({ _id: clientId, tenantId: req.tenantId });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const totalPrice = services.reduce((sum, s) => sum + (s.price || 0), 0);
    const totalDuration = services.reduce((sum, s) => sum + (s.duration || 0), 0);

    // Use assignedTo if provided, otherwise stylistId, otherwise current user
    const staffMember = assignedTo || stylistId || req.user._id;

    // Check for double booking (only for reserved bookings)
    if (type === 'reserved') {
      const requestedDate = new Date(scheduledDate);
      const requestedHour = requestedDate.getHours();
      const durationHours = Math.ceil(totalDuration / 60);
      const requestedEndHour = requestedHour + durationHours;

      // Get bookings for the same day and staff member
      const startOfDay = new Date(requestedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(requestedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingBookings = await Booking.find({
        tenantId: req.tenantId,
        $or: [
          { assignedTo: staffMember },
          { stylistId: staffMember }
        ],
        scheduledDate: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        status: { $nin: ['cancelled', 'no-show'] }
      });

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
          message: 'This time slot is already booked for the selected staff member. Please choose a different time or staff member.'
        });
      }
    }

    const booking = await Booking.create({
      tenantId: req.tenantId,
      clientId,
      type,
      scheduledDate,
      services,
      stylistId: staffMember,
      assignedTo: staffMember,
      customerInstructions,
      totalPrice,
      totalDuration,
      createdBy: req.user._id,
      status: type === 'walk-in' ? 'in-progress' : 'pending'
    });

    // Update client stats if walk-in
    if (type === 'walk-in') {
      client.totalVisits += 1;
      client.lastVisit = new Date();
      if (!client.firstVisit) client.firstVisit = new Date();
      client.updateCategory();
      await client.save();
    }

    // Populate the booking before returning
    await booking.populate([
      { path: 'clientId', select: 'firstName lastName phone' },
      { path: 'assignedTo', select: 'firstName lastName' },
      { path: 'stylistId', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    logger.error(`Create booking error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const { status, startDate, endDate, clientId, stylistId } = req.query;
    
    const filter = { tenantId: req.tenantId };
    
    // IMPORTANT: Stylists can only see bookings assigned to them
    if (req.user.role === 'stylist') {
      filter.assignedTo = req.user._id;
    }
    
    if (status) filter.status = status;
    if (clientId) filter.clientId = clientId;
    if (stylistId) filter.stylistId = stylistId;
    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(filter)
      .populate('clientId', 'firstName lastName phone')
      .populate('stylistId', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName')
      .sort({ scheduledDate: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    logger.error(`Get bookings error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const allowedUpdates = ['status', 'services', 'customerInstructions', 'materialsUsed', 'followUpRequired', 'followUpNote', 'cancellationReason'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle cancellation
    if (updates.status === 'cancelled') {
      updates.cancelledAt = Date.now();
      if (req.body.notes) {
        updates.cancellationReason = req.body.notes;
      }
    }

    if (updates.status === 'completed') {
      updates.completedAt = Date.now();
      
      // Update client stats
      const client = await Client.findById(booking.clientId);
      if (client) {
        client.totalVisits += 1;
        client.lastVisit = new Date();
        client.totalSpent += booking.totalPrice;
        if (!client.firstVisit) client.firstVisit = new Date();
        client.updateCategory();
        await client.save();
      }

      // Update material stock
      if (updates.materialsUsed && updates.materialsUsed.length > 0) {
        for (const material of updates.materialsUsed) {
          await Material.findOneAndUpdate(
            { tenantId: req.tenantId, name: material.itemName },
            {
              $inc: { currentStock: -material.quantity },
              $push: {
                usageHistory: {
                  bookingId: booking._id,
                  quantity: material.quantity,
                  date: new Date(),
                  usedBy: req.user._id
                }
              }
            }
          );
        }
      }
    }

    // Use findOneAndUpdate to avoid validation issues with required fields
    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { $set: updates },
      { new: true, runValidators: false }
    )
      .populate('clientId', 'firstName lastName phone')
      .populate('stylistId', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName');

    res.json({
      success: true,
      data: updatedBooking
    });
  } catch (error) {
    logger.error(`Update booking error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await booking.deleteOne();

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete booking error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// Get available time slots for a specific date and staff member
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date, staffId } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Parse the date
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    // Build query
    const query = {
      tenantId: req.tenantId,
      scheduledDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $nin: ['cancelled', 'no-show'] }
    };

    // Filter by staff if provided
    if (staffId) {
      query.assignedTo = staffId;
    }

    // Get all bookings for the day
    const bookings = await Booking.find(query).select('scheduledDate totalDuration assignedTo services');

    // Operating hours (9 AM to 6 PM)
    const operatingStart = 9; // 9 AM
    const operatingEnd = 18; // 6 PM

    // Generate hourly slots
    const slots = [];
    for (let hour = operatingStart; hour < operatingEnd; hour++) {
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hour, 0, 0, 0);
      
      // Check if this slot is available
      const isBooked = bookings.some(booking => {
        const bookingStart = new Date(booking.scheduledDate);
        const bookingHour = bookingStart.getHours();
        
        // Round duration to nearest hour
        const durationHours = Math.ceil((booking.totalDuration || 60) / 60);
        const bookingEnd = bookingHour + durationHours;
        
        // Check if slot overlaps with booking
        return hour >= bookingHour && hour < bookingEnd;
      });

      slots.push({
        time: slotTime,
        hour: `${hour}:00`,
        available: !isBooked,
        staffId: staffId || null
      });
    }

    res.status(200).json({
      success: true,
      data: slots,
      bookings: bookings.map(b => ({
        time: b.scheduledDate,
        duration: b.totalDuration,
        services: b.services.map(s => s.serviceName).join(', ')
      }))
    });
  } catch (error) {
    logger.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available slots',
      error: error.message
    });
  }
};
