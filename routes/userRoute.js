const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middlewares/auth");
const {
  register,
  login,
  allUsers,
  generateQr,
  scanQr,
  uploadAvatar,
  twoFactorAuth,
  generateMailOTP,
  generateMobileOTP,
  verifyMobileAndEmailOTP,
} = require("../controllers/userController");
const upload = require("../utils/multer");

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/2fa/activate").post(isAuthenticatedUser, twoFactorAuth);
router
  .route("/update/avatar")
  .post(upload.single("avatar"), isAuthenticatedUser, uploadAvatar);
router.route("/generate/email/otp").get(isAuthenticatedUser, generateMailOTP);
router
  .route("/generate/mobile/otp")
  .get(isAuthenticatedUser, generateMobileOTP);
router.route("/verify/otp").post(isAuthenticatedUser, verifyMobileAndEmailOTP);
router.route("/qr/generate").post(isAuthenticatedUser, generateQr);
router.route("/qr/scan").post(scanQr);
router.route("/").get(isAuthenticatedUser, allUsers);

module.exports = router;
