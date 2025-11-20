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

// Generate specific action name based on method and resource
const generateActionName = (method, resource, endpoint) => {
  const baseAction = ACTION_MAP[method] || method;
  
  // Special cases for auth endpoints
  if (resource === 'Auth') {
    if (endpoint.includes('/login')) return 'LOGIN_ATTEMPT';
    if (endpoint.includes('/logout')) return 'LOGOUT';
    if (endpoint.includes('/register')) return 'REGISTER';
    if (endpoint.includes('/refresh')) return 'REFRESH_TOKEN';
    if (endpoint.includes('/permission')) return 'UPDATE_USER_PERMISSIONS';
    return baseAction;
  }
  
  // Special cases for client auth endpoints
  if (resource === 'ClientAuth') {
    if (endpoint.includes('/login')) return 'CLIENT_LOGIN_ATTEMPT';
    if (endpoint.includes('/register')) return 'CLIENT_REGISTER';
    if (endpoint.includes('/profile')) return 'UPDATE_CLIENT_PROFILE';
    if (endpoint.includes('/password')) return 'CHANGE_CLIENT_PASSWORD';
    return baseAction;
  }
  
  // Special cases for reports
  if (resource === 'Report' && endpoint.includes('/export')) {
    if (endpoint.includes('/bookings')) return 'EXPORT_BOOKINGS_REPORT';
    if (endpoint.includes('/clients')) return 'EXPORT_CLIENTS_REPORT';
    if (endpoint.includes('/financial')) return 'EXPORT_FINANCIAL_REPORT';
    return 'EXPORT_REPORT';
  }
  
  // Special cases for user management
  if (resource === 'User') {
    if (endpoint.includes('/role')) return 'UPDATE_USER_ROLE';
    if (endpoint.includes('/permission')) return 'UPDATE_USER_PERMISSIONS';
    if (method === 'DELETE') return 'DELETE_USER';
    if (method === 'PUT' || method === 'PATCH') return 'UPDATE_USER';
    if (method === 'POST') return 'CREATE_USER';
    return baseAction;
  }
  
  // Generate action name like CREATE_CLIENT, UPDATE_BOOKING, DELETE_SERVICE
  return `${baseAction}_${resource.toUpperCase()}`;
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
        const endpoint = req.originalUrl || req.url;
        const action = generateActionName(req.method, resource, endpoint);
        
        // Determine resource ID
        let resourceId = req.params.id;
        if (!resourceId && responseData?.data?._id) {
          resourceId = responseData.data._id;
        }
        
        // Determine risk level based on action and status
        let riskLevel = 'LOW';
        let severity = 'LOW';
        
        if (res.statusCode >= 400) {
          riskLevel = 'HIGH';
          severity = 'HIGH';
        }
        
        if (action === 'DELETE' || options.sensitive) {
          riskLevel = 'HIGH';
          severity = 'HIGH';
        }
        
        if (options.critical || resource === 'User' && (action === 'DELETE' || req.url.includes('permission') || req.url.includes('role'))) {
          riskLevel = 'CRITICAL';
          severity = 'CRITICAL';
        }
        
        // Prepare audit log entry
        const auditEntry = {
          tenantId: req.tenantId,
          userId: req.user._id,
          action,
          resource,
          resourceId,
          riskLevel,
          severity,
          statusCode: res.statusCode,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('user-agent'),
          responseTime: duration,
          details: {
            method: req.method,
            endpoint: req.originalUrl || req.url,
            correlationId: req.headers['x-correlation-id'] || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            resourceId: resourceId, // Also include in details for test compatibility
            body: req.method !== 'GET' && req.body ? { ...req.body } : undefined
          },
          metadata: {
            method: req.method,
            endpoint: req.originalUrl || req.url,
            userAgent: req.get('user-agent'),
            ip: req.ip || req.connection?.remoteAddress,
            duration,
            statusCode: res.statusCode
          }
        };
        
        // Sanitize sensitive data in details.body
        if (auditEntry.details.body) {
          if (auditEntry.details.body.password) {
            auditEntry.details.body.password = '[REDACTED]';
          }
          if (auditEntry.details.body.token) {
            auditEntry.details.body.token = '[REDACTED]';
          }
        }
        
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


// Export all functions
module.exports = {
  auditLog: exports.auditLog,
  auditAuth: exports.auditAuth,
  getAuditLogs: exports.getAuditLogs,
  getAuditSummary: exports.getAuditSummary,
  getUserActivity: exports.getUserActivity,
  getResourceHistory: exports.getResourceHistory
};
