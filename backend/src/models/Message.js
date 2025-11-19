const mongoose = require('mongoose');
const tenantIsolationPlugin = require('../plugins/tenantIsolation');

const messageSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  recipientType: {
    type: String,
    enum: ['individual', 'all', 'segment'],
    default: 'individual'
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  type: {
    type: String,
    enum: ['confirmation', 'reminder', 'thank-you', 'general', 'feedback-response'],
    default: 'general'
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    enum: ['sms', 'email', 'whatsapp', 'app'],
    default: 'app'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'sent'
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ tenantId: 1, recipientId: 1, createdAt: -1 });
messageSchema.index({ tenantId: 1, recipientType: 1, createdAt: -1 });

// Apply tenant isolation plugin
messageSchema.plugin(tenantIsolationPlugin);

module.exports = mongoose.model('Message', messageSchema);
