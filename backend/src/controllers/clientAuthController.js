const Client = require('../models/Client');
const Tenant = require('../models/Tenant');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Get all salons
// @route   GET /api/v1/client-auth/salons
// @access  Public
exports.getSalons = async (req, res) => {
  try {
    const salons = await Tenant.find({ status: 'active' })
      .select('businessName slug address phone email')
      .sort({ businessName: 1 });

    res.json({
      success: true,
      count: salons.length,
      data: salons
    });
  } catch (error) {
    logger.error(`Get salons error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Register new client
// @route   POST /api/v1/client-auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, phone, email, dateOfBirth, password, tenantSlug, twoFactorMethod } = req.body;

    // Validation
    if (!firstName || !lastName || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Require salon selection
    if (!tenantSlug) {
      return res.status(400).json({
        success: false,
        message: 'Please select a salon'
      });
    }

    // Get tenant
    const tenant = await Tenant.findOne({ slug: tenantSlug, status: 'active' });
    if (!tenant) {
      return res.status(400).json({
        success: false,
        message: 'Salon not found or inactive'
      });
    }

    // Check if client already exists for this tenant
    const existingClient = await Client.findOne({ phone, tenantId: tenant._id });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'A client with this phone number already exists at this salon'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create client with pending verification
    const client = await Client.create({
      tenantId: tenant._id,
      firstName,
      lastName,
      phone,
      email: email || undefined,
      dateOfBirth: dateOfBirth || undefined,
      password: hashedPassword,
      accountStatus: 'pending-verification',
      category: 'new',
      totalVisits: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
      twoFactorEnabled: true,
      twoFactorMethod: twoFactorMethod || (email ? 'email' : 'sms'),
      marketingConsent: {
        sms: true,
        email: !!email,
        whatsapp: true
      }
    });

    // Send 2FA code
    const twoFactorService = require('../services/twoFactorService');
    const contact = (twoFactorMethod === 'email' || (!twoFactorMethod && email)) ? email : phone;
    const method = (twoFactorMethod === 'email' || (!twoFactorMethod && email)) ? 'email' : 'sms';
    
    const twoFactorResult = await twoFactorService.sendCode({
      userId: client._id,
      userModel: 'Client',
      tenantId: tenant._id,
      method,
      contact,
      purpose: 'registration',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Remove password from response
    const clientData = client.toObject();
    delete clientData.password;

    logger.info(`New client registered: ${client.phone} - Verification pending`);

    res.status(201).json({
      success: true,
      requiresVerification: true,
      twoFactorId: twoFactorResult.twoFactorId,
      method: twoFactorResult.method,
      sentTo: twoFactorResult.sentTo,
      expiresAt: twoFactorResult.expiresAt,
      data: clientData,
      message: 'Registration successful. Please verify your account with the code sent to your ' + (method === 'email' ? 'email' : 'phone')
    });
  } catch (error) {
    logger.error(`Client registration error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login client
// @route   POST /api/v1/client-auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { phone, password, tenantSlug } = req.body;

    // Validation
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone number and password'
      });
    }

    // Require salon selection
    if (!tenantSlug) {
      return res.status(400).json({
        success: false,
        message: 'Please select a salon'
      });
    }

    // Get tenant
    const tenant = await Tenant.findOne({ slug: tenantSlug, status: 'active' });
    if (!tenant) {
      return res.status(400).json({
        success: false,
        message: 'Salon not found or inactive'
      });
    }

    // Find client for this tenant
    const client = await Client.findOne({ phone, tenantId: tenant._id }).select('+password');
    
    if (!client) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password exists (some clients might not have passwords yet)
    if (!client.password) {
      return res.status(401).json({
        success: false,
        message: 'Please contact the salon to set up your account'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, client.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(client._id);

    // Remove password from response
    const clientData = client.toObject();
    delete clientData.password;

    logger.info(`Client logged in: ${client.phone}`);

    res.json({
      success: true,
      token,
      data: clientData
    });
  } catch (error) {
    logger.error(`Client login error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current client
// @route   GET /api/v1/client-auth/me
// @access  Private (Client)
exports.getMe = async (req, res) => {
  try {
    const client = await Client.findById(req.client.id).select('-password');
    
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

// @desc    Update client profile
// @route   PUT /api/v1/client-auth/profile
// @access  Private (Client)
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, dateOfBirth, gender } = req.body;

    const client = await Client.findById(req.client.id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Update fields
    if (firstName) client.firstName = firstName;
    if (lastName) client.lastName = lastName;
    if (email !== undefined) client.email = email;
    if (dateOfBirth) client.dateOfBirth = dateOfBirth;
    if (gender) client.gender = gender;

    await client.save();

    // Remove password from response
    const clientData = client.toObject();
    delete clientData.password;

    logger.info(`Client profile updated: ${client.phone}`);

    res.json({
      success: true,
      data: clientData
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Change password
// @route   PUT /api/v1/client-auth/change-password
// @access  Private (Client)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const client = await Client.findById(req.client.id).select('+password');
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, client.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    client.password = await bcrypt.hash(newPassword, salt);

    await client.save();

    logger.info(`Client password changed: ${client.phone}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error(`Change password error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
