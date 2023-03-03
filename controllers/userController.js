const User = require("../models/userModel");
const QRCode = require("../models/qrModel");
const ConnectedDevice = require("../models/connectedDevicesModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const jwt = require("jsonwebtoken");
const qrcode = require("qrcode");
const cloudinary = require("cloudinary");

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
    return next(new ErrorHandler(error, 400));
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

  sendToken(user, 201, res);
});

exports.login = catchAsyncErrors(async (req, res, next) => {
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

  user.getJWTToken();
  sendToken(user, 200, res);
});

exports.twoFactorAuth = catchAsyncErrors(async (req, res, next) => {
  const { activate, pin } = req.body;

  const user = await User.findById(req.user._id);

  if (activate == true) {
    (user.twoFactorAuth.set = true), (user.twoFactorAuth.pin = pin);
    await user.save();
    return res.status(200).json({ success: true });
  }

  return next(new ErrorHandler("You have to activate before Proceeding", 400));
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
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.status(200).json({ success: true, users });
});
