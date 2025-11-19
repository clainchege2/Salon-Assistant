const mongoose = require('mongoose');
const tenantIsolationPlugin = require('../plugins/tenantIsolation');

const campaignSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['promotion', 'announcement', 'seasonal', 'birthday', 'loyalty'],
    default: 'promotion'
  },
  message: {
    type: String,
    required: true
  },
  discount: {
    type: Number,
    min: 0,
    max: 100
  },
  targetAudience: {
    type: String,
    enum: ['all', 'new', 'regular', 'vip', 'inactive'],
    default: 'all'
  },
  channel: {
    type: String,
    enum: ['sms', 'email', 'whatsapp', 'app', 'all'],
    default: 'app'
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  sentCount: {
    type: Number,
    default: 0
  },
  openedCount: {
    type: Number,
    default: 0
  },
  clickedCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sentAt: Date
}, {
  timestamps: true
});

// Index for faster queries
campaignSchema.index({ tenantId: 1, status: 1, startDate: 1, endDate: 1 });

// Apply tenant isolation plugin
campaignSchema.plugin(tenantIsolationPlugin);

module.exports = mongoose.model('Campaign', campaignSchema);
