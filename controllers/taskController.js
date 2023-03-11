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

exports.removeMemberFromBoard = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new ErrorHandler("Board Id not specified", 404));
  }

  const board = await Board.findById(id);
  if (!board) {
    return next(new ErrorHandler("Board not found", 404));
  }

  const { users } = req.body;
  const members = JSON.parse(users);

  for (let i = 0; i < members.length; i++) {
    const member = members[i];

    const memberExists = board.members.find(
      (user) => user._id.toString() === member
    );

    if (memberExists) {
      board.members.pull(memberExists);
    } else {
      return next(
        new ErrorHandler(`User ${member} is not a member of the board`, 400)
      );
    }
  }

  await board.save();

  res.status(200).json({
    success: true,
    message: "Members removed from the card successfully",
  });
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
  const { cardId, boardId } = req.params;

  const board = await Board.findById(boardId);

  if (!board) {
    return next(new ErrorHandler("Board not found", 404));
  }

  const { users } = req.body;
  const members = JSON.parse(users);

  const selectedUsers = [];

  for (let i = 0; i < members.length; i++) {
    const member = members[i];

    const memberExists = board.members.find(
      (user) => user._id.toString() === member
    );

    if (memberExists) {
      selectedUsers.push(memberExists);
    } else {
      return next(new ErrorHandler(`User ${member} is not in the board`, 400));
    }
  }

  const edit = {
    title: req.body.title,
    description: req.body.descriptions,
    watch: req.body.watch,
    startDate: req.body.startDate,
    dueDate: req.body.dueDate,
    startDateReminder: req.body.startDateReminder,
    dueDateReminder: req.body.dueDateReminder,
    members: selectedUsers,
  };

  const card = await Card.findByIdAndUpdate(cardId, edit, { new: true });
  if (!card) {
    return next(new ErrorHandler("Card does not exist", 404));
  }
  res.status(200).json({ success: true, card });
});

exports.removeMemberFromCard = catchAsyncErrors(async (req, res, next) => {
  const { cardId } = req.params;

  if (!cardId) {
    return next(new ErrorHandler("Card Id not specified", 404));
  }

  const card = await Card.findById(cardId);
  if (!card) {
    return next(new ErrorHandler("Card not found", 404));
  }

  const { users } = req.body;
  const members = JSON.parse(users);

  for (let i = 0; i < members.length; i++) {
    const member = members[i];

    const memberExists = card.members.find(
      (user) => user._id.toString() === member
    );

    if (memberExists) {
      card.members.pull(memberExists);
    } else {
      return next(
        new ErrorHandler(`User ${member} is not a member of the card`, 400)
      );
    }
  }

  await card.save();

  res.status(200).json({
    success: true,
    message: "Member(s) removed from the card successfully",
  });
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
  const { checklistId, cardId } = req.params;
  const {
    title = "",
    dueDate = null,
    startDate = null,
    addMembers = "[]",
  } = req.body;
  const members = JSON.parse(addMembers);

  if (!cardId || !checklistId) {
    return next(new ErrorHandler("All parameters not specified", 400));
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

    const memberExists = card.members.find(
      (user) => user._id.toString() === member
    );

    if (memberExists) {
      selectedUsers.push(memberExists);
    } else {
      return next(new ErrorHandler(`User ${member} is not in the Card`, 400));
    }
  }

  const checklist = await Checklist.findById(checklistId);
  if (!checklist) {
    return next(new ErrorHandler("Checklist not found", 404));
  }

  const oldCompletedTasks = checklist.content.filter(
    (task) => task.isCompleted
  );

  checklist.content.push({
    title,
    dueDate,
    startDate,
    isCompleted: false,
    addMembers: selectedUsers,
  });

  // Update totalCompleted property for completed tasks
  const newCompletedTasks = checklist.content.filter(
    (task) => task.isCompleted
  );
  const totalCompletedTasks = newCompletedTasks.length;

  if (totalCompletedTasks !== oldCompletedTasks.length) {
    // Completed status of a task has been changed
    checklist.totalTask = checklist.content.length;
    checklist.totalCompleted = totalCompletedTasks;
  } else if (totalCompletedTasks > 0) {
    // A new task has been completed
    checklist.totalTask = checklist.content.length;
    checklist.totalCompleted = totalCompletedTasks;
  } else {
    // No tasks are completed
    checklist.totalTask = checklist.content.length;
    checklist.totalCompleted = 0;
  }

  await checklist.save();

  res.status(200).json({ success: true, checklist });
});

