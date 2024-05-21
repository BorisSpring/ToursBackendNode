const sendErrorDevlopment = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProduction = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: 'Error',
      mesage: 'Something went very wrong!',
      stack: err.stack,
    });
  }
};

const handleCastErrorDB = (err, res) => {
  res.status(400).json({
    status: 'Error',
    message: `Input id (${err.value}) is incorrect!`,
  });
};

const handleUniquenessErroDB = (err, res) => {
  const fieldValue = Object.keys(err.errorResponse.keyPattern)[0];
  res.status(400).json({
    status: 'Error',
    message: `The input for field: ${fieldValue} (${err.errorResponse.keyValue[fieldValue]}) shoud be unique, please chose another!`,
  });
};

const handleValidationErrorDB = (err, res) => {
  const errorFields = Object.keys(err.errors);
  const errorMessages = {};

  errorFields.forEach(
    (field) => (errorMessages[field] = err.errors[field]?.message)
  );

  res.status(400).json({
    status: 'Error',
    message: errorMessages,
  });
};

const handleJwtSignatureError = (err, res) => {
  res.status(401).json({
    status: 'Error',
    message: 'Invalid JWT Signature!',
  });
};

const handleJwtExpirationError = (err, res) => {
  res.status(401).json({
    status: 'Error',
    message: 'Token expired',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (err?.name === 'CastError') {
    handleCastErrorDB(err, res);
  } else if (err.name === 'TokenExpiredError') {
    handleJwtExpirationError(err, res);
  } else if (err.name === 'JsonWebTokenError') {
    handleJwtSignatureError(err, res);
  } else if (err?.errorResponse?.code === 11000) {
    handleUniquenessErroDB(err, res);
  } else if (err?.name === 'ValidationError') {
    handleValidationErrorDB(err, res);
  } else {
    process.env.NODE_ENV === 'production'
      ? sendErrorDevlopment(err, res)
      : sendErrorProduction(err, res);
  }
};
