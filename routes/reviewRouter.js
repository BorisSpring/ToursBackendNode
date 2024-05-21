const express = require('express');
const {
  addReview,
  updateReview,
  findAllReviews,
  deleteReview,
  getReview,
  findLoggedUserReviews,
} = require(`./../controllers/reviewController`);
const { protect, restrictTo } = require(`./../controllers/authController`);

const reviewRouter = express.Router({ mergeParams: true });

reviewRouter
  .route('/')
  .get(protect, restrictTo('admin'), findAllReviews)
  .post(protect, addReview);

reviewRouter.get('/me', protect, findLoggedUserReviews);

reviewRouter
  .route('/:id')
  .delete(protect, deleteReview)
  .patch(protect, updateReview)
  .get(getReview);

module.exports = reviewRouter;
