const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middlewares/auth");
const { register, login, allUsers, generateQr, scanQr } = require("../controllers/userController");

router.route("/register").post(register);
router.route("/login").post(login);
router.route('/qr/generate').post(isAuthenticatedUser,generateQr)
router.route('/qr/scan').post(scanQr)
router.route("/").get(isAuthenticatedUser, allUsers);

module.exports = router;