exports.editChecklistContent = catchAsyncErrors(async (req, res, next) => {
  const { cardId, checklistId, contentId } = req.params;

  if (!cardId || !checklistId || !contentId) {
    return next(new ErrorHandler("IDs not specified", 400));
  }

  const card = await Card.findById(cardId);
  if (!card) {
    return next(new ErrorHandler("Card not found", 404));
  }

  const checklist = await Checklist.findById(checklistId);
  if (!checklist) {
    return next(new ErrorHandler("Checklist not found", 404));
  }

  const contentIndex = checklist.content.findIndex(
    (content) => content._id.toString() === contentId
  );
  if (contentIndex === -1) {
    return next(new ErrorHandler("Content not found", 404));
  }

  const { title, isCompleted, startDate, dueDate, users } = req.body;
  const selectedUsers = [];

  if (users) {
    const members = JSON.parse(users);

    for (let i = 0; i < members.length; i++) {
      const member = members[i];

      const memberExists = card.members.find(
        (user) => user._id.toString() === member
      );

      if (memberExists) {
        selectedUsers.push(memberExists);
      } else {
        return next(
          new ErrorHandler(`User ${member} is not a member of the card`, 400)
        );
      }
    }
  }

  checklist.content[contentIndex].title =
    title || checklist.content[contentIndex].title;
  checklist.content[contentIndex].isCompleted =
    isCompleted || checklist.content[contentIndex].isCompleted;
  checklist.content[contentIndex].startDate =
    startDate || checklist.content[contentIndex].startDate;
  checklist.content[contentIndex].dueDate =
    dueDate || checklist.content[contentIndex].dueDate;
  checklist.content[contentIndex].addMembers =
    selectedUsers || checklist.content[contentIndex].addMembers;

  await checklist.save();

  res.status(200).json({
    success: true,
    message: "Checklist content updated successfully",
  });
});

exports.removeMemberFromContent = catchAsyncErrors(async (req, res, next) => {
  const { cardId, checklistId, contentId } = req.params;

  if (!cardId || !checklistId || !contentId)
    return next(new ErrorHandler("IDs not specified", 400));

  const card = await Card.findById(cardId);
  if (!card) return next(new ErrorHandler("Card not found", 404));

  const checklist = await Checklist.findById(checklistId);

  if (!checklist) return next(new ErrorHandler("Checklist not found", 404));

  const content = checklist.content.id(contentId);

  if (!content) return next(new ErrorHandler("Content not found", 404));

  const { users } = req.body;
  const members = JSON.parse(users);
  const selectedUsers = [];
  if (card.createdBy._id.toString() !== req.user._id.toString())
    return next(new ErrorHandler("Unauthorized", 401));

  for (let i = 0; i < members.length; i++) {
    const member = members[i];

    const memberExists = content.addMembers.find(
      (user) => user._id.toString() === member
    );

    if (memberExists) {
      selectedUsers.push(memberExists);
    } else {
      return next(
        new ErrorHandler(`User ${member} is not a member of the content`, 400)
      );
    }
  }

  selectedUsers.forEach((user) => {
    content.addMembers.pull(user);
  });

  await card.save();

  res.status(200).json({
    success: true,
    message: "Member(s) removed from content successfully",
  });
});

