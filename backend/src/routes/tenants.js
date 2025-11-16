const express = require('express');
const { protect } = require('../middleware/auth');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Client = require('../models/Client');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Communication = require('../models/Communication');
const MaterialItem = require('../models/MaterialItem');
const logger = require('../config/logger');

const router = express.Router();

// Get own tenant information (no admin auth required)
router.get('/me', protect, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: tenant
    });
  } catch (error) {
    logger.error(`Get tenant error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update own tenant information
router.put('/me', protect, async (req, res) => {
  try {
    const { businessName, address, phone, email, website, country, currency, timezone, operatingHours, notifications } = req.body;
    
    const tenant = await Tenant.findById(req.tenantId);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Update fields
    if (businessName) tenant.businessName = businessName;
    
    // Handle address - can be string or object
    if (address) {
      if (typeof address === 'string') {
        // If string, store in street field
        tenant.address = { street: address };
      } else {
        // If object, store as is
        tenant.address = address;
      }
    }
    
    if (phone) tenant.phone = phone;
    if (email) tenant.ownerEmail = email;
    if (website) tenant.website = website;
    if (country) tenant.country = country;
    if (operatingHours) tenant.operatingHours = operatingHours;
    if (notifications) tenant.notifications = notifications;
    
    // Update settings
    if (!tenant.settings) tenant.settings = {};
    if (currency) tenant.settings.currency = currency;
    if (timezone) tenant.settings.timezone = timezone;

    await tenant.save();

    logger.info(`Tenant updated: ${tenant.businessName} (Country: ${country}, Currency: ${currency})`);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: tenant
    });
  } catch (error) {
    logger.error(`Update tenant error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Export all tenant data
router.get('/export-data', protect, async (req, res) => {
  try {
    const tenantId = req.tenantId;

    // Gather all data
    const [tenant, users, clients, bookings, services, communications, materials] = await Promise.all([
      Tenant.findById(tenantId),
      User.find({ tenantId }),
      Client.find({ tenantId }),
      Booking.find({ tenantId }).populate('clientId'),
      Service.find({ tenantId }),
      Communication.find({ tenantId }),
      MaterialItem.find({ tenantId })
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      tenant: {
        businessName: tenant.businessName,
        address: tenant.address,
        phone: tenant.phone,
        email: tenant.ownerEmail,
        subscriptionTier: tenant.subscriptionTier,
        createdAt: tenant.createdAt
      },
      staff: users.map(u => ({
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role,
        phone: u.phone
      })),
      clients: clients.map(c => ({
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        totalVisits: c.totalVisits,
        totalSpent: c.totalSpent,
        lastVisit: c.lastVisit,
        createdAt: c.createdAt
      })),
      bookings: bookings.map(b => ({
        date: b.date,
        time: b.time,
        status: b.status,
        totalPrice: b.totalPrice,
        client: b.clientId ? `${b.clientId.firstName} ${b.clientId.lastName}` : 'Unknown',
        services: b.services?.map(s => s.name).join(', ') || 'Unknown',
        staffName: b.staffName || 'Unassigned'
      })),
      services: services.map(s => ({
        name: s.name,
        category: s.category,
        price: s.price,
        duration: s.duration,
        description: s.description
      })),
      communications: communications.map(c => ({
        type: c.type,
        subject: c.subject,
        message: c.message,
        sentAt: c.sentAt,
        recipientCount: c.recipients?.length || 0
      })),
      materials: materials.map(m => ({
        name: m.name,
        barcode: m.barcode,
        quantity: m.quantity,
        unit: m.unit,
        category: m.category
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=hairvia-export-${Date.now()}.json`);
    res.json(exportData);

    logger.info(`Data exported for tenant: ${tenant.businessName}`);
  } catch (error) {
    logger.error(`Export data error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to export data'
    });
  }
});

// Change subscription tier (Owner only)
router.post('/change-tier', protect, async (req, res) => {
  try {
    // Check if user is owner
    if (!req.user || req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only the salon owner can change subscription tiers'
      });
    }

    const { newTier } = req.body;
    const tenant = await Tenant.findById(req.tenantId);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const validTiers = ['basic', 'pro', 'premium'];
    if (!validTiers.includes(newTier)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tier. Must be basic, pro, or premium'
      });
    }

    if (tenant.subscriptionTier === newTier) {
      return res.status(400).json({
        success: false,
        message: `Already on ${newTier} tier`
      });
    }

    const oldTier = tenant.subscriptionTier;
    tenant.subscriptionTier = newTier;
    tenant.subscriptionStatus = 'active';
    
    // Clear end date if upgrading or changing
    if (newTier !== 'basic') {
      tenant.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    } else {
      tenant.subscriptionEndDate = null;
    }
    
    await tenant.save({ validateBeforeSave: false });

    const action = getTierLevel(newTier) > getTierLevel(oldTier) ? 'upgraded' : 'downgraded';
    logger.info(`Tenant ${action} from ${oldTier} to ${newTier}: ${tenant.businessName}`);

    res.json({
      success: true,
      message: `Successfully ${action} to ${newTier} tier`,
      data: tenant
    });
  } catch (error) {
    logger.error(`Change tier error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to change tier'
    });
  }
});

// Helper function to compare tier levels
function getTierLevel(tier) {
  const levels = { basic: 1, pro: 2, premium: 3 };
  return levels[tier] || 0;
}

// Cancel subscription (Owner only)
router.post('/cancel-subscription', protect, async (req, res) => {
  try {
    // Check if user is owner
    if (!req.user || req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only the salon owner can cancel subscriptions'
      });
    }

    const tenant = await Tenant.findById(req.tenantId);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    if (tenant.subscriptionTier === 'basic') {
      return res.status(400).json({
        success: false,
        message: 'No active subscription to cancel'
      });
    }

    tenant.subscriptionStatus = 'cancelled';
    // Keep the tier until end date, then it will be downgraded
    await tenant.save({ validateBeforeSave: false });

    logger.info(`Subscription cancelled for tenant: ${tenant.businessName}`);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully. You can continue using until the end of your billing period.',
      data: tenant
    });
  } catch (error) {
    logger.error(`Cancel subscription error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

// Delete account permanently (Owner only)
router.delete('/delete-account', protect, async (req, res) => {
  try {
    // Check if user is owner
    if (!req.user || req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only the salon owner can delete the account'
      });
    }

    const tenantId = req.tenantId;
    const tenant = await Tenant.findById(tenantId);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Delete all associated data
    await Promise.all([
      User.deleteMany({ tenantId }),
      Client.deleteMany({ tenantId }),
      Booking.deleteMany({ tenantId }),
      Service.deleteMany({ tenantId }),
      Communication.deleteMany({ tenantId }),
      MaterialItem.deleteMany({ tenantId }),
      Tenant.findByIdAndDelete(tenantId)
    ]);

    logger.info(`Account deleted permanently: ${tenant.businessName}`);

    res.json({
      success: true,
      message: 'Account and all data deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete account error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
});

module.exports = router;
