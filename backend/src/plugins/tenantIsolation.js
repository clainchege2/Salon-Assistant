/**
 * Mongoose Plugin for Automatic Tenant Isolation
 * 
 * This plugin automatically injects tenantId into all queries,
 * preventing human error and ensuring data isolation.
 * 
 * Usage:
 *   schema.plugin(tenantIsolationPlugin);
 * 
 * In controllers:
 *   Model.find().setOptions({ tenantId: req.tenantId })
 *   // or
 *   Model.findByTenant(req.tenantId, { status: 'active' })
 */

const logger = require('../config/logger');

module.exports = function tenantIsolationPlugin(schema, options = {}) {
  // Query types to intercept
  const queryTypes = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'findOneAndDelete',
    'findOneAndRemove',
    'findOneAndReplace',
    'count',
    'countDocuments',
    'estimatedDocumentCount',
    'deleteOne',
    'deleteMany',
    'updateOne',
    'updateMany'
  ];

  // Add pre-query hooks
  queryTypes.forEach(queryType => {
    schema.pre(queryType, function(next) {
      // Skip if explicitly disabled
      if (this.options.skipTenantFilter) {
        logger.debug(`Tenant filter skipped for ${queryType}`);
        return next();
      }

      // Get current filter
      const filter = this.getFilter();

      // If tenantId not in filter and we have it in options
      if (!filter.tenantId && this.options.tenantId) {
        this.where({ tenantId: this.options.tenantId });
        logger.debug(`Auto-injected tenantId into ${queryType} query`);
      }

      next();
    });
  });

  // Add pre-save hook to ensure tenantId is set
  schema.pre('save', function(next) {
    // If tenantId not set and we have it in locals
    if (!this.tenantId && this.$locals.tenantId) {
      this.tenantId = this.$locals.tenantId;
      logger.debug('Auto-set tenantId on save');
    }

    // Validate tenantId is present
    if (!this.tenantId && !this.isNew) {
      logger.warn('Document saved without tenantId!', {
        model: this.constructor.modelName,
        id: this._id
      });
    }

    next();
  });

  // Static method: Find by tenant
  schema.statics.findByTenant = function(tenantId, conditions = {}, projection = null, options = {}) {
    if (!tenantId) {
      throw new Error('tenantId is required for findByTenant');
    }
    return this.find({ ...conditions, tenantId }, projection, options);
  };

  // Static method: Find one by tenant
  schema.statics.findOneByTenant = function(tenantId, conditions = {}, projection = null, options = {}) {
    if (!tenantId) {
      throw new Error('tenantId is required for findOneByTenant');
    }
    return this.findOne({ ...conditions, tenantId }, projection, options);
  };

  // Static method: Find by ID with tenant check
  schema.statics.findByIdAndTenant = function(id, tenantId, projection = null, options = {}) {
    if (!tenantId) {
      throw new Error('tenantId is required for findByIdAndTenant');
    }
    return this.findOne({ _id: id, tenantId }, projection, options);
  };

  // Static method: Count by tenant
  schema.statics.countByTenant = function(tenantId, conditions = {}) {
    if (!tenantId) {
      throw new Error('tenantId is required for countByTenant');
    }
    return this.countDocuments({ ...conditions, tenantId });
  };

  // Static method: Update by tenant
  schema.statics.updateByTenant = function(tenantId, conditions, update, options = {}) {
    if (!tenantId) {
      throw new Error('tenantId is required for updateByTenant');
    }
    return this.updateMany({ ...conditions, tenantId }, update, options);
  };

  // Static method: Delete by tenant
  schema.statics.deleteByTenant = function(tenantId, conditions = {}) {
    if (!tenantId) {
      throw new Error('tenantId is required for deleteByTenant');
    }
    return this.deleteMany({ ...conditions, tenantId });
  };

  // Instance method: Verify tenant ownership
  schema.methods.belongsToTenant = function(tenantId) {
    if (!this.tenantId) {
      return false;
    }
    return this.tenantId.toString() === tenantId.toString();
  };

  // Instance method: Verify and throw if not owned
  schema.methods.verifyTenantOwnership = function(tenantId) {
    if (!this.belongsToTenant(tenantId)) {
      const error = new Error('Resource does not belong to tenant');
      error.statusCode = 404; // Return 404 instead of 403 to not leak info
      throw error;
    }
    return true;
  };

  // Add index on tenantId if not already present
  if (!schema.path('tenantId')) {
    logger.warn(`Schema ${schema.options.collection} does not have tenantId field`);
  }
};
