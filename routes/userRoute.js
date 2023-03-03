const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middlewares/auth");
const { register, login, allUsers, generateQr, scanQr, uploadAvatar, twoFactorAuth } = require("../controllers/userController");
const upload = require("../utils/multer")

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/2fa/activate").post(isAuthenticatedUser, twoFactorAuth);
router.route("/update/avatar").post(upload.single("avatar"),isAuthenticatedUser, uploadAvatar);
router.route('/qr/generate').post(isAuthenticatedUser,generateQr)
router.route('/qr/scan').post(scanQr)
router.route("/").get(isAuthenticatedUser, allUsers);

module.exports = router;


