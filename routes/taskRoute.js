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
  getTasks,
  createCard,
  editCard,
  getCard,
  deleteCard,
  createChecklists,
  addChecklistContent,
  removeMemberFromBoard,
  removeMemberFromCard,
  editChecklistContent,
  removeMemberFromContent,
  onComplete,
  deleteChecklistContent,
  addMembersToContent,
  addMembersToCard,
  completeChecklist,
  editChecklist,
  deleteChecklist,
  moveCard,
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
router
  .route("/edit/:taskId/:boardId")
  .put(isAuthenticatedUser, checkDeactivated, editTask);
router
  .route("/delete/:id/:boardId")
  .delete(isAuthenticatedUser, checkDeactivated, deleteTask);
router
  .route("/get/:taskId")
  .get(isAuthenticatedUser, checkDeactivated, getTasks);

//Card
router
  .route("/card/:taskId")
  .post(isAuthenticatedUser, checkDeactivated, createCard);
router
  .route("/card/:cardId/:boardId")
  .get(isAuthenticatedUser, checkDeactivated, getCard);
router
  .route("/card/edit/:cardId/:boardId")
  .put(isAuthenticatedUser, checkDeactivated, editCard);
router
  .route("/card/member/:cardId/:boardId")
  .put(isAuthenticatedUser, checkDeactivated, addMembersToCard);
router
  .route("/card/move-card/:cardId/from/:currentTaskId/to/:newTaskId")
  .put(isAuthenticatedUser, checkDeactivated, moveCard);
router
  .route("/card/member/remove/:cardId")
  .delete(isAuthenticatedUser, checkDeactivated, removeMemberFromCard);
router
  .route("/card/:taskId/:cardId")
  .delete(isAuthenticatedUser, checkDeactivated, deleteCard);

//Checklist
router
  .route("/checklist/:cardId")
  .post(isAuthenticatedUser, checkDeactivated, createChecklists);
router
  .route("/checklist/edit/:checklistId")
  .put(isAuthenticatedUser, checkDeactivated, editChecklist);
router
  .route("/checklist/delete/:checklistId/:cardId")
  .delete(isAuthenticatedUser, checkDeactivated, deleteChecklist);
router
  .route("/checklist/complete/:cardId/:checklistId")
  .put(isAuthenticatedUser, checkDeactivated, completeChecklist);
router
  .route("/checklist/content/add/:checklistId/:cardId")
  .post(isAuthenticatedUser, checkDeactivated, addChecklistContent);
router
  .route("/checklist/content/edit/:checklistId/:contentId/:cardId")
  .put(isAuthenticatedUser, checkDeactivated, editChecklistContent);

router
  .route("/checklist/content/member/:checklistId/:contentId/:cardId")
  .put(isAuthenticatedUser, checkDeactivated, addMembersToContent)
  .delete(isAuthenticatedUser, checkDeactivated, removeMemberFromContent);
router
  .route("/checklist/content/complete/:checklistId/:contentId/:cardId")
  .put(isAuthenticatedUser, checkDeactivated, onComplete);
router
  .route("/checklist/content/delete/:checklistId/:contentId/:cardId")
  .delete(isAuthenticatedUser, checkDeactivated, deleteChecklistContent);

module.exports = router;
