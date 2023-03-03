const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middlewares/auth");
const {
  sendMessage,
  allMessages,
  sendAudioMessage,
  sendVideoMessage,
} = require("../controllers/messageController");
const upload = require("../utils/audioMulter");
const uploadVideo = require("../utils/videoMullter");

router.route("/").post(isAuthenticatedUser, sendMessage);
router
  .route("/send/audio")
  .post(upload.single("audio"), isAuthenticatedUser, sendAudioMessage);
router
  .route("/send/video")
  .post(uploadVideo.single("video"), isAuthenticatedUser, sendVideoMessage);
router.route("/:chatId").get(isAuthenticatedUser, allMessages);

module.exports = router;
