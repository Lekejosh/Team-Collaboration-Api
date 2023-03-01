const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middlewares/auth");
const { accessChat, fetchChats, createGroupChat, renameGroup } = require("../controllers/chatControllers");

router.route("/").post(isAuthenticatedUser, accessChat);
router.route('/fetch').get(isAuthenticatedUser,fetchChats)
router.route("/create/group").post(isAuthenticatedUser, createGroupChat);
router.route("/group/rename").put(isAuthenticatedUser, renameGroup);

module.exports = router;
