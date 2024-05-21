const mongoose = require(`mongoose`);
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      trim: true,
      required: [true, `Review is required`],
      minLength: [10, `Minimum length is 10 characters`],
    },
    rating: {
      type: Number,
      required: [true, `Rating is required`],
      min: [1, `Minimum value is 1`],
      max: [5, `Minimum value is 5`],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, `Review must belong to a tour`],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, `Review must belong to a user`],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate([
    { path: 'user', select: 'name photo' },
    { path: 'tour', select: 'name' },
  ]).select('-__v');

  next();
});

reviewSchema.statics.calculateAverageRating = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        numberOfRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0]?.numberOfRatings || 0,
    averageRating: stats[0]?.avgRating || 0,
  });
};

reviewSchema.post('save', async function () {
  this.constructor.calculateAverageRating(this.tour);
});

reviewSchema.post(/^findOneAnd/, async function (doc) {
  console.log(doc);
  if (doc) await doc.constructor.calculateAverageRating(doc?.tour._id);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
