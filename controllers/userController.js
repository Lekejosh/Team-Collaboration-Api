const User = require("../models/userModel");
const QRCode = require("../models/qrModel");
const crypto = require("crypto");
const ConnectedDevice = require("../models/connectedDevicesModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const jwt = require("jsonwebtoken");
const qrcode = require("qrcode");
const cloudinary = require("cloudinary");
const sendEmail = require("../utils/sendMail");
const { generateOTP } = require("../utils/otpGenerator");
const axios = require("axios");

//TODO: perfect the OTPs well

exports.register = catchAsyncErrors(async (req, res, next) => {
  const {
    firstName,
    lastName,
    username,
    email,
    mobileNumber,
    password,
    avatar,
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !username ||
    !mobileNumber ||
    !email ||
    !password
  ) {
    return next(new ErrorHandler(`Please provide all required fields.`, 400));
  }

  const checkExistingUser = async (key, value) => {
    const existingUser = await User.findOne({ [key]: value });
    if (existingUser) {
      return `${key} ${value} is already taken.`;
    }
  };

  const errors = await Promise.all([
    checkExistingUser("email", email),
    checkExistingUser("username", username),
    checkExistingUser("mobileNumber", mobileNumber),
  ]);

  const error = errors.find((e) => e);
  if (error) {
    return next(new ErrorHandler(error, 409));
  }

  const user = await User.create({
    firstName,
    lastName,
    username,
    email,
    password,
    mobileNumber,
    avatar,
  });

  const newRefreshToken = jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE }
  );

  user.refreshToken = [newRefreshToken];
  user.save();
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    // sameSite: "none",
    // secure: true,
    maxAge: 24 * 60 * 60 * 1000,
  });

  user.getAccessToken();

  sendToken(user, 200, res);
});

exports.checkUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("No User Found", 404));
  }
  res.status(200).json({ success: true, user });
});

exports.generateMailOTP = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorHandler("User not Found", 400));
  }
  user.emailOTP = generateOTP();
  await user.save();
  try {
    const data = `Your email Verification Token is :-\n\n ${user.emailOTP} \n\nif you have not requested this email  then, please Ignore it`;
    await sendEmail({
      email: `${user.firstName} <${user.email}>`,
      subject: "Veritfy Account OTP",
      html: data,
    }).then(() => {
      return res.status(200).json({ success: true });
    });
  } catch (err) {
    user.emailOTP = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(err.message, 500));
  }
});

exports.generateMobileOTP = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("User not Found", 400));
  }
  user.mobileOTP = generateOTP();
  await user.save();
  const msg =
    "You Mobile Number Verification Token is:- " +
    user.mobileOTP +
    " if you have not requested this email  then, please Ignore it";
  const payload = {
    From: process.env.TWILIO_FROM_PHONE,
    To: "+234" + user.mobileNumber,
    Body: msg,
  };
  const options = {
    url:
      "https://api.twilio.com/2010-04-01/Accounts/" +
      process.env.TWILIO_ACCOUNT_SID +
      "/Messages.json",
    method: "POST",
    auth: {
      username: process.env.TWILIO_ACCOUNT_SID,
      password: process.env.TWILIO_AUTH_TOKEN,
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: payload,
  };
  try {
    const response = await axios(options);
    const status = response.status;
    if (status == 200 || status == 201) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error(error);
    return next(
      new ErrorHandler("An error occurred while sending the message", 500)
    );
  }
});

exports.verifyMobileAndEmailOTP = catchAsyncErrors(async (req, res, next) => {
  const { mailOtp, mobileOtp } = req.body;

  if (!mailOtp || !mobileOtp) {
    return next(new ErrorHandler("Please Fill in Required fields", 400));
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorHandler("User Not found", 404));
  }
  if (user.emailOTP == undefined && user.mobileOTP == undefined) {
    return next(new ErrorHandler("Invalid Request", 401));
  }
  if (user.emailOTP !== mailOtp) {
    return next(new ErrorHandler("Email OTP Not Valid", 400));
  }
  if (user.mobileOTP !== mobileOtp) {
    return next(new ErrorHandler("Mobile OTP Not Valid", 400));
  }
  user.isVerified = true;
  user.isVerifiedEmail = true;
  user.isVerifiedMobile = true;
  user.emailOTP = undefined;
  user.mobileOTP = undefined;
  await user.save();
  res.status(200).json({ success: true });
});

