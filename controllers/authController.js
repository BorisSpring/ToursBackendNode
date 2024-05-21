const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Email = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, res) => {
  user.password = undefined;
  const token = signToken(user._id);

  const cookieOptions = {
    secure: false,
    httpOnly: true,
    expire: Date.now() + process.env.JWT_EXPIRES_IN || 1 * 24 * 60 * 60 * 1000,
  };

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    user,
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    email: req.body.email,
  });

  if (!newUser) {
    return next(new AppError('Fail to signup!', 400));
  }

  const url = `${req.protocol}://${req.get(`host`)}://account`;
  await new Email(newUser, url).sendWelcome();

  createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError(`Please provide email and password`, 400));
  }

  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(`Invalid email or password`, 401));
  }

  createAndSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) return next(new AppError(`Invalid token`, 401));

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError(
        `The user belonging to the token doesnt not exists anymore!`,
        401
      )
    );
  }

  if (await currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        `Recently password has been changed! Please login again! `,
        401
      )
    );
  }

  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You dont have permission to peform this action!', 403),
        403
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('Wrong email adress!'), 404);
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetUrl = `${req.get('origin')}/forgotPassword/${resetToken}`;
    await new Email(user, resetUrl).sendPasswordReset();
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Please try again',
        500
      )
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const cryptedToken = crypto
    .createHash('sha-256')
    .update(req.params.token)
    .digest(`hex`);

  const user = await User.findOne({
    passwordResetToken: cryptedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Invalid token recived!', 400));
  }

  const { password, passwordConfirm } = req.body;

  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  user.password = password;
  user.passwordConfirm = passwordConfirm;

  await user.save();
  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { oldPassword, password, passwordConfirm } = req.body;

  const loggedUser = await User.findById(req.user._id).select('+password');
  if (!(await req.user.correctPassword(oldPassword, loggedUser.password))) {
    next(new AppError('Invalid password!', 400));
  }

  loggedUser.password = password;
  loggedUser.passwordConfirm = passwordConfirm;

  await loggedUser.save();
  createAndSendToken(loggedUser, 200, res);
});

exports.logoutUser = catchAsync(async (req, res, next) => {
  res.cookie('jwt', '', { expires: new Date(0) });
  res.status(200).json({
    status: 'success',
    message: 'Successfully logged out',
  });
});
