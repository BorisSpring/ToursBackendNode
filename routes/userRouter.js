const express = require('express');
const multer = require('multer');
const {
  signUp,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
  logoutUser,
} = require(`./../controllers/authController`);
const {
  getUser,
  updateUser,
  deleteMe,
  getAllUsers,
  updateMe,
  deleteUser,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
  filterByRoleGuide,
} = require(`./../controllers/userController`);

const userRouter = express.Router();

userRouter.post('/signup', signUp);
userRouter.post('/login', login);

userRouter.post('/passwordForgot', forgotPassword);
userRouter.patch('/resetPassword/:token', resetPassword);
userRouter.patch('/updatePassword', protect, updatePassword);

userRouter.use(protect);
userRouter.get('/guides', filterByRoleGuide, getAllUsers);
userRouter.get('/me', getMe, getUser);
userRouter.post('/logout', logoutUser);
userRouter.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
userRouter.delete('/deleteMe', deleteMe);

userRouter.use(restrictTo('lead-guide', 'admin'));
userRouter.route('/').get(getAllUsers);
userRouter.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = userRouter;
