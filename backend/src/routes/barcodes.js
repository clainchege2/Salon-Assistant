const express = require('express');
const {
  scanStockIn,
  scanStockOut,
  getMaterialItems,
  searchByBarcode,
  getStaffUsageReport,
  bulkScan
} = require('../controllers/barcodeController');
const { protect } = require('../middleware/auth');
const { readLimiter } = require('../middleware/security');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Scanning routes
router.post('/scan/in', scanStockIn);
router.post('/scan/out', scanStockOut);
router.post('/scan/bulk', bulkScan);

// Query routes
router.get('/search/:barcode', readLimiter, searchByBarcode);
router.get('/materials/:materialId/items', readLimiter, getMaterialItems);
router.get('/reports/staff-usage', readLimiter, getStaffUsageReport);

module.exports = router;
