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
