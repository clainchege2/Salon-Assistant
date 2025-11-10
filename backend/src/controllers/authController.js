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
    const { businessName, email, phone, password, firstName, lastName, country, tenantSlug, role } = req.body;

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
      tenant = await Tenant.create({
        businessName,
        slug: `${slug}-${Date.now()}`,
        contactEmail: email,
        contactPhone: phone,
        country: country || 'Kenya',
        status: 'active',
        subscriptionTier: 'free'
      });
      isNewTenant = true;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either businessName or tenantSlug is required'
      });
    }

    // Create user
    const user = await User.create({
      tenantId: tenant._id,
      email,
      phone,
      password,
      firstName,
      lastName,
      role: role || (isNewTenant ? 'owner' : 'stylist')
    });

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    if (isNewTenant) {
      logger.info(`New tenant registered: ${tenant.businessName}`);
    } else {
      logger.info(`New staff member added to ${tenant.businessName}: ${firstName} ${lastName}`);
    }

    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        tenantId: tenant._id,
        businessName: tenant.businessName
      }
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
    const { email, password, tenantSlug } = req.body;

    console.log('Login attempt:', { email, tenantSlug });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find tenant
    const tenant = await Tenant.findOne({ slug: tenantSlug });
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

    // Find user
    const user = await User.findOne({ 
      email, 
      tenantId: tenant._id 
    }).select('+password');

    console.log('User found:', !!user);
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Compare password - use bcrypt directly for compatibility
    console.log('Comparing password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Password mismatch');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Contact your administrator.'
      });
    }

    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

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
        businessName: tenant.businessName,
        subscriptionTier: tenant.subscriptionTier
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
      businessName: tenant.businessName,
      subscriptionTier: tenant.subscriptionTier,
      tenant: {
        _id: tenant._id,
        businessName: tenant.businessName,
        subscriptionTier: tenant.subscriptionTier,
        status: tenant.status
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
