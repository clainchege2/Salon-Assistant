const mongoose = require('mongoose');
const tenantIsolationPlugin = require('../plugins/tenantIsolation');

const materialItemSchema = new mongoose.Schema({
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  barcode: {
    type: String,
    required: true,
    index: true
  },
  serialNumber: {
    type: String,
    sparse: true
  },
  status: {
    type: String,
    enum: ['in-stock', 'in-use', 'used', 'lost', 'damaged'],
    default: 'in-stock'
  },
  
  // Stock In Details
  receivedDate: {
    type: Date,
    default: Date.now
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  supplier: String,
  cost: Number,
  location: String,
  
  // Stock Out Details (Staff Accountability)
  usedDate: Date,
  usedBy: {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    staffName: String,
    staffRole: String,
    staffEmail: String
  },
  usedFor: {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    clientName: String,
    serviceName: String
  },
  
  // Audit Trail
  history: [{
    action: {
      type: String,
      enum: ['received', 'used', 'returned', 'damaged', 'lost', 'moved']
    },
    date: {
      type: Date,
      default: Date.now
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    staffName: String,
    notes: String
  }],
  
  notes: String,
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
materialItemSchema.index({ tenantId: 1, barcode: 1 }, { unique: true });
materialItemSchema.index({ tenantId: 1, materialId: 1 });
materialItemSchema.index({ tenantId: 1, status: 1 });
materialItemSchema.index({ 'usedBy.staffId': 1 });

// Add to history before saving
materialItemSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.history.push({
      action: this.status === 'used' ? 'used' : this.status,
      date: new Date(),
      staffId: this.usedBy?.staffId,
      staffName: this.usedBy?.staffName,
      notes: `Status changed to ${this.status}`
    });
  }
  next();
});

// Apply tenant isolation plugin
materialItemSchema.plugin(tenantIsolationPlugin);

module.exports = mongoose.model('MaterialItem', materialItemSchema);
