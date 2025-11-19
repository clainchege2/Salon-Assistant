const mongoose = require('mongoose');
const tenantIsolationPlugin = require('../plugins/tenantIsolation');

const bookingSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['walk-in', 'reserved'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  services: [{
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    },
    serviceName: String,
    price: Number,
    duration: Number,
    customization: String
  }],
  stylistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  customerInstructions: String,
  totalPrice: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: Number,
    default: 0
  },
  materialsUsed: [{
    itemName: String,
    quantity: Number,
    unit: String
  }],
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: Date,
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpNote: String,
  followUpDate: Date,
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: Date,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'cancelledByModel'
  },
  cancelledByModel: {
    type: String,
    enum: ['User', 'Client']
  },
  cancellationReason: String,
  cancellationFee: {
    type: Number,
    default: 0
  },
  lateFee: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

bookingSchema.index({ tenantId: 1, scheduledDate: 1 });
bookingSchema.index({ tenantId: 1, clientId: 1 });
bookingSchema.index({ tenantId: 1, status: 1 });
bookingSchema.index({ tenantId: 1, stylistId: 1, scheduledDate: 1 });

// Apply tenant isolation plugin
bookingSchema.plugin(tenantIsolationPlugin);

module.exports = mongoose.model('Booking', bookingSchema);
