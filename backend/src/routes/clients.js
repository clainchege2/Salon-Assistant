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

const router = express.Router();

router.use(protect);
router.use(enforceTenantIsolation);

router.route('/')
  .get(getClients)
  .post(createClient);

router.route('/:id')
  .get(getClient)
  .put(updateClient) // Anyone authenticated can update clients
  .delete(checkPermission('canDeleteClients'), deleteClient);

module.exports = router;
