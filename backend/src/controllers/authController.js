const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const logger = require('../config/logger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE
  });
};

exports.register = async (req, res) => {
  try {
    const { businessName, email, phone, password, firstName, lastName, country, tenantSlug, role, twoFactorMethod, subscriptionTier } = req.body;

    let tenant;
    let isNewTenant = false;

    // Check if this is adding staff to existing tenant or creating new tenant
    if (tenantSlug) {
      // Adding staff to existing tenant
      tenant = await Tenant.findOne({ slug: tenantSlug });
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found'
        });
      }
    } else if (businessName) {
      // Creating new tenant
      const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Validate subscription tier
      const validTiers = ['free', 'pro', 'premium'];
      const selectedTier = subscriptionTier && validTiers.includes(subscriptionTier) ? subscriptionTier : 'free';
      
      tenant = await Tenant.create({
        businessName,
        slug: `${slug}-${Date.now()}`,
        contactEmail: email,
        contactPhone: phone,
        country: country || 'Kenya',
        status: 'active',
        subscriptionTier: selectedTier
      });
      isNewTenant = true;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either businessName or tenantSlug is required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email, tenantId: tenant._id });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user with pending verification status
    const user = await User.create({
      tenantId: tenant._id,
      email,
      phone,
      password,
      firstName,
      lastName,
      role: role || (isNewTenant ? 'owner' : 'stylist'),
      status: 'pending-verification',
      twoFactorEnabled: true,
      twoFactorMethod: twoFactorMethod || 'sms'
    });

    // Send 2FA code
    const twoFactorService = require('../services/twoFactorService');
    const contact = twoFactorMethod === 'email' ? email : phone;
    
    const twoFactorResult = await twoFactorService.sendCode({
      userId: user._id,
      userModel: 'User',
      tenantId: tenant._id,
      method: twoFactorMethod || 'sms',
      contact,
      purpose: 'registration',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    if (isNewTenant) {
      logger.info(`New tenant registered: ${tenant.businessName} (${tenant.slug}) - Verification pending`);
      console.log(`\n🎉 NEW TENANT CREATED`);
      console.log(`Business: ${tenant.businessName}`);
      console.log(`Slug: ${tenant.slug}`);
      console.log(`Owner: ${firstName} ${lastName}`);
      console.log(`Email: ${email}\n`);
    } else {
      logger.info(`New staff member added to ${tenant.businessName}: ${firstName} ${lastName} - Verification pending`);
    }

    res.status(201).json({
      success: true,
      requiresVerification: true,
      twoFactorId: twoFactorResult.twoFactorId,
      method: twoFactorResult.method,
      sentTo: twoFactorResult.sentTo,
      expiresAt: twoFactorResult.expiresAt,
      tenantSlug: tenant.slug, // Include slug in response
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        tenantId: tenant._id,
        businessName: tenant.businessName
      },
      message: 'Registration successful. Please verify your account with the code sent to your ' + (twoFactorMethod === 'email' ? 'email' : 'phone')
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, tenantSlug, twoFactorCode, twoFactorId } = req.body;

    console.log('Login attempt:', { email, tenantSlug, has2FA: !!twoFactorCode });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user first (to get tenantId for audit logging even if tenant lookup fails)
    let user;
    let tenant;
    
    if (tenantSlug) {
      // Find tenant
      tenant = await Tenant.findOne({ slug: tenantSlug });
      console.log('Tenant found:', !!tenant);
      if (!tenant) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      if (tenant.status === 'delisted' || tenant.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Account is not active. Please contact support.'
        });
      }

      // Find user for this tenant
      user = await User.findOne({ 
        email, 
        tenantId: tenant._id 
      }).select('+password');
    } else {
      // No tenant slug provided - try to find user by email alone
      user = await User.findOne({ email }).select('+password');
      
      if (user) {
        // Get the user's tenant
        tenant = await Tenant.findById(user.tenantId);
      }
    }

    console.log('User found:', !!user);
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    if (!tenant) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
      return res.status(403).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
      });
    }

    // Compare password - use bcrypt directly for compatibility
    console.log('Comparing password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Password mismatch');
      
      // Track failed login attempt
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.lastFailedLogin = Date.now();
      
      // Log failed login attempt for audit
      try {
        const AuditLog = require('../models/AuditLog');
        await AuditLog.create({
          tenantId: user.tenantId,
          userId: user._id,
          action: 'LOGIN_ATTEMPT',
          resource: 'Auth',
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
              email: email,
              password: '[REDACTED]'
            }
          },
          errorMessage: 'Invalid credentials'
        });
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError);
      }
      
      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.accountLockedUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
        await user.save();
        
        return res.status(403).json({
          success: false,
          message: 'Account locked due to multiple failed login attempts. Please try again in 15 minutes.'
        });
      }
      
      await user.save();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0) {
      user.failedLoginAttempts = 0;
      user.accountLockedUntil = null;
      user.lastFailedLogin = null;
    }

    // Check if account is pending verification
    if (user.status === 'pending-verification') {
      return res.status(403).json({
        success: false,
        error: 'PENDING_VERIFICATION',
        message: 'Please verify your account first',
        userId: user._id
      });
    }

    if (user.status === 'blocked' || user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Contact your administrator.'
      });
    }

    // Check if 2FA is enabled - always enforce in production
    const skipTwoFactor = false; // Never skip 2FA for security
    
    if (user.twoFactorEnabled && !skipTwoFactor) {
      // If 2FA code provided, verify it
      if (twoFactorCode && twoFactorId) {
        const twoFactorService = require('../services/twoFactorService');
        const verifyResult = await twoFactorService.verifyCode(twoFactorId, twoFactorCode);

        if (!verifyResult.success) {
          return res.status(400).json(verifyResult);
        }

        // 2FA verified, proceed with login
      } else {
        // Send 2FA code
        const twoFactorService = require('../services/twoFactorService');
        const contact = user.twoFactorMethod === 'email' ? user.email : user.phone;
        
        const twoFactorResult = await twoFactorService.sendCode({
          userId: user._id,
          userModel: 'User',
          tenantId: tenant._id,
          method: user.twoFactorMethod,
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
          message: 'Verification code sent. Please check your ' + (user.twoFactorMethod === 'email' ? 'email' : 'phone')
        });
      }
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Log successful login for audit
    try {
      const AuditLog = require('../models/AuditLog');
      await AuditLog.create({
        tenantId: user.tenantId,
        userId: user._id,
        action: 'LOGIN_ATTEMPT',
        resource: 'Auth',
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
            email: email,
            password: '[REDACTED]'
          }
        }
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions,
        tenantId: tenant._id,
        tenantSlug: tenant.slug,
        businessName: tenant.businessName,
        subscriptionTier: tenant.subscriptionTier,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorMethod: user.twoFactorMethod
      },
      tenant: {
        id: tenant._id,
        businessName: tenant.businessName,
        slug: tenant.slug,
        country: tenant.country,
        settings: {
          currency: tenant.settings?.currency || 'KES',
          timezone: tenant.settings?.timezone || 'Africa/Nairobi',
          locale: tenant.settings?.locale
        }
      }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.fixMyPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Force update permissions based on role
    if (user.role === 'owner') {
      user.permissions = {
        canViewCommunications: true,
        canViewMarketing: true,
        canDeleteBookings: true,
        canDeleteClients: true,
        canManageStaff: true,
        canManageServices: true,
        canManageInventory: true,
        canViewReports: true
      };
      await user.save({ validateBeforeSave: false });
      
      logger.info(`Permissions fixed for owner: ${user._id}`);
      
      return res.json({
        success: true,
        message: 'Permissions updated successfully',
        permissions: user.permissions
      });
    }

    res.json({
      success: true,
      message: 'No changes needed',
      permissions: user.permissions
    });
  } catch (error) {
    logger.error(`Fix permissions error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const newToken = generateToken(user._id);

    res.json({
      success: true,
      token: newToken
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};


// Logout user
exports.logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side by removing the token
    // But we can log the event for audit purposes
    logger.info(`User logged out: ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get current logged in user
exports.getMe = async (req, res) => {
  try {
    // req.user is already set by protect middleware
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Fetch tenant information to include subscription tier
    const tenant = await Tenant.findById(user.tenantId);
    
    // Create user object without password
    const userData = {
      id: user._id,
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      permissions: user.permissions,
      status: user.status,
      tenantId: user.tenantId,
      tenantSlug: tenant.slug,
      businessName: tenant.businessName,
      subscriptionTier: tenant.subscriptionTier,
      tenant: {
        _id: tenant._id,
        businessName: tenant.businessName,
        slug: tenant.slug,
        subscriptionTier: tenant.subscriptionTier,
        status: tenant.status,
        country: tenant.country,
        settings: {
          currency: tenant.settings?.currency || 'KES',
          timezone: tenant.settings?.timezone || 'Africa/Nairobi',
          locale: tenant.settings?.locale
        }
      }
    };

    res.json({
      success: true,
      user: userData,
      data: userData
    });
  } catch (error) {
    logger.error(`Get me error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
