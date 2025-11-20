const express = require('express');
const {
  createBooking,
  getBookings,
  updateBooking,
  deleteBooking,
  getAvailableSlots
} = require('../controllers/bookingController');
const { protect, checkPermission } = require('../middleware/auth');
const { enforceTenantIsolation } = require('../middleware/tenantIsolation');
const { auditLog } = require('../middleware/auditLogger');

const router = express.Router();

router.use(protect);
router.use(enforceTenantIsolation);

router.get('/availability', getAvailableSlots);

router.route('/')
  .get(getBookings)
  .post(auditLog('Booking'), createBooking);

router.route('/:id')
  .put(auditLog('Booking'), updateBooking)
  .delete(checkPermission('canDeleteBookings'), auditLog('Booking', { sensitive: true }), deleteBooking);

module.exports = router;
