const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middlewares/auth");
const {
  sendMessage,
  allMessages,
  sendAudioMessage,
  sendVideoMessage,
  sendImageMessage,
  sendDocumentMessage,
} = require("../controllers/messageController");
const upload = require("../utils/audioMulter");
const uploadImage = require("../utils/Multer");
const uploadVideo = require("../utils/videoMullter");
const uploadDocument = require("../utils/documentMulter");

router.route("/").post(isAuthenticatedUser, sendMessage);
router
  .route("/send/audio")
  .post(upload.single("audio"), isAuthenticatedUser, sendAudioMessage);
router
  .route("/send/video")
  .post(uploadVideo.single("video"), isAuthenticatedUser, sendVideoMessage);
router
  .route("/send/image")
  .post(uploadImage.single("image"), isAuthenticatedUser, sendImageMessage);
router
  .route("/send/document")
  .post(
    uploadDocument.single("document"),
    isAuthenticatedUser,
    sendDocumentMessage 
  );
router.route("/:chatId").get(isAuthenticatedUser, allMessages);

module.exports = router;
