const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  // const authHeader = req.headers["authorization"];

  // if (!authHeader) {
  //   return next(new ErrorHandler("Please Login to access this resource", 401));
  // }
  // const token = authHeader.split(" ")[1];
  // const decodedData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  // req.user = await User.findById(decodedData.id);
  // next();
  const { token } = req.cookies;
  if (!token) {
    return next(new ErrorHandler("Please Login to access this resource", 401));
  }
  const decodedData = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decodedData.id);
  next();
});
exports.authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};

// Middleware function to check if user is deactivated
exports.checkDeactivated = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  if (user.isDeactivated) {
    return res.status(403).json({
      success: false,
      message: "Your account is deactivated, Contact Support to Activate it",
    });
  }
  next();
});
