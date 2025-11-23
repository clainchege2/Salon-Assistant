const Client = require('../models/Client');
const Tenant = require('../models/Tenant');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '8h' // 8 hours - standard session timeout
  });
};

// @desc    Get all salons
// @route   GET /api/v1/client-auth/salons
// @access  Public
exports.getSalons = async (req, res) => {
  try {
    const { search, limit = 20, page = 1 } = req.query;
    
    // Build query
    const query = { status: 'active' };
    
    // Add search filter if provided
    if (search && search.length >= 2) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const maxLimit = Math.min(parseInt(limit), 50); // Cap at 50
    
    // Get salons with minimal info
    const salons = await Tenant.find(query)
      .select('businessName slug') // Only essential fields
      .sort({ businessName: 1 })
      .limit(maxLimit)
      .skip(skip);

    // Get total count for pagination
    const total = await Tenant.countDocuments(query);

    res.json({
      success: true,
      count: salons.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / maxLimit),
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

    // Check if verified client already exists for this tenant
    const existingClient = await Client.findOne({ 
      phone, 
      tenantId: tenant._id,
      accountStatus: { $ne: 'pending-verification' }
    });
    
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'A client with this phone number already exists at this salon'
      });
    }

    // Delete any old unverified clients with same phone (cleanup failed registrations)
    await Client.deleteMany({
      phone,
      tenantId: tenant._id,
      accountStatus: 'pending-verification'
    });

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
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let message = 'This information is already registered';
      
      if (field === 'email') {
        message = 'This email address is already registered with another salon';
      } else if (field === 'phone') {
        message = 'This phone number is already registered with another salon';
      }
      
      return res.status(400).json({
        success: false,
        message,
        field
      });
    }
    
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
    const { phone, password, tenantSlug, twoFactorCode, twoFactorId } = req.body;

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
      // Log failed login attempt for audit
      try {
        const AuditLog = require('../models/AuditLog');
        await AuditLog.create({
          tenantId: client.tenantId,
          userId: client._id,
          action: 'CLIENT_LOGIN_ATTEMPT',
          resource: 'ClientAuth',
          riskLevel: 'HIGH',
          severity: 'HIGH',
          statusCode: 401,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('user-agent'),
          details: {
            method: req.method,
            endpoint: req.originalUrl || req.url,
            correlationId: req.headers['x-correlation-id'] || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            body: {
              phone: phone,
              password: '[REDACTED]'
            }
          },
          errorMessage: 'Invalid credentials'
        });
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError);
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is pending verification - allow re-verification
    if (client.accountStatus === 'pending-verification') {
      // Send new 2FA code for verification
      const twoFactorService = require('../services/twoFactorService');
      const contact = client.twoFactorMethod === 'email' ? client.email : client.phone;
      
      const twoFactorResult = await twoFactorService.sendCode({
        userId: client._id,
        userModel: 'Client',
        tenantId: tenant._id,
        method: client.twoFactorMethod || 'sms',
        contact,
        purpose: 'registration',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      return res.status(403).json({
        success: false,
        error: 'PENDING_VERIFICATION',
        message: 'Your account needs verification. A new code has been sent.',
        requiresVerification: true,
        twoFactorId: twoFactorResult.twoFactorId,
        method: twoFactorResult.method,
        sentTo: twoFactorResult.sentTo,
        expiresAt: twoFactorResult.expiresAt
      });
    }

    if (client.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact the salon.'
      });
    }

    // Check if device is trusted
    const trustedDeviceService = require('../services/trustedDeviceService');
    const isDeviceTrusted = await trustedDeviceService.isDeviceTrusted(
      client._id,
      'Client',
      tenant._id,
      req
    );

    // Check if 2FA is enabled (skip in development for testing or if device is trusted)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const skipTwoFactor = isDevelopment && req.body.skipTwoFactor === true;
    
    if (client.twoFactorEnabled && !skipTwoFactor && !isDeviceTrusted) {
      // If 2FA code provided, verify it
      if (twoFactorCode && twoFactorId) {
        const twoFactorService = require('../services/twoFactorService');
        const verifyResult = await twoFactorService.verifyCode(twoFactorId, twoFactorCode);

        if (!verifyResult.success) {
          return res.status(400).json(verifyResult);
        }

        // 2FA verified, check if user wants to trust this device
        if (req.body.trustDevice) {
          await trustedDeviceService.trustDevice(
            client._id,
            'Client',
            tenant._id,
            req,
            30 // Trust for 30 days
          );
        }

        // 2FA verified, proceed with login
      } else {
        // Send 2FA code
        const twoFactorService = require('../services/twoFactorService');
        const contact = client.twoFactorMethod === 'email' ? client.email : client.phone;
        
        const twoFactorResult = await twoFactorService.sendCode({
          userId: client._id,
          userModel: 'Client',
          tenantId: tenant._id,
          method: client.twoFactorMethod,
          contact,
          purpose: 'login',
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        });

        return res.json({
          success: true,
          requires2FA: true,
          twoFactorId: twoFactorResult.twoFactorId,
          method: twoFactorResult.method,
          sentTo: twoFactorResult.sentTo,
          expiresAt: twoFactorResult.expiresAt,
          message: 'Verification code sent. Please check your ' + (client.twoFactorMethod === 'email' ? 'email' : 'phone')
        });
      }
    }

    // Update last login
    client.lastVisit = Date.now();
    await client.save();

    // Generate token
    const token = generateToken(client._id);

    // Log successful login for audit
    try {
      const AuditLog = require('../models/AuditLog');
      await AuditLog.create({
        tenantId: client.tenantId,
        userId: client._id,
        action: 'CLIENT_LOGIN_ATTEMPT',
        resource: 'ClientAuth',
        riskLevel: 'LOW',
        severity: 'LOW',
        statusCode: 200,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
        details: {
          method: req.method,
          endpoint: req.originalUrl || req.url,
          correlationId: req.headers['x-correlation-id'] || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          body: {
            phone: phone,
            password: '[REDACTED]'
          }
        }
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

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


// @desc    Verify 2FA code during registration
// @route   POST /api/v1/client-auth/verify
// @access  Public
exports.verify2FA = async (req, res) => {
  try {
    const { twoFactorId, code } = req.body;

    if (!twoFactorId || !code) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor ID and code are required'
      });
    }

    // Verify the 2FA code
    const twoFactorService = require('../services/twoFactorService');
    const result = await twoFactorService.verifyCode(twoFactorId, code);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Invalid verification code'
      });
    }

    // Get the client and activate account
    const client = await Client.findById(result.userId).select('-password');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Activate the account
    const isNewClient = client.accountStatus === 'pending-verification';
    if (isNewClient) {
      client.accountStatus = 'active';
      await client.save();

      // Create notification for salon owner about new client
      try {
        const Notification = require('../models/Notification');
        await Notification.create({
          tenantId: client.tenantId,
          type: 'new_client',
          title: '🎉 New Client Registered',
          message: `${client.firstName} ${client.lastName} just joined! Send them a warm welcome message to make a great first impression.`,
          priority: 'high',
          actionUrl: `/clients/${client._id}`,
          actionLabel: 'Send Welcome Message',
          relatedClient: client._id
        });
        logger.info('New client notification created', { clientId: client._id });
      } catch (notifError) {
        logger.error('Failed to create new client notification:', notifError);
        // Don't fail the registration if notification fails
      }
    }

    // Generate token
    const token = generateToken(client._id);

    logger.info('Client 2FA verification successful', { clientId: client._id });

    res.json({
      success: true,
      token,
      data: client
    });
  } catch (error) {
    logger.error('Client 2FA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
};

// @desc    Resend 2FA code
// @route   POST /api/v1/client-auth/resend
// @access  Public
exports.resend2FA = async (req, res) => {
  try {
    const { twoFactorId } = req.body;

    if (!twoFactorId) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor ID is required'
      });
    }

    // Resend the code
    const twoFactorService = require('../services/twoFactorService');
    const result = await twoFactorService.resendCode(twoFactorId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to resend code'
      });
    }

    logger.info('Client 2FA code resent', { twoFactorId });

    res.json({
      success: true,
      message: 'Verification code resent successfully',
      expiresAt: result.expiresAt
    });
  } catch (error) {
    logger.error('Client 2FA resend error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending code'
    });
  }
};
