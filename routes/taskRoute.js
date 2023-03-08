const express = require("express");
const router = express.Router();
const {
  checkDeactivated,
  isAuthenticatedUser,
} = require("../middlewares/auth");

const { createBoard, boardEdit } = require("../controllers/taskController");

router.route("/").post(isAuthenticatedUser, checkDeactivated, createBoard);
router.route("/edit/:id").put(isAuthenticatedUser, checkDeactivated, boardEdit);

module.exports = router;
