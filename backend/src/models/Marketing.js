const mongoose = require('mongoose');
const tenantIsolationPlugin = require('../plugins/tenantIsolation');

const marketingSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['offer', 'announcement', 'reminder', 'promotion', 'special', 'custom', 'dayOfWeek'],
    required: true
  },
  occasion: {
    type: String,
    enum: ['birthday', 'anniversary', 'holiday', null],
    default: null
  },
  targetAudience: {
    categories: [{
      type: String,
      enum: ['new', 'vip', 'usual', 'longtime-no-see', 'all']
    }],
    specificClients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client'
    }],
    targetType: {
      type: String,
      enum: ['all', 'segment', 'individual', 'dayOfWeek', 'occasion'],
      default: 'all'
    },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', null],
      default: null
    }
  },
  channel: {
    type: String,
    enum: ['sms', 'portal', 'both'],
    default: 'portal'
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'failed'],
    default: 'draft'
  },
  scheduledFor: Date,
  sentAt: Date,
  expiresAt: Date,
  offerDetails: {
    discountPercentage: Number,
    validUntil: Date,
    termsAndConditions: String
  },
  stats: {
    totalSent: { type: Number, default: 0 },
    totalViewed: { type: Number, default: 0 },
    totalClicked: { type: Number, default: 0 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

marketingSchema.index({ tenantId: 1, status: 1 });
marketingSchema.index({ tenantId: 1, scheduledFor: 1 });

// Apply tenant isolation plugin
marketingSchema.plugin(tenantIsolationPlugin);

module.exports = mongoose.model('Marketing', marketingSchema);
