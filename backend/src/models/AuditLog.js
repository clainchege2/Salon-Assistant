const mongoose = require('mongoose');

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
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'BULK_DELETE', 'BULK_UPDATE'],
    index: true
  },
  resource: {
    type: String,
    required: true,
    index: true
    // e.g., 'Client', 'Booking', 'User', 'Service'
  },
  resourceId: {
    type: String,
    index: true
    // ID of the resource being accessed
  },
  changes: {
    type: mongoose.Schema.Types.Mixed
    // What changed (for UPDATE actions)
  },
  metadata: {
    method: String, // HTTP method
    endpoint: String, // API endpoint
    userAgent: String,
    ip: String,
    duration: Number, // Request duration in ms
    statusCode: Number
  },
  errorMessage: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
    expires: 7776000 // Auto-delete after 90 days (TTL index)
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

module.exports = mongoose.model('AuditLog', auditLogSchema);
