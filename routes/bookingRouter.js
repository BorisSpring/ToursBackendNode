const express = require('express');
const {
  getCheckoutSession,
  createBookingCheckout,
  getMeBookings,
  getAllBookingAdmin,
  deleteBooking,
} = require('./../controllers/bookingController');
const { protect, restrictTo } = require(`./../controllers/authController`);

const router = express.Router();

router.get('/checkout-session/:tourId', protect, getCheckoutSession);
router.post('/create-checkout-booking', protect, createBookingCheckout);

router.get(
  '/all',
  protect,
  restrictTo('admin', 'lead-guide'),
  getAllBookingAdmin
);
router.delete('/:id', protect, restrictTo('admin'), deleteBooking);

router.get('/', protect, getMeBookings);
module.exports = router;
