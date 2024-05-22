const stripe = require(`stripe`)(
  'sk_test_51PHRqMBN6CjUTslEk0VW2yNGfEnxS4QB1sSG6RbYVd6oPJl1rhoA4mMeUVB5v68xaSyKp5kW50y3i7O45sVPsdNe00SKtQ7zC3'
);
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) {
    return next(
      new AppError(`Tour with id ${req.params.tourId} doesnt exists!`, 400)
    );
  }
  const requestUrl = req.get('origin');

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    // success_url: `http://localhost:5173/account/bookings?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    success_url: `${requestUrl}/account/bookings?payment=success`,
    cancel_url: `${requestUrl}/account/bookings?payment=error`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/tour-2-cover.jpg`],
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
  });

  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { user, tour, price } = req.body;
  //this is temporary
  if (!user || !tour || !price) {
    return next(new AppError('Missing body parts!', 400));
  }

  const booking = {
    user,
    tour,
    price,
  };

  const savedBooking = await Booking.create(booking);

  if (!savedBooking) {
    return next(new AppError('Fail to create booking', 400));
  }

  res.status(201).json({
    status: 'success',
    data: {
      booking: savedBooking,
    },
  });
});

exports.getMeBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id })
    .limit(req.query.limit)
    .skip(req.query.page * req.query.limit);

  const totalDocuments = await Booking.countDocuments({ user: req.user.id });

  res.status(200).json({
    status: 'success',
    results: bookings,
    totalPages: Math.ceil(totalDocuments / bookings?.length),
    data: {
      bookings,
    },
  });
});

exports.getAllBookingAdmin = factory.findAll(Booking);

exports.deleteBooking = factory.deleteOne(Booking);
