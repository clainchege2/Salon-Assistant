const Client = require('../models/Client');
const logger = require('../config/logger');

exports.createClient = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      dateOfBirth,
      gender,
      referralSource,
      referredBy,
      socialMedia,
      marketingConsent, 
      communicationPreference,
      preferences 
    } = req.body;

    // Check if client already exists
    const existingClient = await Client.findOne({
      tenantId: req.tenantId,
      phone
    });

    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Client with this phone number already exists'
      });
    }

    const clientData = {
      tenantId: req.tenantId,
      firstName,
      lastName,
      phone,
      createdBy: req.user._id,
      firstVisit: new Date()
    };

    // Add optional fields
    if (email) clientData.email = email;
    if (dateOfBirth) clientData.dateOfBirth = dateOfBirth;
    if (gender) clientData.gender = gender;
    if (referralSource) clientData.referralSource = referralSource;
    if (referredBy) clientData.referredBy = referredBy;
    if (socialMedia) clientData.socialMedia = socialMedia;
    if (marketingConsent) clientData.marketingConsent = marketingConsent;
    if (communicationPreference) clientData.communicationPreference = communicationPreference;
    if (preferences) clientData.preferences = preferences;

    const client = await Client.create(clientData);

    res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    logger.error(`Create client error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getClients = async (req, res) => {
  try {
    const { category, search } = req.query;
    
    const filter = { tenantId: req.tenantId };
    
    if (category) filter.category = category;
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const clients = await Client.find(filter)
      .sort({ lastVisit: -1 });

    res.json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    logger.error(`Get clients error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getClient = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    logger.error(`Get client error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const allowedUpdates = ['firstName', 'lastName', 'email', 'phone', 'marketingConsent', 'preferences'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(client, updates);
    await client.save();

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    logger.error(`Update client error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    await client.deleteOne();

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete client error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
