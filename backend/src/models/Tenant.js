const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  country: {
    type: String,
    default: 'Kenya',
    enum: ['Kenya', 'USA']
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'delisted', 'trial'],
    default: 'trial'
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'pro', 'premium'],
    default: 'free'
  },
  contactEmail: {
    type: String,
    required: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    county: String,
    country: String
  },
  settings: {
    timezone: { type: String, default: 'Africa/Nairobi' },
    currency: { type: String, default: 'KES' },
    businessHours: [{
      day: String,
      open: String,
      close: String,
      closed: Boolean
    }]
  },
  billing: {
    lastPaymentDate: Date,
    nextPaymentDue: Date,
    paymentMethod: String
  },
  delistReason: String,
  delistedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

tenantSchema.index({ status: 1 });

module.exports = mongoose.model('Tenant', tenantSchema);
