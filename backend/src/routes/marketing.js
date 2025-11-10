const express = require('express');
const {
  getAllCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  getAnalytics,
  calculateRFM,
  getSegmentClients
} = require('../controllers/marketingController');
const { protect, checkPermission, checkTierAndPermission } = require('../middleware/auth');
const { enforceTenantIsolation } = require('../middleware/tenantIsolation');

const router = express.Router();

router.use(protect);
router.use(enforceTenantIsolation);

// Marketing - require PRO tier + canViewMarketing permission
const marketingCheck = checkTierAndPermission('pro', 'canViewMarketing');

router.get('/analytics', marketingCheck, getAnalytics);
router.post('/rfm/calculate', marketingCheck, calculateRFM);
router.get('/segments/:segment/clients', marketingCheck, getSegmentClients);
router.get('/special-occasions/:occasion', marketingCheck, require('../controllers/marketingController').getSpecialOccasionClients);

// Campaign routes
router.route('/')
  .get(marketingCheck, getAllCampaigns)
  .post(marketingCheck, createCampaign);

router.route('/:id')
  .get(marketingCheck, getCampaign)
  .put(marketingCheck, updateCampaign)
  .delete(marketingCheck, deleteCampaign);

router.post('/:id/send', marketingCheck, sendCampaign);

module.exports = router;
