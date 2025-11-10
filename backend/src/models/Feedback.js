const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // Ratings
  overallRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  serviceRating: {
    type: Number,
    min: 1,
    max: 5
  },
  staffRating: {
    type: Number,
    min: 1,
    max: 5
  },
  cleanlinessRating: {
    type: Number,
    min: 1,
    max: 5
  },
  valueRating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Feedback
  comment: String,
  wouldRecommend: Boolean,
  
  // Source
  source: {
    type: String,
    enum: ['sms', 'whatsapp', 'email', 'in-person', 'google', 'facebook', 'portal'],
    default: 'portal'
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'published', 'hidden', 'flagged'],
    default: 'pending'
  },
  
  // Response
  response: {
    text: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  
  // Flags
  isPositive: Boolean,
  isNegative: Boolean,
  requiresAction: {
    type: Boolean,
    default: false
  },
  
  // Related communication
  communicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Communication'
  }
}, {
  timestamps: true
});

// Auto-calculate flags based on rating
feedbackSchema.pre('save', function(next) {
  this.isPositive = this.overallRating >= 4;
  this.isNegative = this.overallRating <= 2;
  this.requiresAction = this.isNegative && !this.response.text;
  next();
});

feedbackSchema.index({ tenantId: 1, status: 1 });
feedbackSchema.index({ tenantId: 1, overallRating: 1 });
feedbackSchema.index({ tenantId: 1, requiresAction: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
