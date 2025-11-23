const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const tenantIsolationPlugin = require('../plugins/tenantIsolation');

const userSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
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
    required: true,
    select: false
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'manager', 'stylist'],
    required: true
  },
  permissions: {
    canViewCommunications: { type: Boolean, default: false },
    canMonitorCommunications: { type: Boolean, default: false },
    canViewMarketing: { type: Boolean, default: false },
    canDeleteBookings: { type: Boolean, default: false },
    canDeleteClients: { type: Boolean, default: false },
    canManageStaff: { type: Boolean, default: false },
    canManageServices: { type: Boolean, default: false },
    canManageInventory: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canCompleteBookings: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['active', 'blocked', 'inactive', 'pending-verification'],
    default: 'active' // Active by default since owners add staff directly
  },
  
  // Password management
  requirePasswordChange: {
    type: Boolean,
    default: false
  },
  temporaryPassword: {
    type: Boolean,
    default: false
  },
  
  // Two-Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: true // Enabled by default for security
  },
  twoFactorMethod: {
    type: String,
    enum: ['sms', 'email', 'whatsapp'],
    default: 'sms'
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
  
  // Security tracking
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLockedUntil: Date,
  lastFailedLogin: Date,
  
  lastLogin: Date,
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

// Compound index for tenant isolation
userSchema.index({ tenantId: 1, role: 1 });

// Auto-set permissions based on role
userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  // Set permissions on role change OR on new user creation
  if (this.isModified('role') || this.isNew) {
    if (this.role === 'owner') {
      this.permissions = {
        canViewCommunications: true,
        canMonitorCommunications: true,
        canViewMarketing: true,
        canDeleteBookings: true,
        canDeleteClients: true,
        canManageStaff: true,
        canManageServices: true,
        canManageInventory: true,
        canViewReports: true,
        canCompleteBookings: true
      };
    } else if (this.role === 'manager' || this.role === 'stylist') {
      // Don't override existing permissions for managers/stylists
      // Only set defaults if permissions don't exist
      if (!this.permissions || Object.keys(this.permissions).length === 0) {
        this.permissions = {
          canViewCommunications: false,
          canMonitorCommunications: false,
          canViewMarketing: false,
          canDeleteBookings: false,
          canDeleteClients: false,
          canManageStaff: false,
          canManageServices: false,
          canManageInventory: false,
          canViewReports: false,
          canCompleteBookings: false
        };
      }
    }
  }
  
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Apply tenant isolation plugin
userSchema.plugin(tenantIsolationPlugin);

module.exports = mongoose.model('User', userSchema);
