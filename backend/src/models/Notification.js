const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['new_client', 'new_booking', 'cancellation', 'birthday', 'low_stock', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  actionUrl: {
    type: String
  },
  actionLabel: {
    type: String
  },
  relatedClient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  relatedBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  readBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ tenantId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ tenantId: 1, type: 1, createdAt: -1 });

// Auto-delete read notifications after 30 days
notificationSchema.index(
  { readAt: 1 },
  { 
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
    partialFilterExpression: { read: true }
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
