const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/APIFeatures');

exports.deleteOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(
        new AppError(`No document found with id ${req.params.id}!`, 404)
      );
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
};

exports.updateOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document) {
      return next(
        new AppError(`Document with id ${req.params.id} doesnt exists!`, 404)
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });
};

exports.createOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const document = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });
};

exports.findOne = (Model, populateOptions) => {
  return catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (populateOptions) {
      query.populate(populateOptions);
    }

    const data = await query;

    if (!data) {
      return next(
        new AppError(`Document with id ${req.params.id} doesnt exist's!`, 404)
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        data,
      },
    });
  });
};

exports.findAll = (Model) => {
  return catchAsync(async (req, res, next) => {
    let filter = {};

    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }

    const features = new APIFeatures(req.query, Model.find(filter))
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const documents = await features.query;
    const totalDocuments = await Model.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: totalDocuments,
      totalPages: Math.ceil(totalDocuments / req.query.limit || 6),
      data: {
        documents,
      },
    });
  });
};
