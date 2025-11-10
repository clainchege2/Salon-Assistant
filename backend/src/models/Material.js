const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
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
  barcode: {
    type: String,
    sparse: true,
    index: true
  },
  category: {
    type: String,
    enum: ['hair-extensions', 'chemicals', 'tools', 'accessories', 'other'],
    required: true
  },
  unit: {
    type: String,
    enum: ['pieces', 'grams', 'ml', 'bottles', 'packs'],
    required: true
  },
  currentStock: {
    type: Number,
    default: 0
  },
  minimumStock: {
    type: Number,
    default: 0
  },
  costPerUnit: Number,
  supplier: String,
  lastRestocked: Date,
  usageHistory: [{
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    quantity: Number,
    date: Date,
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  pickupHistory: [{
    pickedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    quantity: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

materialSchema.index({ tenantId: 1, category: 1 });
materialSchema.index({ tenantId: 1, currentStock: 1 });

module.exports = mongoose.model('Material', materialSchema);