exports.login = catchAsyncErrors(async (req, res, next) => {
  const cookies = req.cookies;
  const { emailName, password, twoFactorPin } = req.body;

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
        username: emailName,
      },
    ],
  }).select("+password +twoFactorAuth.set +twoFactorAuth.pin");

  if (!user) {
    return next(new ErrorHandler("Invalid Username/Email", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid password", 401));
  }

  if (user.twoFactorAuth.set) {
    if (!twoFactorPin) {
      return next(new ErrorHandler("Please Enter 2FA PIN", 400));
    }

    if (twoFactorPin !== user.twoFactorAuth.pin) {
      return next(new ErrorHandler("Invalid 2FA PIN", 401));
    }
  }

  // if (!user.isVerified) {
  //   return next(new ErrorHandler("Email and Mobile Number not verified", 401));
  // }

  const newRefreshToken = jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE }
  );

  let newRefreshTokenArray = !cookies?.refreshToken
    ? user.refreshToken
    : user.refreshToken.filter((rt) => rt !== cookies.refreshToken);

  if (cookies.refreshToken) {
    const refreshToken = cookies.refreshToken;
    const foundToken = await User.findOne({ refreshToken });
    if (!foundToken) {
      console.log("Refresh token reuse");
      newRefreshTokenArray = [];
    }
  }

  if (!cookies) return next(new ErrorHandler("Refresh token not present", 400));
  res.clearCookie("refreshToken", {
    httpOnly: true,
    // secure: true,
    // sameSite: "None",
  });
  user.refreshToken = [...newRefreshTokenArray, newRefreshToken];
  user.save();
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    // sameSite: "none",
    // secure: true,
    maxAge: 24 * 60 * 60 * 1000,
  });

  user.getAccessToken();

  sendToken(user, 200, res);
});

exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { emailName } = req.body;

  const user = await User.findOne({
    $or: [{ email: emailName }, { username: emailName }],
  });

  if (!user) {
    return next(new ErrorHandler("User Not found", 404));
  }

  if (user.isDeactivated) {
    return next(new ErrorHandler("Account Deactivated, Contact Support", 403));
  }

  if (user.isVerifiedEmail) {
    const resetToken = user.getResetPasswordToken();
    user.save({ ValidateBeforeSave: false });

    const resetPasswordUrl = `${req.protocol}://${req.get(
      "origin"
    )}/password/reset/${resetToken}`;

    const message = `Your password reset Token is :-\n\n ${resetPasswordUrl} \n\nif you have not requested this email then, please Ignore it`;
    try {
      await sendEmail({
        email: user.email,
        subject: `User Password Recovery`,
        html: message,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });
      return next(new ErrorHandler(error.message, 500));
    }
    return res
      .status(200)
      .json({ success: true, message: "Reset Link Sent, Check your Mail!" });
  }

  if (user.isVerifiedMobile) {
    const resetToken = user.getResetPasswordToken();
    user.save({ ValidateBeforeSave: false });

    const resetPasswordUrl = `${req.protocol}://${req.get(
      "origin"
    )}/password/reset/${resetToken}`;

    const msg = `Your password reset Token is :-\n\n ${resetPasswordUrl} \n\nif you have not requested this email then, please Ignore it`;
    const payload = {
      From: process.env.TWILIO_FROM_PHONE,
      To: "+234" + user.mobileNumber,
      Body: msg,
    };
    const options = {
      url:
        "https://api.twilio.com/2010-04-01/Accounts/" +
        process.env.TWILIO_ACCOUNT_SID +
        "/Messages.json",
      method: "POST",
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID,
        password: process.env.TWILIO_AUTH_TOKEN,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: payload,
    };
    try {
      const response = await axios(options);
      const status = response.status;
      if (status == 200 || status == 201) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(200).json({ success: true });
      }
    } catch (error) {
      console.error(error);
      return next(
        new ErrorHandler("An error occurred while sending the message", 500)
      );
    }
  }

  res.status(400).json({
    success: false,
    message:
      "Error Sending Password reset token to an unverified user, Contact Support",
  });
});

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler("Reset Password Token is invalid", 401));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not Match", 400));
  }
  const message = `Your password has been changed successfully`;
  await sendEmail({
    email: user.email,
    subject: `Password Changed Successfully`,
    html: message,
  });
  user.password = req.body.newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
  res
    .status(200)
    .json({ success: true, message: "Password Changed Successfully" });
});

exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Incorrect Old Password", 400));
  }

  if (req.body.newPassword != req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not match", 400));
  }

  user.password = req.body.newPassword;
  await user.save();

  res
    .status(200)
    .json({ success: true, message: "Password Updated Successfully" });
});

exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const { username, status } = req.body;

  const user = await User.findById(req.user._id);

  if (username) {
    const usernameTaken = await User.findOne({
      username: username,
      _id: { $ne: user._id },
    });

    if (usernameTaken) {
      return next(new ErrorHandler("Username already taken", 409));
    }
    user.username = username;
    await user.save();
  }

  user.status = status;
  await user.save();

  res.status(200).json({ success: true });
});

exports.updateMobileNumber = catchAsyncErrors(async (req, res, next) => {
  const { mobileNumber } = req.body;

  const user = await User.findById(req.user._id);

  const numberTaken = await User.findOne({
    mobileNumber: mobileNumber,
    _id: { $ne: user._id },
  });

  if (user.mobileNumber == mobileNumber) {
    res.status(304).json({ message: "No Changes Made" });
  }

  if (numberTaken) {
    return next(new ErrorHandler("Mobile Number already taken", 409));
  }

  user.mobileNumber = mobileNumber;
  user.isVerifiedMobile = false;
  await user.save();

  await unverifyUserIfEmailAndMobileNotVerified(req.user._id);

  res.status(200).json({ success: true });
});

exports.updateEmail = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findById(req.user._id);

  const emailTaken = await User.findOne({
    email: email,
    _id: { $ne: user._id },
  });

  if (emailTaken) {
    return next(new ErrorHandler("Email Address already taken", 409));
  }

  if (user.email == email) {
    res.status(304).json({ message: "No Changes Made" });
  }

  user.email = email;
  user.isVerifiedEmail = false;
  await user.save();
  await unverifyUserIfEmailAndMobileNotVerified(req.user._id);
  res.status(200).json({ success: true });
});

exports.logoutUser = catchAsyncErrors(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return next(new ErrorHandler("Refresh token not present", 400));
  res.clearCookie("refreshToken", {
    httpOnly: true,
    // secure: true,
    // sameSite: "None",
  });
  const user = await User.findOne({ refreshToken: refreshToken });
  if (!user)
    return next(new ErrorHandler("User not found or already logged out", 404));

  user.refreshToken = user.refreshToken.filter((re) => re !== refreshToken);

  await user.save();
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const profileUpdate = {
    mobileNumber: req.body.mobileNumber,
  };

  await User.findByIdAndUpdate(req.user.id, profileUpdate);
  res.status(200).json({ success: true });
});

exports.twoFactorAuth = catchAsyncErrors(async (req, res, next) => {
  const { activate, pin } = req.body;

  const user = await User.findById(req.user._id);

  if (activate == true) {
    (user.twoFactorAuth.set = true), (user.twoFactorAuth.pin = pin);
    await user.save();
    return res.status(200).json({ success: true });
  }
  if (activate == false) {
    user.twoFactorAuth.set = false;
    await user.save();
    return res.status(200).json({ success: true });
  }
  return next(new ErrorHandler("Provide The parameter", 400));
});

exports.uploadAvatar = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  if (user.avatar.public_id !== "default_image") {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  }

  const result = await cloudinary.v2.uploader.upload(req.file.path, {
    folder: "Chat_app_avatar",
    width: 150,
    crop: "scale",
  });

  user.avatar = {
    public_id: result.public_id,
    url: result.secure_url,
  };

  await user.save();

  res.status(200).json({
    success: true,
  });
});

exports.generateQr = catchAsyncErrors(async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Validate user input
    if (!userId) {
      res.status(400).send("User Id is required");
    }

    const user = await User.findById(userId);

    // Validate is user exist
    if (!user) {
      return next(new ErrorHandler("User not found", 400));
    }

    const qrExist = await QRCode.findOne({ userId });

    // If qr exist, update disable to true and then create a new qr record
    if (!qrExist) {
      await QRCode.create({ userId });
    } else {
      await QRCode.findOneAndUpdate({ userId }, { $set: { disabled: true } });
      await QRCode.create({ userId });
    }

    // Generate qr code
    const dataImage = await qrcode.toDataURL(user.getJWTToken());

    // Return qr code
    return res.status(200).json({ dataImage });
  } catch (err) {
    console.log(err);
  }
});

