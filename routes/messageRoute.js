const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middlewares/auth");
const { sendMessage, allMessages } = require("../controllers/messageController.js");

router.route("/").post(isAuthenticatedUser, sendMessage);
router.route("/:chatId").get(isAuthenticatedUser, allMessages);

module.exports = router;
