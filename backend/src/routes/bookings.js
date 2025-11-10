const express = require('express');
const {
  createBooking,
  getBookings,
  updateBooking,
  deleteBooking
} = require('../controllers/bookingController');
const { protect, checkPermission } = require('../middleware/auth');
const { enforceTenantIsolation } = require('../middleware/tenantIsolation');

const router = express.Router();

router.use(protect);
router.use(enforceTenantIsolation);

router.route('/')
  .get(getBookings)
  .post(createBooking);

router.route('/:id')
  .put(updateBooking)
  .delete(checkPermission('canDeleteBookings'), deleteBooking);

module.exports = router;