exports.scanQr = catchAsyncErrors(async (req, res, next) => {
  try {
    const { token, deviceInformation } = req.body;

    if (!token && !deviceInformation) {
      res.status(400).send("Token and deviceInformation is required");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const qrCode = await QRCode.findOne({
      userId: decoded.userId,
      disabled: false,
    });

    if (!qrCode) {
      res.status(400).send("QR Code not found");
    }

    const connectedDeviceData = {
      userId: decoded.userId,
      qrCodeId: qrCode._id,
      deviceName: deviceInformation.deviceName,
      deviceModel: deviceInformation.deviceModel,
      deviceOS: deviceInformation.deviceOS,
      deviceVersion: deviceInformation.deviceVersion,
    };

    const connectedDevice = await ConnectedDevice.create(connectedDeviceData);

    // Update qr code
    await QRCode.findOneAndUpdate(
      { _id: qrCode._id },
      {
        isActive: true,
        connectedDeviceId: connectedDevice._id,
        lastUsedDate: new Date(),
      }
    );

    // Find user
    const user = await User.findById(decoded.userId);

    // Create token
    const authToken = jwt.sign({ user_id: user._id }, process.env.TOKEN_KEY, {
      expiresIn: "2h",
    });

    // Return token
    return res.status(200).json({ token: authToken });
  } catch (err) {
    console.log(err);
  }
});

exports.allUsers = catchAsyncErrors(async (req, res, next) => {
  const keyword = req.query.search
    ? {
        $or: [
          { username: { $regex: req.query.search, $options: "i" } },
          { mobileNumber: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.status(200).json({ success: true, users });
});

exports.deactivateAccount = catchAsyncErrors(async (req, res, next) => {
  const { deactivate } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ErrorHandler("User Not found", 404));
  }

  user.isDeactivated = deactivate;
  await user.save();

  res
    .status(200)
    .json({ success: true, message: "Account Deactivated Successfully" });
});

exports.refreshToken = catchAsyncErrors(async (req, res, next) => {
  const cookies = req.cookies;
  if (!cookies?.refreshToken) {
    return next(new ErrorHandler("No Cookie present", 401));
  }

  const refreshToken = cookies.refreshToken;
  res.clearCookie("refreshToken", {
    httpOnly: true,
    // sameSite: "none",
    // secure: true,
  });

  const user = await User.findOne({ refreshToken: refreshToken });
  if (!user) {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) {
          return next(new ErrorHandler("Forbidden", 403));
        }
        const hackedUser = await User.findById(decoded.id);
        hackedUser.refreshToken = [];
        await hackedUser.save();
        return next(new ErrorHandler("Forbidden", 403));
      }
    );
  } else {
    const newRefresTokenArray = user.refreshToken.filter(
      (rt) => rt !== refreshToken
    );

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        user.refreshToken = [...newRefresTokenArray];
        const result = await user.save();
        if (err || user._id.toString() !== decoded.id) {
          return next(new ErrorHandler("Forbidden", 403));
        }

        const accessToken = jwt.sign(
          { id: decoded.id },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: process.env.ACCESS_TOKEN_EXPIRE }
        );

        const newRefreshToken = jwt.sign(
          { id: user._id },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: process.env.REFRESH_TOKEN_EXPIRE }
        );
        user.refreshToken = [...newRefresTokenArray, newRefreshToken];
        await user.save();
        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          // sameSite: "none",
          // secure: true,
          maxAge: 24 * 60 * 60 * 1000,
        });
        res.json({ accessToken });
      }
    );
  }
});

exports.deleteAccount = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) return next(new ErrorHandler("User not found", 404));

  user.remove();

  res.status(200).json({ success: true, message: "Successfully deleted" });
});

async function unverifyUserIfEmailAndMobileNotVerified(userId) {
  const user = await User.findById(userId);

  if (user.isVerified && !user.isVerifiedEmail && !user.isVerifiedMobile) {
    user.isVerified = false;
    await user.save();
  }
}
