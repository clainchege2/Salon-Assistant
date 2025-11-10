const express = require('express');
const {
  getAllMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  restockMaterial,
  recordUsage,
  getLowStockAlerts,
  recordPickup,
  getMaterialByBarcode
} = require('../controllers/materialController');
const { protect, checkPermission, checkTierAndPermission } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Stock/Inventory - require PRO tier + canManageInventory permission
const stockCheck = checkTierAndPermission('pro', 'canManageInventory');

router.get('/', protect, stockCheck, getAllMaterials);
router.get('/low-stock', protect, stockCheck, getLowStockAlerts);
router.get('/barcode/:barcode', protect, stockCheck, getMaterialByBarcode);
router.get('/:id', protect, stockCheck, getMaterial);
router.post('/', protect, stockCheck, createMaterial);
router.put('/:id', protect, stockCheck, updateMaterial);
router.delete('/:id', protect, stockCheck, deleteMaterial);
router.post('/:id/restock', protect, stockCheck, restockMaterial);
router.post('/:id/use', protect, stockCheck, recordUsage);
router.post('/pickup', protect, stockCheck, recordPickup);

module.exports = router;
