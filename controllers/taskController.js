const Board = require("../models/boardModel");
const User = require("../models/userModel");
const Card = require("../models/cardModel");
const Checklist = require("../models/checklistModel");
const Chat = require("../models/chatModel");
const Task = require("../models/taskModel");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const sendEmail = require("../utils/sendMail");

exports.createBoard = catchAsyncErrors(async (req, res, next) => {
  const { groupId } = req.params;

  if (!groupId) {
    const { title, background } = req.body;
    const board = await Board.create({
      title,
      type: "private",
      background,
      createdBy: req.user._id,
    });
    return res.status(201).json({ success: true, board });
  }

  const { title, background, users } = req.body;
  const members = JSON.parse(users);
  members.push(req.user._id.toString());
  //  const members = JSON.stringify(groupMembers);
  // console.log(members);

  const group = await Chat.findById(groupId).populate("users");

  if (!group) {
    return next(new ErrorHandler("Group not found", 404));
  }

  if (!group.isGroupChat) {
    return next(new ErrorHandler("This is not a group chat", 400));
  }

  const groupAdmin = group.groupAdmin.toString();

  if (req.user._id.toString() !== groupAdmin) {
    return next(
      new ErrorHandler("You are not authorized to create a workspace", 401)
    );
  }

  const selectedUsers = [];

  // Check if the specified members are in the group
  for (let i = 0; i < members.length; i++) {
    const member = members[i];

    const memberExists = group.users.find(
      (user) => user._id.toString() === member
    );

    if (memberExists) {
      selectedUsers.push(memberExists);
    } else {
      return next(new ErrorHandler(`User ${member} is not in the group`, 400));
    }
  }

  const board = await Board.create({
    title,
    type: "workspace",
    members: selectedUsers,
    background,
    group: groupId,
    createdBy: req.user._id,
  });

  group.workspace.push(board._id);
  await group.save();

  await board.populate({
    path: "members",
    select: "-password",
  });

  res.status(201).json({ success: true, board });
});

exports.getBoard = catchAsyncErrors(async (req, res, next) => {
  const board = await Board.findById(req.params.id).populate("tasks");
  if (!board) {
    return next(new ErrorHandler("Board not Found", 404));
  }
  res.status(200).json({ success: true, board });
});

exports.getAllBoard = catchAsyncErrors(async (req, res, next) => {
  const board = await Board.find({ createdBy: req.user._id });

  if (!board) {
    return next(new ErrorHandler("No Board found", 404));
  }

  res.status(200).json({ success: true, board });
});

exports.boardEdit = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const { title, type, priority, background } = req.body;

  const board = await Board.findByIdAndUpdate(
    id,
    { title, type, priority, background },
    { new: true }
  );

  if (!board) {
    return next(new ErrorHandler("Board not Found", 404));
  }

  res.status(200).json({ success: true, board });
});

exports.deleteBoard = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const board = await Board.findById(id);

  if (!board) {
    return next(new ErrorHandler("Board not Found", 404));
  }
  if (board.createdBy.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Unauthorized to perform this action", 401));
  }

  // Remove the board from the corresponding group
  const groupId = board.group;
  if (groupId) {
    const group = await Chat.findById(groupId);
    if (group) {
      group.workspace.pull(board._id);
      await group.save();
    }
  }

  // Delete the board
  await board.remove();

  res.status(200).json({ success: true });
});

exports.createTask = catchAsyncErrors(async (req, res, next) => {
  const { boardId } = req.params;
  const { title } = req.body;

  const board = await Board.findById(boardId);
  if (!board) {
    return next(new ErrorHandler("Board not Found", 404));
  }
  const task = await Task.create({ title, boardId: boardId });

  board.tasks.push(task._id);
  await board.save();

  res.status(201).json({
    success: true,
    task,
  });
});

exports.getTasks = catchAsyncErrors(async (req, res, next) => {
  const { boardId } = req.params;
  const task = await Task.find({ boardId: boardId })
    .populate("cards")
    .populate("assignedTo");

  if (!task) {
    return next(new ErrorHandler("No Tasks Created", 404));
  }

  res.status(200).json({ success: true, task });
});

exports.editTask = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { title } = req.body;
  const task = await Task.findByIdAndUpdate(
    id,
    { title: title },
    { new: true }
  );
  if (!task) {
    return next(new ErrorHandler("Task not Found", 404));
  }
  res.status(200).json({
    success: true,
    task,
  });
});

