const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const logger = require('../config/logger');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Verify token - this will throw an error if expired or invalid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Validate that token's tenantId matches user's actual tenantId (prevent token manipulation)
    if (decoded.tenantId && decoded.tenantId.toString() !== user.tenantId.toString()) {
      logger.warn(`Token manipulation detected: User ${user._id} token has tenantId ${decoded.tenantId} but user belongs to ${user.tenantId}`);
      return res.status(403).json({
        success: false,
        message: 'Token validation failed'
      });
    }

    // Check tenant status
    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant || tenant.status === 'delisted' || tenant.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Tenant account is not active'
      });
    }

    req.user = user;
    req.tenantId = user.tenantId;
    
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      logger.warn(`Expired token attempt: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
        error: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      logger.warn(`Invalid token attempt: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
        error: 'INVALID_TOKEN'
      });
    }
    
    logger.error(`Auth error: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

exports.checkPermission = (permission) => {
  return (req, res, next) => {
    // Owner has all permissions
    if (req.user.role === 'owner') {
      return next();
    }
    
    // Check if user has the specific permission set to true
    if (req.user.permissions && req.user.permissions[permission] === true) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action'
    });
  };
};

// Combined tier + permission check
exports.checkTierAndPermission = (requiredTier, permission) => {
  return async (req, res, next) => {
    try {
      // Get tenant to check tier
      const Tenant = require('../models/Tenant');
      const tenant = await Tenant.findById(req.tenantId);
      
      if (!tenant) {
        return res.status(403).json({
          success: false,
          message: 'Tenant not found'
        });
      }

      // Check if tenant tier allows this feature
      const tierLevels = { free: 0, pro: 1, premium: 2 };
      const tenantLevel = tierLevels[tenant.subscriptionTier] || 0;
      const requiredLevel = tierLevels[requiredTier] || 0;

      if (tenantLevel < requiredLevel) {
        return res.status(403).json({
          success: false,
          message: `This feature requires ${requiredTier.toUpperCase()} tier subscription`,
          upgradeRequired: true,
          currentTier: tenant.subscriptionTier,
          requiredTier: requiredTier
        });
      }

      // Tier check passed, now check user permission
      // Owner always has access
      if (req.user.role === 'owner') {
        logger.info(`Owner access granted for ${permission}`);
        return next();
      }

      // Check if user has the specific permission granted by owner
      if (req.user.permissions && req.user.permissions[permission]) {
        logger.info(`Permission ${permission} granted for user ${req.user._id}`);
        return next();
      }

      logger.warn(`Permission denied: User ${req.user._id} (${req.user.role}) lacks ${permission}`);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this feature. Contact your salon owner.',
        permissionRequired: permission,
        userRole: req.user.role,
        userPermissions: req.user.permissions
      });

    } catch (error) {
      logger.error(`Permission check error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };
};
