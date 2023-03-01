const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middlewares/auth");
const { register, login, allUsers } = require("../controllers/userController");

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/").get(isAuthenticatedUser, allUsers);

module.exports = router;
