const mongoose = require('mongoose');
const tenantIsolationPlugin = require('../plugins/tenantIsolation');

const auditLogSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    index: true
    // Dynamic actions like CREATE_CLIENT, UPDATE_BOOKING, DELETE_USER, LOGIN_ATTEMPT, etc.
    // No enum to allow flexibility
  },
  resource: {
    type: String,
    required: true,
    index: true
    // e.g., 'Client', 'Booking', 'User', 'Service', 'Auth'
  },
  resourceId: {
    type: String,
    index: true
    // ID of the resource being accessed
  },
  // Risk and severity levels
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW',
    index: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  // HTTP response status
  statusCode: {
    type: Number,
    index: true
  },
  // Request details
  ipAddress: String,
  userAgent: String,
  responseTime: Number, // Duration in ms
  // Detailed information
  details: {
    method: String,
    endpoint: String,
    correlationId: String,
    body: mongoose.Schema.Types.Mixed,
    resourceId: String
  },
  changes: {
    type: mongoose.Schema.Types.Mixed
    // What changed (for UPDATE actions)
  },
  // Legacy metadata field (for backward compatibility)
  metadata: {
    method: String,
    endpoint: String,
    userAgent: String,
    ip: String,
    duration: Number,
    statusCode: Number
  },
  errorMessage: String,
  timestamp: {
    type: Date,
    default: Date.now
    // Index defined separately below to avoid duplicate
  }
}, {
  timestamps: false // We use timestamp field instead
});

// Compound indexes for efficient querying
auditLogSchema.index({ tenantId: 1, timestamp: -1 });
auditLogSchema.index({ tenantId: 1, userId: 1, timestamp: -1 });
auditLogSchema.index({ tenantId: 1, resource: 1, timestamp: -1 });
auditLogSchema.index({ tenantId: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ tenantId: 1, resourceId: 1, timestamp: -1 });
auditLogSchema.index({ tenantId: 1, riskLevel: 1, timestamp: -1 });

// TTL index for automatic deletion
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Static method to get audit summary
auditLogSchema.statics.getSummary = async function(tenantId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        tenantId: mongoose.Types.ObjectId(tenantId),
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          resource: '$resource'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = async function(tenantId, userId, limit = 100) {
  return this.find({
    tenantId,
    userId
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('action resource resourceId timestamp metadata.endpoint');
};

// Static method to get resource history
auditLogSchema.statics.getResourceHistory = async function(tenantId, resource, resourceId) {
  return this.find({
    tenantId,
    resource,
    resourceId
  })
    .sort({ timestamp: -1 })
    .populate('userId', 'firstName lastName email')
    .limit(50);
};

// Apply tenant isolation plugin
auditLogSchema.plugin(tenantIsolationPlugin);

module.exports = mongoose.model('AuditLog', auditLogSchema);