exports.deleteTask = catchAsyncErrors(async (req, res, next) => {
  const { id, boardId } = req.params;
  const task = await Task.findById(id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  const board = await Board.findById(boardId);

  if (!board) {
    return next(new ErrorHandler("Board not found", 404));
  }

  const tasks = board.tasks;

  // Check if the task exists in the board's tasks
  const taskIndex = tasks.findIndex((task) => task._id.toString() === id);

  if (taskIndex === -1) {
    return next(new ErrorHandler("Task not found in board", 404));
  }

  tasks.splice(taskIndex, 1);
  await task.remove();
  await board.save();

  res.status(200).json({ success: true });
});

exports.createCard = catchAsyncErrors(async (req, res, next) => {
  const { title } = req.body;
  const { id } = req.params;

  const task = await Task.findById(id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }
  const card = await Card.create({ title, createdBy: req.user._id });

  task.cards.push(card._id);
  await task.save();

  res.status(200).json({ success: true, card });
});

exports.editCard = catchAsyncErrors(async (req, res, next) => {
  const { cardId } = req.params;
  const edit = {
    title: req.body.title,
    description: req.body.descriptions,
    watch: req.body.watch,
    startDate: req.body.startDate,
    dueDate: req.body.dueDate,
    startDateReminder: req.body.startDateReminder,
    dueDateReminder: req.body.dueDateReminder,
  };

  const card = await Card.findByIdAndUpdate(cardId, edit, { new: true });
  if (!card) {
    return next(new ErrorHandler("Card does not exist", 404));
  }
  res.status(200).json({ success: true, card });
});

exports.deleteCard = catchAsyncErrors(async (req, res, next) => {
  const { cardId, taskId } = req.params;

  if (!cardId) {
    return next(new ErrorHandler("CardId not specified", 400));
  }

  const card = await Card.findById(cardId);
  if (!card) {
    return next(new ErrorHandler("Card not found", 404));
  }

  const task = await Task.findById(taskId);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  if (req.user._id.toString() !== card.createdBy.toString()) {
    return next(new ErrorHandler("Unauthorized", 401));
  }

  await card.remove();
  await task.cards.pull(cardId);
  await task.save();

  res.status(200).json({ success: true });
});

exports.members = catchAsyncErrors;

exports.createChecklists = catchAsyncErrors(async (req, res, next) => {
  const { cardId } = req.params;
  const { title } = req.body;

  if (!cardId) {
    return next(new ErrorHandler("CardId not specified", 400));
  }

  const card = await Card.findById(cardId);

  if (!card) {
    return next(new ErrorHandler("Card not found", 404));
  }
  const checklist = await Checklist.create({ title, cardId: cardId });

  card.checklist.push(checklist._id);
  await card.save();
  await card.populate("checklist");
  res.status(200).json({ success: true, card });
});

exports.addChecklistContent = catchAsyncErrors(async (req, res, next) => {
  const { checklistId, boardId } = req.params;
  const { cardId } = req.query;
  const { title, dueDate, startDate, addMembers } = req.body;
  const members = JSON.parse(addMembers);

  if (!cardId || !boardId || !checklistId) {
    return next(new ErrorHandler("All parameters not specified", 400));
  }

  const board = await Board.findById(boardId);
  if (!board) {
    return next(new ErrorHandler("Board not found", 404));
  }

  const card = await Card.findById(cardId);
  if (!card) {
    return next(new ErrorHandler("Card not found", 404));
  }

  const checklistExists = card.checklist.some((checklist) => {
    return checklist.toString() === checklistId.toString();
  });

  if (!checklistExists) {
    return next(new ErrorHandler("Checklist not found in card", 404));
  }

  const selectedUsers = [];
  for (let i = 0; i < members.length; i++) {
    const member = members[i];

    const memberExists = board.members.find(
      (user) => user._id.toString() === member
    );

    if (memberExists) {
      selectedUsers.push(memberExists);
    } else {
      return next(new ErrorHandler(`User ${member} is not in the group`, 400));
    }
  }

  const checklist = await Checklist.findById(checklistId);
  if (!checklist) {
    return next(new ErrorHandler("Checklist not found", 404));
  }

  checklist.content.push({ title, dueDate, startDate,isCompleted:false, members: selectedUsers });
  await checklist.save();

  res.status(200).json({ success: true, checklist });
});
