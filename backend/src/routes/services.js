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

const router = express.Router();

router.use(protect);
router.use(enforceTenantIsolation);

router.post('/suggest', suggestService);
router.get('/suggestions/pending', checkPermission('canManageServices'), getPendingSuggestions);
router.put('/suggestions/:id/approve', checkPermission('canManageServices'), approveSuggestion);
router.delete('/suggestions/:id/reject', checkPermission('canManageServices'), rejectSuggestion);

// GET is accessible to all (needed for viewing services)
// POST, PUT, DELETE require canManageServices permission
router.route('/')
  .get(getServices)
  .post(checkPermission('canManageServices'), createService);

router.route('/:id')
  .put(checkPermission('canManageServices'), updateService)
  .delete(checkPermission('canManageServices'), deleteService);

module.exports = router;
