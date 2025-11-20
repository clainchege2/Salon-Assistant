const express = require('express');
const {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient
} = require('../controllers/clientController');
const { protect, checkPermission } = require('../middleware/auth');
const { enforceTenantIsolation } = require('../middleware/tenantIsolation');
const { auditLog } = require('../middleware/auditLogger');

const router = express.Router();

router.use(protect);
router.use(enforceTenantIsolation);

router.route('/')
  .get(getClients)
  .post(auditLog('Client'), createClient);

router.route('/:id')
  .get(getClient)
  .put(auditLog('Client'), updateClient)
  .delete(checkPermission('canDeleteClients'), auditLog('Client', { sensitive: true }), deleteClient);

module.exports = router;
