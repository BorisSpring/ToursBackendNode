const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Tour = require('./../models/tourModel');
const factory = require('./handlerFactory');

exports.updateReview = factory.updateOne(Review);
exports.getReview = factory.findOne(Review);
exports.findAllReviews = catchAsync(async (req, res, next) => {
  const limit = req.query?.limit || 6;
  const page = req.query?.page || 1;
  const skip = (page - 1) * limit;

  const reviews = await Review.find()
    .skip(skip)
    .limit(limit)
    .populate([{ path: 'user', select: ' email name photo' }]);
  const totalDocuemnts = await Review.countDocuments();

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    totalPages: Math.ceil(totalDocuemnts / req.query.limit || 6),
    data: {
      documents: reviews,
    },
  });
});

exports.addReview = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({
    _id: req.params.tourId || req?.body.tourId,
  });

  if (!tour) {
    next(new AppError('Invalid id for tour!', 404));
  }

  const review = {
    user: req.user.id,
    tour: req.params.tourId || req.body.tourId,
    rating: req.body.rating,
    review: req.body.review,
  };
  const savedReview = await Review.create(review);

  res.status(201).json({
    status: 'success',
    data: {
      review: savedReview,
    },
  });
});

exports.findLoggedUserReviews = catchAsync(async (req, res, next) => {
  const limit = req.query?.limit || 6;
  const page = req.query?.page || 1;
  const skip = (page - 1) * limit;

  const documents = await Review.find({ user: req.user.id })
    .limit(limit)
    .skip(skip);
  const totalDocuments = await Review.countDocuments({ user: req.user.id });

  res.status(200).json({
    status: 'success',
    results: totalDocuments,
    totalPages: Math.ceil(totalDocuments / limit),
    data: {
      documents,
    },
  });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('Review doesnt exists!'), 404);
  }

  if (req.user.role === 'admin' || review.user === req.user.id) {
    await Review.deleteOne({ _id: review._id });
  } else {
    return next(
      new AppError('You are not allowed to delete this review!', 400)
    );
  }

  res.status(204).json({
    status: 'success',
  });
});
