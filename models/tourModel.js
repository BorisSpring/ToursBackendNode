const mongoose = require(`mongoose`);
const slugify = require(`slugify`);

const tourSchema = mongoose.Schema(
  {
    slug: {
      type: String,
    },
    name: {
      required: [true, 'Tour name is required!'],
      minLength: [5, `Minimum length is 20 char!`],
      maxLength: [40, `Maximum length is 40 char!`],
      type: String,
      unique: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, `Duration is required`],
      min: [1, `Duration must be minimum 1 day!`],
    },
    difficulty: {
      type: String,
      required: [true, `Difficulty is required`],
      enum: {
        values: ['easy', 'difficult', 'medium'],
        message: 'Difficult must be either easy, difficult or medium!',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, `Rating must be higher than 1.`],
      max: [5, 'Rating must be below 5'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, `Price is required`],
      min: [1, `Price must be minimum 1`],
      max: [15000, 'Price must be below 15000'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, `Max group size is required`],
      min: [1, `Min group size is 1`],
      max: [100, 'Max group size is 10'],
      default: 1,
    },
    summary: {
      type: String,
      trim: true,
      required: [true, `Summary is required`],
      minLength: [1, `Summary  minimum length is 1`],
      maxLength: [255, 'Summary maximum length is 255'],
    },
    description: {
      type: String,
      trim: true,
      minLength: [10, `description minimum length is 10`],
      maxLength: [1700, `description maximum length is 700`],
    },
    imageCover: {
      type: String,
      trim: true,
      required: [true, `Image cover is required`],
    },
    images: {
      required: [true, `images are required`],
      type: [String],
    },
    startDates: {
      required: [true, 'Start dates are required'],
      type: [Date],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value) {
          this.price > value;
        },
        message: `Discount price must be lower then ({VALUE})`,
      },
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: `Point`,
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: [`Point`],
        },
        cordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true, getter: true },
    toObject: { virtuals: true, getter: true },
  }
);

tourSchema.index({ slug: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });

tourSchema.virtual('durationInWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE WITH EXPRESSSION
tourSchema.pre(/^find/, function (next) {
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({ path: 'guides' }).select('-_v');
  next();
});

tourSchema.post(/^find/, function (documents, next) {
  console.log(`Query took ${this.start - Date.now()}`);
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({
    $match: { secretTour: { $ne: false } },
  });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
