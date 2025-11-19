const mongoose = require('mongoose');
const tenantIsolationPlugin = require('../plugins/tenantIsolation');

const notificationSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['booking_created', 'booking_cancelled', 'booking_confirmed', 'booking_completed', 'feedback_received', 'low_stock', 'service_suggestion'],
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
  relatedBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  relatedClient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Index for faster queries
notificationSchema.index({ tenantId: 1, recipientId: 1, isRead: 1, createdAt: -1 });

// Apply tenant isolation plugin
notificationSchema.plugin(tenantIsolationPlugin);

module.exports = mongoose.model('Notification', notificationSchema);
