const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middlewares/auth");
const {
  sendMessage,
  allMessages,
  sendAudioMessage,
} = require("../controllers/messageController.js");
const upload = require("../utils/audioMulter.js");

router.route("/").post(isAuthenticatedUser, sendMessage);
router
  .route("/send/audio")
  .post(upload.single("audio"), isAuthenticatedUser, sendAudioMessage);
router.route("/:chatId").get(isAuthenticatedUser, allMessages);

module.exports = router;
