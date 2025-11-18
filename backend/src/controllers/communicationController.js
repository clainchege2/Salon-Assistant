const Communication = require('../models/Communication');
const Feedback = require('../models/Feedback');
const Client = require('../models/Client');
const logger = require('../config/logger');

// Template rendering helper
const renderMessageTemplate = (template, data) => {
  if (!template) return template;
  
  return template
    .replace(/{name}/g, data.clientName || '')
    .replace(/{firstName}/g, data.firstName || '')
    .replace(/{lastName}/g, data.lastName || '')
    .replace(/{time}/g, data.appointmentTime || '')
    .replace(/{date}/g, data.appointmentDate || '')
    .replace(/{service}/g, data.serviceName || '')
    .replace(/{stylist}/g, data.stylistName || '')
    .replace(/{price}/g, data.price || '')
    .replace(/{discount}/g, data.discountAmount || '');
};

// Detect message type from content
const detectMessageType = (message) => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('complaint') || lowerMessage.includes('unhappy') || lowerMessage.includes('disappointed')) {
    return 'complaint';
  } else if (lowerMessage.includes('thank') || lowerMessage.includes('love') || lowerMessage.includes('great') || lowerMessage.includes('excellent')) {
    return 'feedback-response';
  } else if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
    return 'inquiry';
  }
  
  return 'general';
};

