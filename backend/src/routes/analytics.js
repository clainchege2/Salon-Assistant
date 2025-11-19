const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { enforceTenantIsolation } = require('../middleware/tenantIsolation');
const analyticsController = require('../controllers/analyticsController');

// All routes require authentication and tenant isolation
router.use(protect);
router.use(enforceTenantIsolation);

// Analytics endpoints
router.get('/overview', analyticsController.getOverview);
router.get('/appointments', analyticsController.getAppointments);
router.get('/services', analyticsController.getServices);
router.get('/clients', analyticsController.getClients);
router.get('/stylists', analyticsController.getStylists);
router.get('/finance', analyticsController.getFinance);

module.exports = router;
