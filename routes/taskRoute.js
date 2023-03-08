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
  deleteTask,
  editTask,
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
router.route('/edit/:id').put(isAuthenticatedUser, checkDeactivated,editTask)
router.route('/delete/:id/:boardId').delete(isAuthenticatedUser,checkDeactivated,deleteTask)

module.exports = router;
