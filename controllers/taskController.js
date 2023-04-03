const Board = require("../models/boardModel");
const User = require("../models/userModel");
const Card = require("../models/cardModel");
const Checklist = require("../models/checklistModel");
const Chat = require("../models/chatModel");
const Task = require("../models/taskModel");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const sendEmail = require("../utils/sendMail");

//TODO: Add member to board

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
  for (let i = 0; i < selectedUsers.length; i++) {
    const user = await User.findById(selectedUsers[i]);
    await sendEmail({
      email: `${user.username} <${user.email}>`,
      subject: "Added to Board",
      html: `Dear <b>${user.lastName} ${user.firstName}</b>, \n\n\n\n You've been added to <b>${group.chatName}'s</b> Task Board`,
    });
  }

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

  const board = await Board.findById(id).populate();
  if (!board) {
    return next(new ErrorHandler("Board not found", 404));
  }
  if (board.createdBy.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Unauthorized to perform this action", 401));
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
  for (let i = 0; i < members.length; i++) {
    const user = await User.findById(members[i]);
    await sendEmail({
      email: `${user.username} <${user.email}>`,
      subject: "Removed From Board",
      html: `Dear <b>${user.lastName} ${user.firstName}</b>, \n\n\n\n You've been added to <b>${board.group.chatName}'s</b> Task Board`,
    });
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

  const groupId = board.group;
  if (groupId) {
    const group = await Chat.findById(groupId);
    if (group) {
      group.workspace.pull(board._id);
      await group.save();
    }
  }
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
  const task = await Task.create({
    title,
    boardId,
    createdBy: { user: req.user._id, time: Date.now() },
  });

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
  const { taskId, boardId } = req.params;
  const { title } = req.body;

  if (!taskId || !boardId) {
    return next(new ErrorHandler("All parameters are required", 400));
  }

  const board = await Board.findById(boardId);

  if (!board) {
    return next(new ErrorHandler("Board not found", 404));
  }

  const member = board.members.find(
    (user) => user._id.toString() === req.user._id.toString()
  );

  if (!member || board.createdBy.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Unauthorized", 401));
  }

  const task = await Task.findByIdAndUpdate(taskId, { title }, { new: true });

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  task.lastEditedBy.unshift({ user: req.user._id, time: Date.now() });
  await task.save();

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
  if (board.createdBy.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Unauthorized to perform this action", 401));
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

//TODO: Get single and all Cards

exports.createCard = catchAsyncErrors(async (req, res, next) => {
  const { title } = req.body;
  const { taskId } = req.params;

  const task = await Task.findById(taskId);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }
  const card = await Card.create({ title, createdBy: req.user._id });

  task.cards.push(card._id);
  await task.save();

  res.status(200).json({ success: true, message: "Created", data: card });
});

exports.editCard = catchAsyncErrors(async (req, res, next) => {
  const { cardId, boardId } = req.params;

  if (!cardId || !boardId) {
    return next(new ErrorHandler("Parameters not Specified"));
  }

  const board = await Board.findById(boardId);

  if (!board) {
    return next(new ErrorHandler("Board not found", 404));
  }

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
  res.status(200).json({ success: true, message: "Updated", data: card });
});

exports.addMembersToCard = catchAsyncErrors(async (req, res, next) => {
  const { cardId, boardId } = req.params;
  if (!cardId || !boardId) {
    return next(new ErrorHandler("Parameters not Specified", 400));
  }

  const board = await Board.findById(boardId);

  if (!board) {
    return next(new ErrorHandler("Board not found", 404));
  }

  const card = await Card.findById(cardId);
  if (!card) {
    return next(new ErrorHandler("Card does not exist", 404));
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

  for (let i = 0; i < selectedUsers.length; i++) {
    const selected = selectedUsers[i];

    const exist = card.members.find(
      (e) => e._id.toString() === selected._id.toString()
    );

    if (exist) {
      return next(
        new ErrorHandler(`User ${selected} already exists in card`, 400)
      );
    }
  }

  card.members.push(...selectedUsers);
  await card.save();
  for (let i = 0; i < selectedUsers.length; i++) {
    const user = await User.findById(selectedUsers[i]);
    await sendEmail({
      email: `${user.username} <${user.email}>`,
      subject: "Assigned to Card",
      html: `Dear <b>${user.lastName} ${user.firstName}</b>, \n\n\n\n You've been assigned to <b>Card</b> Task Board`,
    });
  }
  res.status(200).json({ success: true, message: "User(s) added to card" });
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

  for (let i = 0; i < memberExists.length; i++) {
    const user = await User.findById(memberExists[i]);
    await sendEmail({
      email: `${user.username} <${user.email}>`,
      subject: "Unassigned from Card",
      html: `Dear <b>${user.lastName} ${user.firstName}</b>, \n\n\n\n You've been unassigned from <b>Card</b> Task Board`,
    });
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
    lastEditedBy: [
      {
        user: req.user._id,
        time: Date.now(),
        comment: "Created This Task",
      },
    ],
  });
  checklist.lastEditedBy.unshift({
    user: req.user._id,
    time: Date.now(),
    comment: `Created Task: ${title}`,
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

  const userExist = checklist.content[contentIndex].addMembers.find(
    (user) => user._id.toString() === req.user._id.toString()
  );

  if (!userExist || card.createdBy._id.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Unauthorized", 401));
  }

  const { title, isCompleted, startDate, dueDate } = req.body;

  checklist.content[contentIndex].title =
    title || checklist.content[contentIndex].title;
  checklist.content[contentIndex].isCompleted =
    isCompleted || checklist.content[contentIndex].isCompleted;
  checklist.content[contentIndex].startDate =
    startDate || checklist.content[contentIndex].startDate;
  checklist.content[contentIndex].dueDate =
    dueDate || checklist.content[contentIndex].dueDate;

  checklist.content[contentIndex].lastEditedBy.unshift({
    user: req.user._id,
    time: Date.now(),
    comment: "Edited the Content",
  });
  checklist.lastEditedBy.unshift({
    user: req.user._id,
    time: Date.now(),
    comment: `Edited Task: ${checklist.content[contentIndex].title}`,
  });
  await checklist.save();

  res.status(200).json({
    success: true,
    message: "Checklist content updated successfully",
  });
});

exports.addMembersToContent = catchAsyncErrors(async (req, res, next) => {
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

  if (card.createdBy._id.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Unauthorized", 401));
  }

  const { users } = req.body;

  const selectedUsers = [];

  if (users) {
    const members = JSON.parse(users);

    for (let i = 0; i < members.length; i++) {
      const member = members[i];

      const memberExists = checklist.content[contentIndex].addMembers.find(
        (user) => user._id.toString() === member
      );

      if (memberExists) {
        return next(
          new ErrorHandler(`User ${member} already exists in the content`, 400)
        );
      }

      const cardMember = card.members.find(
        (user) => user._id.toString() === member
      );

      if (cardMember) {
        selectedUsers.push(cardMember);
      } else {
        return next(
          new ErrorHandler(`User ${member} is not a member of the card`, 400)
        );
      }
    }
  }

  checklist.content[contentIndex].addMembers = [
    ...checklist.content[contentIndex].addMembers,
    ...selectedUsers,
  ];
  checklist.content[contentIndex].lastEditedBy.unshift({
    user: req.user._id,
    time: Date.now(),
    comment: "Added Member",
  });
  checklist.lastEditedBy.unshift({
    user: req.user._id,
    time: Date.now(),
    comment: `Added Member to Task: ${checklist.content[contentIndex].title}`,
  });

  await checklist.save();

  res.status(200).json({
    success: true,
    message: "Member(s) added successfully",
  });
});

exports.removeMemberFromContent = catchAsyncErrors(async (req, res, next) => {
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

  const { users } = req.body;
  const members = JSON.parse(users);

  if (card.createdBy._id.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Unauthorized", 401));
  }

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const memberExists = checklist.content[contentIndex].addMembers.find(
      (user) => user._id.toString() === member
    );

    if (!memberExists) {
      return next(new ErrorHandler(`User ${member} not found`, 404));
    }

    checklist.content[contentIndex].addMembers.splice(
      checklist.content[contentIndex].addMembers.indexOf(memberExists),
      1
    );
    checklist.content[contentIndex].lastEditedBy.unshift({
      user: req.user._id,
      time: Date.now(),
      comment: "Removed Member",
    });
    checklist.lastEditedBy.unshift({
      user: req.user._id,
      time: Date.now(),
      comment: `Removed Member from Task: ${checklist.content[contentIndex].title}`,
    });
  }

  await checklist.save();
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
    if (
      userExist ||
      card.createdBy._id.toString() === req.user._id.toString()
    ) {
      checklist.content[contentIndex].isCompleted = complete;
      checklist.content[contentIndex].lastEditedBy.unshift({
        user: req.user._id,
        time: Date.now(),
        comment: "Updated Task Completion",
      });
      checklist.lastEditedBy.unshift({
        user: req.user._id,
        time: Date.now(),
        comment: `Updated Task: ${checklist.content[contentIndex].title}, Completion`,
      });
      await checklist.save();
      await updateTotalCompleted(checklistId);

      return res.status(200).json({ success: true });
    }
    return next(new ErrorHandler("Unauthorized"));
  }
  return next(new ErrorHandler("Unauthorized"));
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
      await checklist.save();
      await updateTotalCompleted(checklistId);

      return res.status(200).json({ success: true });
    } else {
      return next(new ErrorHandler("Unauthorized", 401));
    }
  } else if (card.createdBy._id.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Unauthorized", 401));
  } else {
    checklist.content.splice(contentIndex, 1);
    checklist.content[contentIndex].lastEditedBy.unshift({
      user: req.user._id,
      time: Date.now(),
      comment: "Delete a Task",
    });
    checklist.lastEditedBy.unshift({
      user: req.user._id,
      time: Date.now(),
      comment: `Deleted a Task: ${checklist.content[contentIndex].title}, Completion`,
    });
    await checklist.save();
    await updateTotalCompleted(checklistId);
    res.status(200).json({ success: true });
  }
});

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
