const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: [validator.isEmail, "Please Enter a valid Email Address"],
    },
    isVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    mobileNumber: {
      type: String,
      unique: true,
    },
    isVerifiedMobile: {
      type: Boolean,
      default: false,
    },
    isVerifiedEmail: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    status: {
      type: String,
      maxlength: [150, "Status can't be more than 150 Characters"],
    },
    emailOTP: {
      type: String,
    },
    mobileOTP: {
      type: String,
    },
    twoFactorAuth: {
      set: { type: Boolean, default: false },
      pin: { type: String, maxlength: [4, "Max Length Can't pass 4"] },
      select: false,
    },

    avatar: {
      public_id: {
        type: String,
        default: "default_image",
      },
      url: {
        type: String,
        default:
          "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
      },
    },
    isDeactivated: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    generatedOtp: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);
userSchema.pre("save", function (next) {
  this.username = this.username.replace(/[^a-zA-Z0-9_.]/g, "");
  this.email = this.email.replace(/[^a-zA-Z0-9@.]/g, "");

  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
//resetPasswordToken generators
userSchema.methods.getResetPasswordToken = function () {
  //Generating token for reset
  const resetToken = crypto.randomBytes(20).toString("hex");

  //Hashing and Add resetPasswordToken to userSchema
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};
module.exports = mongoose.model("User", userSchema);
