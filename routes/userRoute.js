const express = require("express");
const router = express.Router();
const {
  isAuthenticatedUser,
  checkDeactivated,
} = require("../middlewares/auth");
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
  updateProfile,
  updateMobileNumber,
  updateEmail,
  logoutUser,
  forgotPassword,
  resetPassword,
  updatePassword,
  deactivateAccount,
  refreshToken,
  deleteAccount,
} = require("../controllers/userController");
const upload = require("../utils/multer");

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(isAuthenticatedUser, checkDeactivated, logoutUser);
router
  .route("/update/password")
  .put(isAuthenticatedUser, checkDeactivated, updatePassword);
router.route("/forgot/password").post(forgotPassword);
router.route("/password/reset/:token").post(resetPassword);
router
  .route("/2fa/activate")
  .post(isAuthenticatedUser, checkDeactivated, twoFactorAuth);
router
  .route("/update/avatar")
  .post(
    upload.single("avatar"),
    isAuthenticatedUser,
    checkDeactivated,
    uploadAvatar
  );
router
  .route("/generate/email/otp")
  .get(isAuthenticatedUser, checkDeactivated, generateMailOTP);
router
  .route("/generate/mobile/otp")
  .get(isAuthenticatedUser, checkDeactivated, generateMobileOTP);
router
  .route("/update/profile")
  .put(isAuthenticatedUser, checkDeactivated, updateProfile);
router
  .route("/update/mobile")
  .put(isAuthenticatedUser, checkDeactivated, updateMobileNumber);
router
  .route("/update/email")
  .put(isAuthenticatedUser, checkDeactivated, updateEmail);
router
  .route("/verify/otp")
  .post(isAuthenticatedUser, checkDeactivated, verifyMobileAndEmailOTP);
router
  .route("/qr/generate")
  .post(isAuthenticatedUser, checkDeactivated, generateQr);
router.route("/qr/scan").post(scanQr);
router.route("/").get(isAuthenticatedUser, checkDeactivated, allUsers);
router.route("/deactivate").post(isAuthenticatedUser, deactivateAccount);
router.route('/delete-account').delete(isAuthenticatedUser,deleteAccount)
router.route('/refresh-token').get(refreshToken)

module.exports = router;
