const logger = require('../config/logger');

// Critical middleware to ensure data isolation between tenants
exports.enforceTenantIsolation = (req, res, next) => {
  if (!req.tenantId) {
    logger.error('Tenant isolation violation: No tenantId in request');
    return res.status(403).json({
      success: false,
      message: 'Tenant context required'
    });
  }

  // Set tenant filter for use in controllers
  req.tenantFilter = { tenantId: req.tenantId };
  
  next();
};

// Validate that resource belongs to tenant
exports.validateResourceOwnership = (Model) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const resource = await Model.findOne({
        _id: resourceId,
        tenantId: req.tenantId
      });

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      logger.error(`Resource ownership validation error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Error validating resource ownership'
      });
    }
  };
};
