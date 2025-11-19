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

const router = express.Router();

router.use(protect);
router.use(enforceTenantIsolation);

router.get('/availability', getAvailableSlots);

router.route('/')
  .get(getBookings)
  .post(createBooking); // Anyone authenticated can create bookings

router.route('/:id')
  .put(updateBooking) // Anyone authenticated can update bookings
  .delete(checkPermission('canDeleteBookings'), deleteBooking);

module.exports = router;
