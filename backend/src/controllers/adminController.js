const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Booking = require('../models/Booking');
const logger = require('../config/logger');

exports.getAllTenants = async (req, res) => {
  try {
    const { status, country } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (country) filter.country = country;

    const tenants = await Tenant.find(filter)
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      count: tenants.length,
      data: tenants
    });
  } catch (error) {
    logger.error(`Admin get tenants error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getTenantDetails = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Get tenant statistics
    const userCount = await User.countDocuments({ tenantId: tenant._id });
    const bookingCount = await Booking.countDocuments({ tenantId: tenant._id });
    const recentBookings = await Booking.find({ tenantId: tenant._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('clientId', 'firstName lastName');

    res.json({
      success: true,
      data: {
        tenant,
        stats: {
          userCount,
          bookingCount
        },
        recentBookings
      }
    });
  } catch (error) {
    logger.error(`Admin get tenant details error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.suspendTenant = async (req, res) => {
  try {
    const { reason } = req.body;

    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    tenant.status = 'suspended';
    tenant.delistReason = reason;
    await tenant.save();

    logger.warn(`Tenant suspended: ${tenant.businessName} - Reason: ${reason}`);

    res.json({
      success: true,
      message: 'Tenant suspended successfully',
      data: tenant
    });
  } catch (error) {
    logger.error(`Admin suspend tenant error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.delistTenant = async (req, res) => {
  try {
    const { reason } = req.body;

    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    tenant.status = 'delisted';
    tenant.delistReason = reason;
    tenant.delistedAt = new Date();
    await tenant.save();

    logger.warn(`Tenant delisted: ${tenant.businessName} - Reason: ${reason}`);

    res.json({
      success: true,
      message: 'Tenant delisted successfully',
      data: tenant
    });
  } catch (error) {
    logger.error(`Admin delist tenant error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.reactivateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    tenant.status = 'active';
    tenant.delistReason = undefined;
    tenant.delistedAt = undefined;
    await tenant.save();

    logger.info(`Tenant reactivated: ${tenant.businessName}`);

    res.json({
      success: true,
      message: 'Tenant reactivated successfully',
      data: tenant
    });
  } catch (error) {
    logger.error(`Admin reactivate tenant error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getSystemStats = async (req, res) => {
  try {
    const totalTenants = await Tenant.countDocuments();
    const activeTenants = await Tenant.countDocuments({ status: 'active' });
    const suspendedTenants = await Tenant.countDocuments({ status: 'suspended' });
    const delistedTenants = await Tenant.countDocuments({ status: 'delisted' });
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();

    res.json({
      success: true,
      data: {
        totalTenants,
        activeTenants,
        suspendedTenants,
        delistedTenants,
        totalUsers,
        totalBookings
      }
    });
  } catch (error) {
    logger.error(`Admin get system stats error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


exports.getStaff = async (req, res) => {
  try {
    const staff = await User.find({
      tenantId: req.tenantId,
      role: { $in: ['stylist', 'manager', 'owner'] }
    }).select('firstName lastName role email phone status permissions');

    res.json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (error) {
    logger.error(`Get staff error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role, permissions } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide firstName, lastName, email, and role'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email, 
      tenantId: req.tenantId 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A staff member with this email already exists'
      });
    }

    // Generate secure temporary password (12 characters, alphanumeric)
    const crypto = require('crypto');
    const tempPassword = crypto.randomBytes(6).toString('hex'); // 12 character hex string

    // Get tenant info for email
    const tenant = await Tenant.findById(req.tenantId);

    // Create staff member
    const staff = await User.create({
      tenantId: req.tenantId,
      email,
      phone: phone || `+254${Date.now().toString().slice(-9)}`, // Generate dummy phone if not provided
      password: tempPassword,
      firstName,
      lastName,
      role,
      status: 'active',
      requirePasswordChange: true,
      temporaryPassword: true,
      twoFactorEnabled: true,
      twoFactorMethod: 'email',
      emailVerified: true, // Pre-verified since owner is adding them
      permissions: permissions || {},
      createdBy: req.user._id
    });

    // Send welcome email with credentials
    const emailService = require('../services/emailService');
    const emailSent = await emailService.sendStaffWelcomeEmail({
      to: email,
      firstName,
      salonName: tenant.businessName,
      tenantSlug: tenant.slug,
      email,
      tempPassword
    });

    logger.info(`Staff member created: ${firstName} ${lastName} (${email}) - Email sent: ${emailSent}`);

    res.status(201).json({
      success: true,
      message: emailSent 
        ? 'Staff member created successfully. Welcome email sent with login credentials.'
        : 'Staff member created successfully. Please share credentials manually (email failed).',
      emailSent,
      data: {
        _id: staff._id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        status: staff.status,
        permissions: staff.permissions
      },
      // Only include temp password if email failed
      ...(emailSent ? {} : { tempPassword })
    });
  } catch (error) {
    logger.error(`Create staff error: ${error.message}`);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: field === 'email' ? 'Email already in use' : 'Phone number already in use'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.resendWelcomeEmail = async (req, res) => {
  try {
    const staffId = req.params.id;

    // Find the staff member
    const staff = await User.findOne({
      _id: staffId,
      tenantId: req.tenantId
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Generate new temporary password
    const crypto = require('crypto');
    const tempPassword = crypto.randomBytes(6).toString('hex');

    // Update staff with new temp password
    staff.password = tempPassword;
    staff.requirePasswordChange = true;
    staff.temporaryPassword = true;
    await staff.save();

    // Get tenant info
    const tenant = await Tenant.findById(req.tenantId);

    // Send welcome email
    const emailService = require('../services/emailService');
    const emailSent = await emailService.sendStaffWelcomeEmail({
      to: staff.email,
      firstName: staff.firstName,
      salonName: tenant.businessName,
      tenantSlug: tenant.slug,
      email: staff.email,
      tempPassword
    });

    logger.info(`Welcome email resent to: ${staff.email} - Success: ${emailSent}`);

    res.json({
      success: true,
      message: emailSent 
        ? 'Welcome email sent successfully with new temporary password.'
        : 'Failed to send email. Please try again or share credentials manually.',
      emailSent,
      // Only include temp password if email failed
      ...(emailSent ? {} : { tempPassword })
    });
  } catch (error) {
    logger.error(`Resend welcome email error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const staffId = req.params.id;

    // Find the staff member
    const staff = await User.findOne({
      _id: staffId,
      tenantId: req.tenantId
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Prevent deleting owners
    if (staff.role === 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete owner account'
      });
    }

    // Delete the staff member
    await User.deleteOne({ _id: staffId, tenantId: req.tenantId });

    logger.info(`Staff member deleted: ${staff.firstName} ${staff.lastName} (${staff.email})`);

    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete staff error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role, status } = req.body;
    const staffId = req.params.id;

    // Find the staff member
    const staff = await User.findOne({
      _id: staffId,
      tenantId: req.tenantId
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== staff.email) {
      const emailExists = await User.findOne({ 
        email, 
        tenantId: req.tenantId,
        _id: { $ne: staffId }
      });
      
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another staff member'
        });
      }
    }

    // Update fields
    if (firstName) staff.firstName = firstName;
    if (lastName) staff.lastName = lastName;
    if (email) staff.email = email;
    if (phone !== undefined && phone !== '') staff.phone = phone;
    if (role) staff.role = role;
    if (status) staff.status = status;
    
    // Update permissions if provided
    if (req.body.permissions) {
      staff.permissions = {
        ...staff.permissions,
        ...req.body.permissions
      };
    }

    await staff.save();

    logger.info(`Staff updated: ${staff.firstName} ${staff.lastName} (${staff.email})`);

    // If permissions or status changed, force logout by updating lastLogin
    // This will invalidate their current session
    if (req.body.permissions || status) {
      staff.lastLogin = null; // This will force them to re-login
      await staff.save();
      logger.info(`Forced logout for ${staff.email} due to permission/status change`);
    }

    res.json({
      success: true,
      message: 'Staff information updated successfully. User will need to re-login.',
      data: {
        _id: staff._id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        status: staff.status,
        permissions: staff.permissions
      }
    });
  } catch (error) {
    logger.error(`Update staff error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