exports.onComplete = catchAsyncErrors(async (req, res, next) => {
  const { cardId, checklistId, contentId } = req.params;

  if (!cardId || !checklistId || !contentId)
    return next(new ErrorHandler("IDs not specified", 400));

  const card = await Card.findById(cardId);
  if (!card) return next(new ErrorHandler("Card not found", 404));

  const checklist = await Checklist.findById(checklistId);
  if (!checklist) return next(new ErrorHandler("Checklist not found", 404));

  const contentIndex = checklist.content.findIndex(
    (c) => c._id.toString() === contentId
  );
  if (contentIndex === -1)
    return next(new ErrorHandler("Content not found", 404));

  const complete = req.body.isCompleted;
  if (checklist.content[contentIndex].addMembers.length > 0) {
    const userExist = checklist.content[contentIndex].addMembers.find(
      (user) => user._id.toString() === req.user._id.toString()
    );
    console.log(card.createdBy._id.toString(), req.user._id.toString());
    if (
      userExist ||
      card.createdBy._id.toString() === req.user._id.toString()
    ) {
      checklist.content[contentIndex].isCompleted =
        complete || checklist.content[contentIndex].isCompleted;
      await updateTotalCompleted(checklistId);
      await checklist.save();

      return res.status(200).json({ success: true });
    } else {
      return next(new ErrorHandler("Unauthorized"));
    }
  }

  if (card.createdBy._id.toString() !== req.user._id.toString())
    return next(new ErrorHandler("Unauthorized"));
  checklist.content[contentIndex].isCompleted =
    complete || checklist.content[contentIndex].isCompleted;
  await updateTotalCompleted(checklistId);
  await checklist.save();

  res.status(200).json({ success: true });
});

exports.deleteChecklistContent = catchAsyncErrors(async (req, res, next) => {
  const { checklistId, cardId, contentId } = req.params;
  if (!checklistId || !cardId || !contentId) {
    return next(new ErrorHandler("All parameters must be specified", 400));
  }

  const card = await Card.findById(cardId);
  if (!card) {
    return next(new ErrorHandler("Card not found", 404));
  }

  const checklist = await Checklist.findById(checklistId);
  if (!checklist) {
    return next(new ErrorHandler("Checklist not found", 404));
  }

  const contentIndex = checklist.content.findIndex(
    (c) => c._id.toString() === contentId
  );
  if (contentIndex === -1) {
    return next(new ErrorHandler("Content not found", 404));
  }

  if (checklist.content[contentIndex].addMembers.length > 0) {
    const userExist = checklist.content[contentIndex].addMembers.find(
      (user) => user._id.toString() === req.user._id.toString()
    );
    if (
      userExist ||
      card.createdBy._id.toString() === req.user._id.toString()
    ) {
      checklist.content.splice(contentIndex, 1);
      await updateTotalCompleted(checklistId);
      await checklist.save();

      return res.status(200).json({ success: true });
    } else {
      return next(new ErrorHandler("Unauthorized", 401));
    }
  } else if (card.createdBy._id.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Unauthorized", 401));
  } else {
    checklist.content.splice(contentIndex, 1);
    await updateTotalCompleted(checklistId);
    await checklist.save();

    res.status(200).json({ success: true });
  }
});
 // TODO: Not consedring the last element in the array
async function updateTotalCompleted(checklistId) {
  const checklist = await Checklist.findById(checklistId);

  if (!checklist) {
    throw new Error("Checklist not found");
  }

  let totalCompleted = 0;
  let totalTask = 0;
  if (checklist.content.length > 0) {
    for (let i = 0; i < checklist.content.length; i++) {
      const contentItem = checklist.content[i];
      if (contentItem.isCompleted) {
        totalCompleted += 1;
      }
      if (i === checklist.content.length - 1) {
        totalTask = i + 1;
      }
    }
  }

  const prevTotalCompleted = checklist.totalCompleted;
  const prevTotalTask = checklist.totalTask;

  checklist.totalCompleted = totalCompleted;
  checklist.totalTask = totalTask;

  // If the totalCompleted or totalTask count has changed, save the document
  if (prevTotalCompleted !== totalCompleted || prevTotalTask !== totalTask) {
    await checklist.save();
  }

  return checklist;
}
