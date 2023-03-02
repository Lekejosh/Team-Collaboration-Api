const User = require("../models/userModel");
const QRCode = require("../models/qrModel")
const ConnectedDevice = require("../models/connectedDevicesModel")
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const jwt = require("jsonwebtoken");
const qrcode = require("qrcode");

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

exports.generateQr = catchAsyncErrors(async (req,res,next) => {
  try {
    const userId  = req.user._id

    // Validate user input
    if (!userId) {
      res.status(400).send("User Id is required");
    }

    const user = await User.findById(userId);

    // Validate is user exist
    if (!user) {
      return next(new ErrorHandler("User not found",400))
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
})

exports.scanQr = catchAsyncErrors(async (req,res,next)=>{
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
})

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

