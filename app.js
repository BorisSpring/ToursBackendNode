const express = require('express');
const morgan = require('morgan');
const dotenv = require(`dotenv`);
const rateLimit = require(`express-rate-limit`);
const helmet = require(`helmet`);
const mongoSanitize = require(`express-mongo-sanitize`);
const xss = require('xss-clean');
const hpp = require(`hpp`);
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const ErrorController = require('./controllers/errorController');
const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');
const reviewRouter = require('./routes/reviewRouter');
const bookingRouter = require('./routes/bookingRouter');

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.options('*', cors());
dotenv.config({ path: `./config.env` });

const limiter = rateLimit({
  max: 100,
  windowMs: 10 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in 10 minutes!',
});
app.use('/api', limiter);
app.use(
  express.json({
    limit: '10kb',
  })
);
app.use(
  '/images',
  express.static(path.join(__dirname, 'public', 'img', 'tours'))
);
app.use(
  '/images/user',
  express.static(path.join(__dirname, 'public', 'img', 'users'))
);
app.use(cookieParser());
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: [
      `duration`,
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

if (process.env.ENV_NODE == 'development') {
  app.use(morgan('dev'));
}

app.use('/api/v1/users/', userRouter);
app.use('/api/v1/tours/', tourRouter);
app.use('/api/v1/reviews/', reviewRouter);
app.use('/api/v1/bookings/', bookingRouter);

// handling errors
app.all('*', (req, res, next) => {
  next(new AppError(`There is no path for ${req.originalUrl}`, 404));
});

app.use(ErrorController);

module.exports = app;
