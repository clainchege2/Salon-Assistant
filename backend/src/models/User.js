const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
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
    canViewMarketing: { type: Boolean, default: false },
    canDeleteBookings: { type: Boolean, default: false },
    canDeleteClients: { type: Boolean, default: false },
    canManageStaff: { type: Boolean, default: false },
    canManageServices: { type: Boolean, default: false },
    canManageInventory: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['active', 'blocked', 'inactive'],
    default: 'active'
  },
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
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, role: 1 });

// Auto-set permissions based on role
userSchema.pre('save', async function(next) {
  // Set permissions on role change OR on new user creation
  if (this.isModified('role') || this.isNew) {
    if (this.role === 'owner') {
      this.permissions = {
        canViewCommunications: true,
        canViewMarketing: true,
        canDeleteBookings: true,
        canDeleteClients: true,
        canManageStaff: true,
        canManageServices: true,
        canManageInventory: true,
        canViewReports: true
      };
    } else if (this.role === 'manager' || this.role === 'stylist') {
      this.permissions = {
        canViewCommunications: false,
        canViewMarketing: false,
        canDeleteBookings: false,
        canDeleteClients: false,
        canManageStaff: false,
        canManageServices: false,
        canManageInventory: false,
        canViewReports: false
      };
    }
  }

  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
