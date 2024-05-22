const mongoose = require(`mongoose`);
const validator = require('validator');
const bcrypt = require(`bcryptjs`);
const crypto = require(`crypto`);

const userSchema = mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, `Name is required!`],
    minLength: [2, `Minimum length for name is 2 Characters`],
    maxLength: [20, `Maximum length for name is 20 Characters`],
  },
  email: {
    type: String,
    required: [true, `Email is required!`],
    unique: true,
    trim: true,
    lowerCase: true,
    validate: [validator.isEmail, `Please provide a valid email address`],
  },
  photo: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: [true, `Password is required!`],
    minLength: [8, `Minimum length for password is 8 characters`],
    maxLength: [100, `Maximum length for password is 20 characters`],
    trim: true,
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  passwordConfirm: {
    type: String,
    required: [true, `Password is required!`],
    minLength: [8, `Minimum length for password is 8 characters`],
    maxLength: [20, `Maximum length for password is 20 characters`],
    trim: true,
    validate: {
      validator: function (value) {
        return this.password == value;
      },
      message: 'Password must match!',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified(`password`)) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  if (this.isModified(`password`) && !this.isNew) return next();
  this.passwordChangedAt = Date.now() - 5000;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = async function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimeStamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha-256')
    .update(resetToken)
    .digest(`hex`);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // console.log(this.passwordResetToken, { resetToken });
  return resetToken;
};

userSchema.methods.cryptToken = function (token) {
  return crypto.createHash('sha-256').update(token).digest('hex');
};

userSchema.pre(/^find/, function (next) {
  this.find({ active: true });
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
