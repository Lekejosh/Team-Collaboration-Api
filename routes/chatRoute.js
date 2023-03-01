const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middlewares/auth");
const { accessChat } = require("../controllers/chatControllers");

router.route("/").post(isAuthenticatedUser, accessChat);

module.exports = router;
