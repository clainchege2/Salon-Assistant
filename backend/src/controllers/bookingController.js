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

    const allowedUpdates = ['status', 'services', 'customerInstructions', 'materialsUsed', 'followUpRequired', 'followUpNote'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

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

    Object.assign(booking, updates);
    await booking.save();

    res.json({
      success: true,
      data: booking
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
