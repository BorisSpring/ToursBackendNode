const Tour = require('../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');
const sharp = require('sharp');
const multer = require('multer');
const deleteFile = require(`../utils/deleteFile`);

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Only images are supported', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover && !req.files.images) return next();
  if (req.files.imageCover) {
    req.body.imageCover = `tour-${req.params.tourId}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);
  }

  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (file, index) => {
        const fileName = `tour-${req.params.tourId}-${Date.now()}-${index + 1}.jpeg`;
        await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${fileName}`);
        req.body.images.push(fileName);
      })
    );
  }
  next();
});

exports.deleteTourById = factory.deleteOne(Tour);
exports.getTour = factory.findOne(Tour, { path: 'reviews', select: '-tour' });
exports.getAllTours = factory.findAll(Tour);

exports.createOrUpdateTour = catchAsync(async (req, res, next) => {
  const tour = JSON.parse(req.body.tour);

  let oldImages;
  let oldImageCover;

  if (req.body.images) {
    if (tour?.images) {
      oldImages = { ...tour.images };
    }
    tour.images = req.body.images;
  }
  if (req.body.imageCover) {
    if (tour?.imageCover) {
      oldImageCover = tour.imageCover;
    }
    tour.imageCover = req.body.imageCover;
  }

  let savedOrUpdatedTour;

  if (tour._id) {
    savedOrUpdatedTour = await Tour.findByIdAndUpdate(tour._id, tour, {
      new: true,
      runValidators: true,
    });
  } else {
    savedOrUpdatedTour = await Tour.create(tour);
  }

  if (!savedOrUpdatedTour) {
    req.body?.images.forEach((image) => deleteFile(image));
    req.body?.imageCover && deleteFile(req.body.imageCover);
    return next(new AppError(`There is no tour with id ${req.params.id}`, 404));
  } else {
    oldImages?.forEach?.((image) => deleteFile(image));
    oldImageCover && deleteFile(oldImageCover);
  }

  res.status(tour._id ? 200 : 201).json({
    status: 'success',
    data: {
      document: savedOrUpdatedTour,
    },
  });
});

exports.getTop5Cheap = async (req, res, next) => {
  req.query = {
    limit: '5',
    sort: 'price,-raitingsAverage',
  };
  req.query.fields = 'price,name,difficulty,ratingsAverage';
  next();
};

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.4 } },
    },
    {
      $group: {
        _id: { $toUpper: `$difficulty` },
        num: { $sum: 1 },
        numRatings: { $sum: `$ratingsQuantity` },
        avgPrice: { $avg: `$price` },
        minPrice: { $min: `$price` },
        maxPrice: { $max: `$price` },
      },
    },
  ]);
  res.status(200).json({
    status: `success`,
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: `$startDates`,
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-1-1`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        sum: { $sum: 1 },
        tours: { $push: `$name` },
      },
    },
    {
      $addFields: { month: `$_id` },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        sum: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: `success`,
    results: plan.length,
    data: {
      plan,
    },
  });
});

exports.getTourBySlag = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate([
    { path: 'reviews', select: '-tour' },
  ]);

  if (!tour) {
    return next(
      new AppError(`Tour with slug ${req.params.slug} doesnt exists!`, 404)
    );
  }

  res.status(200).json({
    status: `success`,
    data: {
      tour,
    },
  });
});
