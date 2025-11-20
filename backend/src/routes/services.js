const express = require('express');
const {
  createService,
  getServices,
  updateService,
  deleteService,
  suggestService,
  getPendingSuggestions,
  approveSuggestion,
  rejectSuggestion
} = require('../controllers/serviceController');
const { protect, checkPermission } = require('../middleware/auth');
const { enforceTenantIsolation } = require('../middleware/tenantIsolation');
const { auditLog } = require('../middleware/auditLogger');

const router = express.Router();

router.use(protect);
router.use(enforceTenantIsolation);

router.post('/suggest', auditLog('Service'), suggestService);
router.get('/suggestions/pending', checkPermission('canManageServices'), getPendingSuggestions);
router.put('/suggestions/:id/approve', checkPermission('canManageServices'), auditLog('Service'), approveSuggestion);
router.delete('/suggestions/:id/reject', checkPermission('canManageServices'), auditLog('Service'), rejectSuggestion);

// GET is accessible to all (needed for viewing services)
// POST, PUT, DELETE require canManageServices permission
router.route('/')
  .get(getServices)
  .post(checkPermission('canManageServices'), auditLog('Service'), createService);

router.route('/:id')
  .put(checkPermission('canManageServices'), auditLog('Service'), updateService)
  .delete(checkPermission('canManageServices'), auditLog('Service', { sensitive: true }), deleteService);

module.exports = router;
