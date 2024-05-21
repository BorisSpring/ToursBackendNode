const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Booking must belong to tour!'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to user!'],
    },
    price: {
      type: Number,
      required: [true, 'Booking must have a price!'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    paid: {
      type: Boolean,
      required: [true, 'Bookign must have information is it paid!'],
      default: true,
    },
  },
  {
    toJson: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bookingSchema.pre(/^find/, function (next) {
  this.populate([
    { path: 'tour' },
    { path: 'user', select: 'photo _id name email' },
  ]);
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
