const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

// Admin authentication for developer portal
exports.protectAdmin = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.ADMIN_SECRET_KEY);

    if (decoded.role !== 'admin') {
      logger.warn(`Unauthorized admin access attempt from IP: ${req.ip}`);
      return res.status(403).json({
        success: false,
        message: 'Admin access denied'
      });
    }

    req.admin = decoded;
    
    // Log all admin actions
    logger.info({
      adminAction: req.method + ' ' + req.path,
      adminId: decoded.id,
      ip: req.ip,
      timestamp: new Date()
    });

    next();
  } catch (error) {
    logger.error(`Admin auth error: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid admin token'
    });
  }
};
