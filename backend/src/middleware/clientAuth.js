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

    // Set tenantId for tenant isolation
    req.tenantId = req.client.tenantId;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};
