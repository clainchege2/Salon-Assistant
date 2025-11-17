const MessageTemplate = require('../models/MessageTemplate');
const Booking = require('../models/Booking');
const Client = require('../models/Client');
const logger = require('../config/logger');

// Get all templates for tenant
exports.getTemplates = async (req, res) => {
  try {
    const templates = await MessageTemplate.find({
      tenantId: req.tenantId,
      isActive: true
    }).sort('-createdAt');

    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    logger.error(`Get templates error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Create template (owner only)
exports.createTemplate = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only owners can create templates'
      });
    }

    const template = await MessageTemplate.create({
      ...req.body,
      tenantId: req.tenantId,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error(`Create template error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Send message to client
exports.sendMessage = async (req, res) => {
  try {
    const { bookingId, templateType, customMessage, channel } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      tenantId: req.tenantId
    }).populate('clientId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Get template or use custom message
    let messageText = customMessage;
    
    if (!customMessage && templateType) {
      const template = await MessageTemplate.findOne({
        tenantId: req.tenantId,
        type: templateType,
        isActive: true
      });

      if (template) {
        // Replace variables
        messageText = template.message
          .replace('{clientName}', booking.clientId.firstName)
          .replace('{serviceName}', booking.services.map(s => s.serviceName).join(', '))
          .replace('{date}', new Date(booking.scheduledDate).toLocaleDateString())
          .replace('{time}', new Date(booking.scheduledDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
          .replace('{stylistName}', req.user.firstName)
          .replace('{salonName}', 'Your Salon');
      }
    }

    // Save message to database so client can see it
    const Message = require('../models/Message');
    const newMessage = await Message.create({
      tenantId: req.tenantId,
      recipientType: 'individual',
      recipientId: booking.clientId._id,
      type: templateType || 'general',
      subject: templateType === 'confirmation' ? 'Booking Confirmed' : 
               templateType === 'reminder' ? 'Appointment Reminder' :
               templateType === 'thank-you' ? 'Thank You' : 'Message from Salon',
      message: messageText,
      channel: channel || 'sms',
      status: 'sent',
      sentBy: req.user._id,
      sentAt: new Date()
    });

    // In production, integrate with SMS/Email/WhatsApp API
    // For now, log the message
    logger.info(`Message sent to ${booking.clientId.phone}: ${messageText}`);

    // Update booking status if needed
    if (templateType === 'confirmation' && booking.status === 'pending') {
      booking.status = 'confirmed';
      await booking.save();
    }

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        recipient: booking.clientId.phone,
        message: messageText,
        channel: channel || 'sms',
        messageId: newMessage._id
      }
    });
  } catch (error) {
    logger.error(`Send message error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Seed default templates
exports.seedDefaultTemplates = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only owners can seed templates'
      });
    }

    const defaultTemplates = [
      {
        type: 'confirmation',
        name: 'Booking Confirmation',
        message: 'Hi {clientName}! ✅ Your appointment for {serviceName} is confirmed for {date} at {time}. See you soon! - {stylistName}',
        channel: 'sms',
        variables: ['clientName', 'serviceName', 'date', 'time', 'stylistName']
      },
      {
        type: 'reminder',
        name: 'Appointment Reminder',
        message: 'Hi {clientName}! 🔔 Reminder: Your {serviceName} appointment is tomorrow at {time}. Looking forward to seeing you! - {stylistName}',
        channel: 'sms',
        variables: ['clientName', 'serviceName', 'time', 'stylistName']
      },
      {
        type: 'thank-you',
        name: 'Thank You Message',
        message: 'Thank you {clientName}! 💜 It was wonderful styling your hair today. Hope you love your {serviceName}! See you next time. - {stylistName}',
        channel: 'sms',
        variables: ['clientName', 'serviceName', 'stylistName']
      }
    ];

    const created = [];
    for (const template of defaultTemplates) {
      const existing = await MessageTemplate.findOne({
        tenantId: req.tenantId,
        type: template.type
      });

      if (!existing) {
        const newTemplate = await MessageTemplate.create({
          ...template,
          tenantId: req.tenantId,
          createdBy: req.user._id
        });
        created.push(newTemplate);
      }
    }

    res.json({
      success: true,
      message: `Created ${created.length} default templates`,
      data: created
    });
  } catch (error) {
    logger.error(`Seed templates error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
