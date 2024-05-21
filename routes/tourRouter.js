const express = require(`express`);
const {
  getAllTours,
  getTour,
  createOrUpdateTour,
  getTop5Cheap,
  deleteTourById,
  getTourStats,
  getMonthlyPlan,
  getTourBySlag,
  uploadTourImages,
  resizeTourImages,
} = require('../controllers/tourController');
const { protect, restrictTo } = require('./../controllers/authController');
const reviewRouter = require('./reviewRouter');

const tourRouter = express.Router();

tourRouter.use('/:tourId/reviews', reviewRouter);
tourRouter.get('/slug/:slug/', getTourBySlag);
tourRouter.route('/top-5-cheap').get(getTop5Cheap, getAllTours);
tourRouter.route('/tour-stats').get(getTourStats);
tourRouter
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

tourRouter
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createOrUpdateTour)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    createOrUpdateTour
  );

tourRouter
  .route('/:id')
  .get(getTour)

  .delete(protect, restrictTo('admin', 'lead-guide', 'user'), deleteTourById);

module.exports = tourRouter;
