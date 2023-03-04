const otpGenerator = require("otp-generator");

module.exports.generateOTP = () => {
  const OTP = otpGenerator.generate(6, {
    digits: true,
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });
  return OTP;
};
