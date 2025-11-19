const mongoose = require('mongoose');
const tenantIsolationPlugin = require('../plugins/tenantIsolation');

const clientUpdateRequestSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  requestedChanges: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  rejectionReason: String
}, {
  timestamps: true
});

// Apply tenant isolation plugin
clientUpdateRequestSchema.plugin(tenantIsolationPlugin);

module.exports = mongoose.model('ClientUpdateRequest', clientUpdateRequestSchema);