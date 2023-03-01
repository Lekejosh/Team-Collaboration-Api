const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middlewares/auth");
const { accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup } = require("../controllers/chatControllers");

router.route("/").post(isAuthenticatedUser, accessChat);
router.route('/fetch').get(isAuthenticatedUser,fetchChats)
router.route("/create/group").post(isAuthenticatedUser, createGroupChat);
router.route("/group/rename").put(isAuthenticatedUser, renameGroup);
router.route("/group/add").put(isAuthenticatedUser, addToGroup);
router.route("/group/remove").put(isAuthenticatedUser, removeFromGroup);

module.exports = router;
