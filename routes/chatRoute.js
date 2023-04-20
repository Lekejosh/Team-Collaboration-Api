const express = require("express");
const router = express.Router();
const {
  isAuthenticatedUser,
  checkDeactivated,
} = require("../middlewares/auth");
const {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  changeGroupIcon,
  removeGroupIcon,
  exitGroup,
} = require("../controllers/chatControllers");
const upload = require("../utils/multer");
router.route("/").post(isAuthenticatedUser, checkDeactivated, accessChat);
router.route("/fetch").get(isAuthenticatedUser, checkDeactivated, fetchChats);
router
  .route("/create/group")
  .post(isAuthenticatedUser, checkDeactivated, createGroupChat);
router
  .route("/group/rename")
  .put(isAuthenticatedUser, checkDeactivated, renameGroup);
router
  .route("/group/add")
  .put(isAuthenticatedUser, checkDeactivated, addToGroup);
router
  .route("/group/remove")
  .put(isAuthenticatedUser, checkDeactivated, removeFromGroup);

router
  .route("/group/icon/:chatId")
  .put(
    upload.single("avatar"),
    isAuthenticatedUser,
    checkDeactivated,
    changeGroupIcon
  )
  .delete(isAuthenticatedUser, checkDeactivated, removeGroupIcon);
router
  .route("/group/exit")
  .delete(isAuthenticated, checkDeactivated, exitGroup);

module.exports = router;
