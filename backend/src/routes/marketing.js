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

// Holidays endpoint - must be before /:id route to avoid conflicts
router.get('/holidays', async (req, res) => {
  try {
    const Tenant = require('../models/Tenant');
    const holidaysService = require('../services/holidaysService');
    
    const tenant = await Tenant.findById(req.tenantId);
    const country = tenant?.country || 'Kenya';
    
    const { type = 'upcoming' } = req.query;
    
    let holidays;
    if (type === 'upcoming') {
      holidays = holidaysService.getUpcomingHolidays(country);
    } else if (type === 'all') {
      holidays = holidaysService.getHolidaysByCountry(country);
    } else if (type === 'suggestions') {
      holidays = holidaysService.getMarketingSuggestions(country);
    }
    
    res.json({
      success: true,
      country,
      data: holidays
    });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch holidays',
      error: error.message
    });
  }
});

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
