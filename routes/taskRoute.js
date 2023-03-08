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
  createCard,
  getTasks,
  editCard,
} = require("../controllers/taskController");

router.route("/:groupId").post(isAuthenticatedUser, checkDeactivated, createBoard);
router
  .route("/board/:id")
  .get(isAuthenticatedUser, checkDeactivated, getBoard)
  .put(isAuthenticatedUser, checkDeactivated, boardEdit)
  .delete(isAuthenticatedUser, checkDeactivated, deleteBoard);
router.route("/all/board").get(isAuthenticatedUser, checkDeactivated, getAllBoard);

//Task
router
  .route("/create-task/:boardId")
  .post(isAuthenticatedUser, checkDeactivated, createTask);
router.route("/edit/:id").put(isAuthenticatedUser, checkDeactivated, editTask);
router
  .route("/delete/:id/:boardId")
  .delete(isAuthenticatedUser, checkDeactivated, deleteTask);
router
  .route("/get/:boardId")
  .get(isAuthenticatedUser, checkDeactivated, getTasks);

//Card
router
  .route("/card/:id")
  .post(isAuthenticatedUser, checkDeactivated, createCard);
router
  .route("/card/edit/:cardId")
  .put(isAuthenticatedUser, checkDeactivated, editCard);

module.exports = router;
