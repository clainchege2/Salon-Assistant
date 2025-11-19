const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

// Map HTTP methods to audit actions
const ACTION_MAP = {
  POST: 'CREATE',
  GET: 'READ',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE'
};

/**
 * Audit logging middleware
 * Logs all data access and modifications for compliance
 * 
 * @param {string} resource - Resource type (e.g., 'Client', 'Booking')
 * @param {object} options - Additional options
 */
exports.auditLog = (resource, options = {}) => {
  return async (req, res, next) => {
    // Skip if no user or tenant (public endpoints)
    if (!req.user || !req.tenantId) {
      return next();
    }
    
    const startTime = Date.now();
    
    // Store original methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    
    // Capture response data
    let responseData;
    let responseSent = false;
    
    res.json = function(data) {
      responseData = data;
      responseSent = true;
      return originalJson(data);
    };
    
    res.send = function(data) {
      responseData = data;
      responseSent = true;
      return originalSend(data);
    };
    
    // Log after response is sent
    res.on('finish', async () => {
      try {
        // Only log if response was sent
        if (!responseSent) return;
        
        const duration = Date.now() - startTime;
        const action = ACTION_MAP[req.method] || req.method;
        
        // Determine resource ID
        let resourceId = req.params.id;
        if (!resourceId && responseData?.data?._id) {
          resourceId = responseData.data._id;
        }
        
        // Prepare audit log entry
        const auditEntry = {
          tenantId: req.tenantId,
          userId: req.user._id,
          action,
          resource,
          resourceId,
          metadata: {
            method: req.method,
            endpoint: req.originalUrl || req.url,
            userAgent: req.get('user-agent'),
            ip: req.ip || req.connection?.remoteAddress,
            duration,
            statusCode: res.statusCode
          }
        };
        
        // Add changes for non-GET requests
        if (req.method !== 'GET' && req.body) {
          // Don't log sensitive fields
          const sanitizedBody = { ...req.body };
          delete sanitizedBody.password;
          delete sanitizedBody.token;
          auditEntry.changes = sanitizedBody;
        }
        
        // Add error message for failed requests
        if (res.statusCode >= 400) {
          auditEntry.errorMessage = responseData?.message || 'Request failed';
        }
        
        // Create audit log (async, don't wait)
        AuditLog.create(auditEntry).catch(err => {
          logger.error('Failed to create audit log:', {
            error: err.message,
            tenantId: req.tenantId,
            resource
          });
        });
        
        // Log slow requests
        if (duration > 1000) {
          logger.warn('Slow request logged', {
            endpoint: auditEntry.metadata.endpoint,
            duration,
            tenantId: req.tenantId
          });
        }
        
      } catch (error) {
        logger.error('Audit logging error:', error);
        // Don't throw - logging failure shouldn't break the app
      }
    });
    
    next();
  };
};

/**
 * Audit log for authentication events
 */
exports.auditAuth = (action) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Log after successful response
      if (data.success && req.user) {
        AuditLog.create({
          tenantId: req.user.tenantId || req.tenantId,
          userId: req.user._id,
          action,
          resource: 'Auth',
          metadata: {
            method: req.method,
            endpoint: req.originalUrl,
            userAgent: req.get('user-agent'),
            ip: req.ip || req.connection?.remoteAddress,
            statusCode: res.statusCode
          }
        }).catch(err => {
          logger.error('Failed to create auth audit log:', err);
        });
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Get audit logs for a tenant
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { startDate, endDate, userId, resource, action, page = 1, limit = 100 } = req.query;
    
    const filter = { tenantId: req.tenantId };
    
    // Date range filter
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    // Additional filters
    if (userId) filter.userId = userId;
    if (resource) filter.resource = resource;
    if (action) filter.action = action;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'firstName lastName email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs'
    });
  }
};

/**
 * Get audit log summary/statistics
 */
exports.getAuditSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const summary = await AuditLog.getSummary(req.tenantId, start, end);
    
    // Get total counts
    const totalLogs = await AuditLog.countDocuments({
      tenantId: req.tenantId,
      timestamp: { $gte: start, $lte: end }
    });
    
    // Get unique users
    const uniqueUsers = await AuditLog.distinct('userId', {
      tenantId: req.tenantId,
      timestamp: { $gte: start, $lte: end }
    });
    
    res.json({
      success: true,
      data: {
        summary,
        totalLogs,
        uniqueUsers: uniqueUsers.length,
        dateRange: { start, end }
      }
    });
  } catch (error) {
    logger.error('Get audit summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit summary'
    });
  }
};

/**
 * Get user activity history
 */
exports.getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100 } = req.query;
    
    const activity = await AuditLog.getUserActivity(req.tenantId, userId, parseInt(limit));
    
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    logger.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user activity'
    });
  }
};

/**
 * Get resource history
 */
exports.getResourceHistory = async (req, res) => {
  try {
    const { resource, resourceId } = req.params;
    
    const history = await AuditLog.getResourceHistory(req.tenantId, resource, resourceId);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Get resource history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve resource history'
    });
  }
};
