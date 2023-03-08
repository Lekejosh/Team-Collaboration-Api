const express = require("express");
const router = express.Router();
const {
  checkDeactivated,
  isAuthenticatedUser,
} = require("../middlewares/auth");

const {
  createBoard,
  boardEdit,
  deleteBoard,
  getBoard,
  getAllBoard,
  createTask,
} = require("../controllers/taskController");

router.route("/").post(isAuthenticatedUser, checkDeactivated, createBoard);
router
  .route("/board/:id")
  .get(isAuthenticatedUser, checkDeactivated, getBoard)
  .put(isAuthenticatedUser, checkDeactivated, boardEdit)
  .delete(isAuthenticatedUser, checkDeactivated, deleteBoard);
router.route('/all').get(isAuthenticatedUser, checkDeactivated, getAllBoard)

//Task
router.route('/create-task/:boardId').post(isAuthenticatedUser, checkDeactivated,createTask)

module.exports = router;
