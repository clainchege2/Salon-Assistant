const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/auth');
const { enforceTenantIsolation } = require('../middleware/tenantIsolation');
const auditLogger = require('../middleware/auditLogger');

// Apply middleware to all routes
router.use(protect);
router.use(enforceTenantIsolation);

// Placeholder controller - implement as needed
const reportController = {
  getDashboard: async (req, res) => {
    res.status(200).json({ success: true, data: {} });
  },
  getFinancial: async (req, res) => {
    res.status(200).json({ success: true, data: {} });
  },
  exportBookingsReport: async (req, res) => {
    res.status(200).json({ success: true, data: [] });
  },
  exportClientsReport: async (req, res) => {
    res.status(200).json({ success: true, data: [] });
  },
  exportFinancialReport: async (req, res) => {
    res.status(200).json({ success: true, data: [] });
  }
};

// @desc    Get dashboard report
// @route   GET /api/v1/reports/dashboard
// @access  Private (Admin/Manager)
router.get('/dashboard', 
  checkPermission('canViewReports'),
  reportController.getDashboard
);

// @desc    Get financial report
// @route   GET /api/v1/reports/financial
// @access  Private (Admin/Manager)
router.get('/financial', 
  checkPermission('canViewReports'),
  reportController.getFinancial
);

// @desc    Export bookings report
// @route   GET /api/v1/reports/bookings/export
// @access  Private (Admin/Manager)
router.get('/bookings/export', 
  checkPermission('canViewReports'),
  auditLogger('EXPORT_BOOKINGS_REPORT', { sensitive: true, logReads: true }),
  reportController.exportBookingsReport
);

// @desc    Export clients report
// @route   GET /api/v1/reports/clients/export
// @access  Private (Admin/Manager)
router.get('/clients/export', 
  checkPermission('canViewReports'),
  auditLogger('EXPORT_CLIENTS_REPORT', { sensitive: true, logReads: true }),
  reportController.exportClientsReport
);

// @desc    Export financial report
// @route   GET /api/v1/reports/financial/export
// @access  Private (Admin/Manager)
router.get('/financial/export', 
  checkPermission('canViewReports'),
  auditLogger('EXPORT_FINANCIAL_REPORT', { sensitive: true, logReads: true }),
  reportController.exportFinancialReport
);

module.exports = router;
