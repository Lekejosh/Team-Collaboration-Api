const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");

exports.register = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, avatar } = req.body;

  if (!name || !email || !password) {
    return next(new ErrorHandler("Provide all fields", 400));
  }

  const userExists = await User.findOne({ email: email });

  if (userExists) {
    return next(new ErrorHandler("User already exists", 400));
  }
  const user = await User.create({ name, email, password, avatar });

  sendToken(user, 201, res);
});

exports.login = catchAsyncErrors(async (req, res, next) => {
  const { emailName, password } = req.body;

  if (!emailName || !password) {
    return next(
      new ErrorHandler(
        "Please Enter your Email Address/Username and Password",
        400
      )
    );
  }
  const user = await User.findOne({
    $or: [
      {
        email: emailName,
      },
      {
        name: emailName,
      },
    ],
  }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Username/Email", 401));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid password", 401));
  }
  //   if (!user.isVerified) {
  //     return next(
  //       new ErrorHandler("Unverified Email Address🤨, Please Verify", 403)
  //     );
  //   }
  //   user.lastLoggedIn = Date.now();
  //   await user.save();

  user.getJWTToken();
  sendToken(user, 200, res);
});

exports.allUsers = catchAsyncErrors(async (req, res, next) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.status(200).json({ success: true, users });
});