// Get all communications with filters
exports.getCommunications = async (req, res) => {
  try {
    const { direction, messageType, status, requiresAction, search, type, clientId } = req.query;
    
    const filter = { tenantId: req.tenantId };
    
    if (direction) filter.direction = direction;
    if (messageType) filter.messageType = messageType;
    if (status) filter.status = status;
    if (requiresAction === 'true') filter.requiresAction = true;
    if (type) filter.type = type;
    if (clientId) filter.clientId = clientId;
    
    let communications = await Communication.find(filter)
      .populate('clientId', 'firstName lastName phone email communicationStatus')
      .populate('relatedBookingId', 'serviceId scheduledDate')
      .populate('replies.repliedBy', 'firstName lastName')
      .populate('sentBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      communications = communications.filter(comm => {
        const clientName = `${comm.clientId?.firstName} ${comm.clientId?.lastName}`.toLowerCase();
        const message = comm.message.toLowerCase();
        return clientName.includes(searchLower) || message.includes(searchLower);
      });
    }

    res.json({
      success: true,
      count: communications.length,
      data: communications
    });
  } catch (error) {
    logger.error(`Get communications error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new communication (outgoing)
exports.createCommunication = async (req, res) => {
  try {
    const { clientId, messageType, type, channel, message, template, templateData, relatedBookingId, subject } = req.body;
    
    // Check if client is blocked
    const client = await Client.findById(clientId);
    if (client?.communicationStatus?.blocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot send message to blocked client'
      });
    }
    
    // Render template if provided
    let finalMessage = message;
    if (template && templateData) {
      finalMessage = renderMessageTemplate(template, templateData);
    }
    
    const communication = await Communication.create({
      tenantId: req.tenantId,
      clientId,
      direction: 'outgoing',
      messageType: messageType || type || 'general',
      type: type || messageType,
      channel: channel || 'portal',
      message: finalMessage,
      subject,
      template,
      templateData,
      relatedBookingId,
      sentBy: req.user._id,
      sentAt: new Date(),
      status: 'sent'
    });

    // Update client's last outgoing message
    if (client) {
      if (!client.communicationStatus) {
        client.communicationStatus = {};
      }
      client.communicationStatus.lastOutgoingMessage = new Date();
      await client.save();
    }

    await communication.populate('clientId', 'firstName lastName phone email');

    res.status(201).json({
      success: true,
      data: communication
    });
  } catch (error) {
    logger.error(`Create communication error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Receive incoming message (webhook)
exports.receiveIncomingMessage = async (req, res) => {
  try {
    const { from, message, channel, timestamp } = req.body;
    
    // Find client by phone
    const client = await Client.findOne({
      tenantId: req.tenantId,
      phone: from
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Check if client is blocked
    if (client.communicationStatus?.blocked) {
      return res.status(403).json({
        success: false,
        message: 'Client is blocked'
      });
    }
    
    // Detect message type
    const messageType = detectMessageType(message);
    const requiresAction = messageType === 'complaint';
    
    // Save incoming message
    const communication = await Communication.create({
      tenantId: req.tenantId,
      clientId: client._id,
      direction: 'incoming',
      messageType,
      channel: channel || 'sms',
      message,
      status: 'read',
      receivedAt: timestamp || new Date(),
      requiresAction
    });
    
    // Update client's last incoming message
    if (!client.communicationStatus) {
      client.communicationStatus = {};
    }
    client.communicationStatus.lastIncomingMessage = new Date();
    client.communicationStatus.totalConversations = (client.communicationStatus.totalConversations || 0) + 1;
    await client.save();
    
    res.json({
      success: true,
      data: communication
    });
  } catch (error) {
    logger.error(`Receive incoming message error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Reply to communication
exports.replyCommunication = async (req, res) => {
  try {
    const { message } = req.body;

    const communication = await Communication.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!communication) {
      return res.status(404).json({
        success: false,
        message: 'Communication not found'
      });
    }

    communication.replies.push({
      message,
      repliedBy: req.user._id,
      repliedAt: new Date()
    });

    communication.status = 'replied';
    communication.requiresAction = false;
    await communication.save();

    await communication.populate('clientId', 'firstName lastName phone email');

    res.json({
      success: true,
      data: communication
    });
  } catch (error) {
    logger.error(`Reply communication error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Mark as read
exports.markAsRead = async (req, res) => {
  try {
    logger.info(`Marking communication ${req.params.id} as read by user ${req.user?._id}`);
    
    const communication = await Communication.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!communication) {
      logger.warn(`Communication ${req.params.id} not found for tenant ${req.tenantId}`);
      return res.status(404).json({
        success: false,
        message: 'Communication not found'
      });
    }

    const alreadyRead = communication.readBy.some(
      r => r.userId.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      communication.readBy.push({
        userId: req.user._id,
        readAt: new Date()
      });

      if (communication.status === 'new' || communication.status === 'pending') {
        communication.status = 'read';
      }

      communication.readAt = new Date();
      await communication.save();
      logger.info(`Communication ${req.params.id} marked as read successfully`);
    } else {
      logger.info(`Communication ${req.params.id} already marked as read`);
    }

    res.json({
      success: true,
      data: communication
    });
  } catch (error) {
    logger.error(`Mark as read error: ${error.message}`, { stack: error.stack });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Resolve communication
exports.resolveCommunication = async (req, res) => {
  try {
    const communication = await Communication.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      {
        status: 'resolved',
        requiresAction: false,
        resolvedBy: req.user._id,
        resolvedAt: new Date()
      },
      { new: true }
    ).populate('clientId', 'firstName lastName phone email');

    if (!communication) {
      return res.status(404).json({
        success: false,
        message: 'Communication not found'
      });
    }

    res.json({
      success: true,
      data: communication
    });
  } catch (error) {
    logger.error(`Resolve communication error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Warn client
exports.warnClient = async (req, res) => {
  try {
    const { clientId, reason, notes } = req.body;
    
    const client = await Client.findOne({
      _id: clientId,
      tenantId: req.tenantId
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Initialize communicationStatus if not exists
    if (!client.communicationStatus) {
      client.communicationStatus = {
        warnings: [],
        warningCount: 0
      };
    }
    
    // Add warning
    client.communicationStatus.warnings.push({
      reason,
      notes,
      issuedBy: req.user._id,
      date: new Date()
    });
    
    client.communicationStatus.warningCount = (client.communicationStatus.warningCount || 0) + 1;
    await client.save();
    
    // Create warning communication
    await Communication.create({
      tenantId: req.tenantId,
      clientId: client._id,
      direction: 'outgoing',
      messageType: 'warning',
      channel: 'portal',
      message: `Warning issued: ${reason}. ${notes || ''}`,
      sentBy: req.user._id,
      sentAt: new Date(),
      status: 'sent'
    });
    
    res.json({
      success: true,
      message: 'Warning issued successfully',
      data: client
    });
  } catch (error) {
    logger.error(`Warn client error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Block client
exports.blockClient = async (req, res) => {
  try {
    const { clientId, reason, notes } = req.body;
    
    const client = await Client.findOne({
      _id: clientId,
      tenantId: req.tenantId
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Initialize communicationStatus if not exists
    if (!client.communicationStatus) {
      client.communicationStatus = {};
    }
    
    client.communicationStatus.blocked = true;
    client.communicationStatus.blockedReason = reason;
    client.communicationStatus.blockedDate = new Date();
    client.communicationStatus.blockedBy = req.user._id;
    
    await client.save();
    
    // Create block notification
    await Communication.create({
      tenantId: req.tenantId,
      clientId: client._id,
      direction: 'outgoing',
      messageType: 'blocked',
      channel: 'portal',
      message: `Client blocked: ${reason}. ${notes || ''}`,
      sentBy: req.user._id,
      sentAt: new Date(),
      status: 'sent'
    });
    
    res.json({
      success: true,
      message: 'Client blocked successfully',
      data: client
    });
  } catch (error) {
    logger.error(`Block client error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Unblock client
exports.unblockClient = async (req, res) => {
  try {
    const { clientId } = req.body;
    
    const client = await Client.findOne({
      _id: clientId,
      tenantId: req.tenantId
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    if (!client.communicationStatus) {
      client.communicationStatus = {};
    }
    
    client.communicationStatus.blocked = false;
    client.communicationStatus.blockedReason = null;
    client.communicationStatus.blockedDate = null;
    client.communicationStatus.blockedBy = null;
    
    await client.save();
    
    res.json({
      success: true,
      message: 'Client unblocked successfully',
      data: client
    });
  } catch (error) {
    logger.error(`Unblock client error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get feedback
exports.getFeedback = async (req, res) => {
  try {
    const { status, minRating, maxRating, requiresAction } = req.query;
    
    const filter = { tenantId: req.tenantId };
    
    if (status) filter.status = status;
    if (minRating) filter.overallRating = { $gte: parseInt(minRating) };
    if (maxRating) filter.overallRating = { ...filter.overallRating, $lte: parseInt(maxRating) };
    if (requiresAction === 'true') filter.requiresAction = true;
    
    const feedback = await Feedback.find(filter)
      .populate('clientId', 'firstName lastName phone email')
      .populate('bookingId', 'serviceId scheduledDate')
      .populate('response.respondedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: feedback.length,
      data: feedback
    });
  } catch (error) {
    logger.error(`Get feedback error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create feedback
exports.createFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.create({
      ...req.body,
      tenantId: req.tenantId
    });

    await feedback.populate('clientId', 'firstName lastName phone email');

    res.status(201).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error(`Create feedback error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Respond to feedback
exports.respondToFeedback = async (req, res) => {
  try {
    const { text } = req.body;
    
    const feedback = await Feedback.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      {
        'response.text': text,
        'response.respondedBy': req.user._id,
        'response.respondedAt': new Date(),
        requiresAction: false
      },
      { new: true }
    ).populate('clientId', 'firstName lastName phone email');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Create a message so client can see the response in their Messages page
    const Message = require('../models/Message');
    await Message.create({
      tenantId: req.tenantId,
      recipientType: 'individual',
      recipientId: feedback.clientId._id,
      type: 'general',
      subject: 'Response to Your Feedback',
      message: `Thank you for your feedback! ${text}`,
      channel: 'app',
      status: 'sent',
      sentBy: req.user._id,
      sentAt: new Date()
    });

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error(`Respond to feedback error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update feedback status
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const feedback = await Feedback.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { status },
      { new: true }
    ).populate('clientId', 'firstName lastName phone email');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error(`Update feedback status error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
