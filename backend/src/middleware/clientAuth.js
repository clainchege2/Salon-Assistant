const jwt = require('jsonwebtoken');
const Client = require('../models/Client');

// Protect client routes
exports.protectClient = async (req, res, next) => {
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

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get client from token
    req.client = await Client.findById(decoded.id).select('-password');

    if (!req.client) {
      return res.status(401).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Validate that token's tenantId matches client's actual tenantId (prevent token manipulation)
    if (decoded.tenantId && decoded.tenantId.toString() !== req.client.tenantId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Token validation failed'
      });
    }

    // Set tenantId for tenant isolation
    req.tenantId = req.client.tenantId;

    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
        error: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
        error: 'INVALID_TOKEN'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};
