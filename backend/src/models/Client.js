const mongoose = require('mongoose');
const tenantIsolationPlugin = require('../plugins/tenantIsolation');

const clientSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    select: false  // Don't include password in queries by default
  },
  
  // Account Status & Verification
  accountStatus: {
    type: String,
    enum: ['active', 'pending-verification', 'suspended'],
    default: 'pending-verification'
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  
  // Two-Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: true
  },
  twoFactorMethod: {
    type: String,
    enum: ['sms', 'email', 'whatsapp'],
    default: 'sms'
  },
  
  category: {
    type: String,
    enum: ['new', 'vip', 'usual', 'longtime-no-see'],
    default: 'new'
  },
  totalVisits: {
    type: Number,
    default: 0
  },
  lastVisit: Date,
  firstVisit: Date,
  totalSpent: {
    type: Number,
    default: 0
  },
  // Personal Information for Marketing
  dateOfBirth: Date,
  anniversary: Date,
  gender: {
    type: String,
    enum: ['female', 'male', 'other', 'prefer-not-to-say']
  },
  occupation: String,
  referralSource: {
    type: String,
    enum: ['tiktok', 'instagram', 'facebook', 'whatsapp', 'friend', 'google', 'walk-by', 'advertisement', 'other']
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  referralCount: {
    type: Number,
    default: 0
  },
  referralRewards: {
    totalEarned: { type: Number, default: 0 },
    available: { type: Number, default: 0 },
    redeemed: { type: Number, default: 0 }
  },
  
  // Social Media
  socialMedia: {
    instagram: String,
    facebook: String,
    tiktok: String
  },
  
  // Preferences & History
  preferences: {
    favoriteServices: [String],
    preferredStylist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    allergies: String,
    hairType: {
      type: String,
      enum: ['natural', 'relaxed', 'locs', 'braids', 'other']
    },
    skinSensitivity: String,
    preferredProducts: [String],
    notes: String
  },
  
  // Marketing & Communication
  marketingConsent: {
    sms: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false }
  },
  communicationPreference: {
    type: String,
    enum: ['sms', 'email', 'whatsapp', 'phone'],
    default: 'sms'
  },
  languagePreference: {
    type: String,
    enum: ['english', 'swahili', 'both'],
    default: 'english'
  },
  
  // RFM Analysis
  rfmScores: {
    recency: { type: Number, min: 1, max: 5 },
    frequency: { type: Number, min: 1, max: 5 },
    monetary: { type: Number, min: 1, max: 5 },
    combined: { type: Number, min: 3, max: 15 },
    segment: { 
      type: String, 
      enum: ['champions', 'loyal', 'potentialLoyalist', 'newCustomers', 'promising', 
             'needAttention', 'aboutToSleep', 'atRisk', 'cantLoseThem', 'hibernating', 'lost']
    },
    lastCalculated: Date
  },
  
  // Calculated Metrics
  metrics: {
    daysSinceLastVisit: Number,
    visitFrequency: Number, // Visits per month
    averageSpend: Number
  },
  
  // Lifecycle Management
  lifecycle: {
    stage: { 
      type: String, 
      enum: ['prospect', 'new', 'active', 'at-risk', 'churned', 'won-back'],
      default: 'prospect'
    },
    churnRisk: { type: Number, min: 0, max: 100, default: 0 },
    predictedLTV: { type: Number, default: 0 }
  },
  
  // Engagement Tracking
  engagement: {
    score: { type: Number, min: 0, max: 100, default: 50 },
    campaignsReceived: { type: Number, default: 0 },
    campaignsOpened: { type: Number, default: 0 },
    campaignsClicked: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 },
    lastResponse: Date
  },
  
  // Special Occasions Tracking
  specialOccasions: [{
    type: {
      type: String,
      enum: ['birthday', 'anniversary', 'graduation', 'wedding', 'other']
    },
    date: Date,
    description: String,
    sendReminder: { type: Boolean, default: true }
  }],
  
  // Loyalty & Rewards
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  vipSince: Date,
  
  // Communication Status
  communicationStatus: {
    blocked: { type: Boolean, default: false },
    blockedReason: String,
    blockedDate: Date,
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    warnings: [{
      reason: String,
      date: { type: Date, default: Date.now },
      issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      resolved: { type: Boolean, default: false },
      resolvedDate: Date,
      notes: String
    }],
    
    warningCount: { type: Number, default: 0 },
    
    // Behavior tracking
    inappropriateMessages: { type: Number, default: 0 },
    spamReports: { type: Number, default: 0 },
    
    // Communication preferences
    doNotDisturb: { type: Boolean, default: false },
    preferredLanguage: { type: String, default: 'english' },
    
    // Response tracking
    lastIncomingMessage: Date,
    lastOutgoingMessage: Date,
    averageResponseTime: Number,  // in hours
    totalConversations: { type: Number, default: 0 }
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

clientSchema.index({ tenantId: 1, category: 1 });
clientSchema.index({ tenantId: 1, lastVisit: 1 });

// Auto-categorize clients based on visit patterns
clientSchema.methods.updateCategory = function() {
  const daysSinceLastVisit = this.lastVisit 
    ? Math.floor((Date.now() - this.lastVisit) / (1000 * 60 * 60 * 24))
    : null;

  if (this.totalVisits === 0) {
    this.category = 'new';
  } else if (this.totalVisits >= 10 || this.totalSpent >= 50000) {
    this.category = 'vip';
  } else if (daysSinceLastVisit && daysSinceLastVisit > 90) {
    this.category = 'longtime-no-see';
  } else if (this.totalVisits >= 3) {
    this.category = 'usual';
  }
};

// Apply tenant isolation plugin
clientSchema.plugin(tenantIsolationPlugin);

module.exports = mongoose.model('Client', clientSchema);
