const mongoose = require('mongoose');
const crypto = require('crypto');
const tenantIsolationPlugin = require('../plugins/tenantIsolation');

const twoFactorAuthSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userModel',
    required: true,
    index: true
  },
  userModel: {
    type: String,
    required: true,
    enum: ['User', 'Client']
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // Verification Code
  code: {
    type: String,
    required: false, // Not required - we store the hash instead
    select: false // Don't return in queries for security
  },
  codeHash: {
    type: String,
    required: true,
    select: false
  },
  
  // Delivery Method
  method: {
    type: String,
    enum: ['sms', 'email', 'whatsapp'],
    required: true
  },
  
  // Contact Info (masked for security)
  sentTo: {
    type: String,
    required: true
  },
  
  // Purpose
  purpose: {
    type: String,
    enum: ['registration', 'login', 'password-reset', 'email-change', 'phone-change'],
    required: true
  },
  
  // Status
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  
  // Attempts tracking
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 5
  },
  
  // Expiration
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  
  // Security
  ipAddress: String,
  userAgent: String,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed
  
}, {
  timestamps: true
});

// Compound indexes
twoFactorAuthSchema.index({ userId: 1, purpose: 1, verified: 1 });
twoFactorAuthSchema.index({ tenantId: 1, createdAt: -1 });
twoFactorAuthSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Generate 6-digit code
twoFactorAuthSchema.statics.generateCode = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash code for storage
twoFactorAuthSchema.methods.hashCode = function(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
};

// Verify code
twoFactorAuthSchema.methods.verifyCode = function(inputCode) {
  const inputHash = crypto.createHash('sha256').update(inputCode).digest('hex');
  return this.codeHash === inputHash;
};

// Check if expired
twoFactorAuthSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Check if locked due to too many attempts
twoFactorAuthSchema.methods.isLocked = function() {
  return this.attempts >= this.maxAttempts;
};

// Mask phone number for display
twoFactorAuthSchema.statics.maskPhone = function(phone) {
  if (!phone || phone.length < 4) return '****';
  return phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4);
};

// Mask email for display
twoFactorAuthSchema.statics.maskEmail = function(email) {
  if (!email || !email.includes('@')) return '****@****.com';
  const [local, domain] = email.split('@');
  const maskedLocal = local.slice(0, 2) + '****' + local.slice(-1);
  return `${maskedLocal}@${domain}`;
};

// Apply tenant isolation plugin
twoFactorAuthSchema.plugin(tenantIsolationPlugin);

module.exports = mongoose.model('TwoFactorAuth', twoFactorAuthSchema);
