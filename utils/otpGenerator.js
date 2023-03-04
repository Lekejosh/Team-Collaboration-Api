const otpGenerator = require("otp-generator");

module.exports.generateOTP = () => {
  const OTP = otpGenerator.generate(6, {
    upperCaseAlphabets: true,
    specialChars: true,
    numbers: true,
  });
  return OTP;
};
