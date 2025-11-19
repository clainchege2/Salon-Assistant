const mongoose = require('mongoose');
const tenantIsolationPlugin = require('../plugins/tenantIsolation');

const communicationSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  direction: {
    type: String,
    enum: ['outgoing', 'incoming'],
    required: true,
    default: 'outgoing'
  },
  messageType: {
    type: String,
    enum: [
      'reminder',
      'confirmation',
      'follow-up',
      'birthday',
      'promotion',
      'feedback-request',
      'feedback-response',
      'general',
      'complaint',
      'inquiry',
      'warning',
      'blocked'
    ],
    default: 'general'
  },
  // Legacy support - includes all possible message types for backward compatibility
  type: {
    type: String,
    enum: [
      'feedback', 
      'inquiry', 
      'complaint', 
      'follow-up', 
      'reply',
      'reminder',
      'confirmation',
      'birthday',
      'promotion',
      'feedback-request',
      'feedback-response',
      'general',
      'warning',
      'blocked',
      'thank_you',
      'thank-you'
    ],
  },
  channel: {
    type: String,
    enum: ['portal', 'sms', 'whatsapp', 'email', 'phone'],
    default: 'portal'
  },
  subject: String,
  message: {
    type: String,
    required: true
  },
  template: String,
  templateData: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'replied', 'new', 'resolved'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  requiresAction: {
    type: Boolean,
    default: false
  },
  relatedBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  receivedAt: Date,
  replies: [{
    message: String,
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    repliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: Date
  }],
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  errorMessage: String
}, {
  timestamps: true
});

communicationSchema.index({ tenantId: 1, status: 1 });
communicationSchema.index({ tenantId: 1, clientId: 1 });
communicationSchema.index({ tenantId: 1, messageType: 1 });
communicationSchema.index({ tenantId: 1, direction: 1 });
communicationSchema.index({ tenantId: 1, requiresAction: 1 });

// Apply tenant isolation plugin
communicationSchema.plugin(tenantIsolationPlugin);

module.exports = mongoose.model('Communication', communicationSchema);
