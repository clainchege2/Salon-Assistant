const express = require('express');
const {
  getAllTenants,
  getTenantDetails,
  suspendTenant,
  delistTenant,
  reactivateTenant,
  getSystemStats,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  resendWelcomeEmail
} = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/adminAuth');
const { protect, checkPermission, checkTierAndPermission } = require('../middleware/auth');
const { readLimiter } = require('../middleware/security');

const router = express.Router();

// Staff endpoints
// GET is accessible to all (needed for booking assignment dropdown)
// POST/PUT/DELETE require PRO tier + canManageStaff permission (only owners/managers can manage)
router.get('/staff', protect, getStaff);
router.post('/staff', protect, checkTierAndPermission('pro', 'canManageStaff'), createStaff);
router.put('/staff/:id', protect, checkTierAndPermission('pro', 'canManageStaff'), updateStaff);
router.delete('/staff/:id', protect, checkTierAndPermission('pro', 'canManageStaff'), deleteStaff);
router.post('/staff/:id/resend-welcome', protect, checkTierAndPermission('pro', 'canManageStaff'), resendWelcomeEmail);

// Admin-only routes - all routes below this line require admin auth
router.get('/stats', protectAdmin, getSystemStats);
router.get('/tenants', protectAdmin, getAllTenants);
router.get('/tenants/:id', protectAdmin, getTenantDetails);
router.put('/tenants/:id/suspend', protectAdmin, suspendTenant);
router.put('/tenants/:id/delist', protectAdmin, delistTenant);
router.put('/tenants/:id/reactivate', protectAdmin, reactivateTenant);

module.exports = router;
