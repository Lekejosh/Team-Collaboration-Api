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
  deleteCard,
  createChecklists,
  addChecklistContent,
  removeMemberFromBoard,
  removeMemberFromCard,
  editChecklistContent,
  removeMemberFromContent,
  onComplete,
  deleteChecklistContent,
} = require("../controllers/taskController");

router
  .route("/:groupId")
  .post(isAuthenticatedUser, checkDeactivated, createBoard);
router
  .route("/board/:id")
  .get(isAuthenticatedUser, checkDeactivated, getBoard)
  .put(isAuthenticatedUser, checkDeactivated, boardEdit)
  .delete(isAuthenticatedUser, checkDeactivated, deleteBoard);
router
  .route("/board/member-remove/:id")
  .delete(isAuthenticatedUser, checkDeactivated, removeMemberFromBoard);
router
  .route("/all/board")
  .get(isAuthenticatedUser, checkDeactivated, getAllBoard);

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
  .route("/card/edit/:cardId/:boardId")
  .put(isAuthenticatedUser, checkDeactivated, editCard);
router
  .route("/card/remove-member/:cardId")
  .delete(isAuthenticatedUser, checkDeactivated, removeMemberFromCard);
router
  .route("/card/:taskId/:cardId")
  .delete(isAuthenticatedUser, checkDeactivated, deleteCard);

//Checklist
router
  .route("/checklist/:cardId")
  .post(isAuthenticatedUser, checkDeactivated, createChecklists);
router
  .route("/checklist/content/add/:checklistId/:cardId")
  .put(isAuthenticatedUser, checkDeactivated, addChecklistContent);
router
  .route("/checklist/content/edit/:checklistId/:contentId/:cardId")
  .put(isAuthenticatedUser, checkDeactivated, editChecklistContent)
  .delete(isAuthenticatedUser, checkDeactivated, removeMemberFromContent);
router
  .route("/checklist/content/complete/:checklistId/:contentId/:cardId")
  .patch(isAuthenticatedUser, checkDeactivated, onComplete);
router
  .route("/checklist/content/delete/:checklistId/:contentId/:cardId")
  .delete(isAuthenticatedUser, checkDeactivated, deleteChecklistContent);

module.exports = router;
