const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// All routes require authentication
router.use(protect);

// Analytics endpoints
router.get('/overview', analyticsController.getOverview);
router.get('/appointments', analyticsController.getAppointments);
router.get('/services', analyticsController.getServices);
router.get('/clients', analyticsController.getClients);
router.get('/stylists', analyticsController.getStylists);
router.get('/finance', analyticsController.getFinance);

module.exports = router;
