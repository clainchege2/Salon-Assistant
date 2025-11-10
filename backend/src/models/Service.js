const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
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
  description: String,
  category: {
    type: String,
    enum: ['braids', 'weaves', 'natural-hair', 'coloring', 'treatment', 'styling', 'other'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  images: [{
    url: String,
    publicId: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'approved', 'rejected'],
    default: 'active'
  },
  suggestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  materialsRequired: [{
    itemName: String,
    estimatedQuantity: Number,
    unit: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

serviceSchema.index({ tenantId: 1, isActive: 1 });
serviceSchema.index({ tenantId: 1, category: 1 });

module.exports = mongoose.model('Service', serviceSchema);
