const express = require("express");
const router = express.Router();
const {
  isAuthenticatedUser,
  checkDeactivated,
} = require("../middlewares/auth");
const {
  sendMessage,
  allMessages,
  sendAudioMessage,
  sendVideoMessage,
  sendImageMessage,
  sendDocumentMessage,
  deleteMessageFromSelf,
  deleteMessageFromEverybody,
} = require("../controllers/messageController");
const upload = require("../utils/audioMulter");
const uploadImage = require("../utils/multer");
const uploadVideo = require("../utils/videoMullter");
const uploadDocument = require("../utils/documentMulter");

router.route("/").post(isAuthenticatedUser, checkDeactivated, sendMessage);
router
  .route("/send/audio")
  .post(
    upload.single("audio"),
    isAuthenticatedUser,
    checkDeactivated,
    sendAudioMessage
  );
router
  .route("/send/video")
  .post(
    uploadVideo.single("video"),
    isAuthenticatedUser,
    checkDeactivated,
    sendVideoMessage
  );
router
  .route("/send/image")
  .post(
    uploadImage.single("image"),
    isAuthenticatedUser,
    checkDeactivated,
    sendImageMessage
  );2
router
  .route("/send/document")
  .post(
    uploadDocument.single("document"),
    isAuthenticatedUser,
    checkDeactivated,
    sendDocumentMessage
  );
router
  .route("/:chatId")
  .get(isAuthenticatedUser, checkDeactivated, allMessages);

router
  .route("/:chatId/:messageId")
  .delete(isAuthenticatedUser, checkDeactivated, deleteMessageFromSelf);
router
  .route("/:chatId/:messageId/all")
  .delete(isAuthenticatedUser, checkDeactivated, deleteMessageFromEverybody);

module.exports = router;
