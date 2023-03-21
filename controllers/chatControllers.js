const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");

exports.accessChat = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.body;
  if (!userId) {
    return next(new ErrorHandler("UserId not send", 400));
  }
  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name avatar email",
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };
    try {
      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).send(fullChat);
    } catch (error) {}
  }
});

exports.fetchChats = catchAsyncErrors(async (req, res, next) => {
  try {
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name avatar email",
        });
        res.status(200).send({success:true,data:results});
      });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

exports.createGroupChat = catchAsyncErrors(async (req, res, next) => {
  if (!req.body.users || !req.body.name) {
    return next(new ErrorHandler("Please Fill out the fields", 400));
  }
  var users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return next(
      new ErrorHandler(
        "More than 2 users is required to form a group chat",
        400
      )
    );
  }

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });
    const fullGroupChat = await Chat.findOne({ _id: groupChat.id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json({success:true,message:"Created",data:fullGroupChat});
  } catch (error) {
    return next(new ErrorHandler("Unable to creat Group chat", 400));
  }
});

exports.renameGroup = catchAsyncErrors(async (req, res, next) => {
  const { chatId, chatName } = req.body;

  const updateChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updateChat) {
    return next(new ErrorHandler("Chat Not Found",404));
  }
  res.status(200).json({success: true,message:"Updated"});
});

exports.addToGroup = catchAsyncErrors(async (req, res, next) => {
  const { chatId } = req.body;
  const users = JSON.parse(req.body.users);

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return next(new ErrorHandler("Chat Not Found"));
  }

  // Check if user already exists in the group
  const existingUser = chat.users.find(
    (userId) => userId.toString() === users.toString()
  );
  if (existingUser) {
    return next(new ErrorHandler("User Already in group", 400));
  }

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: users },
    },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.status(200).json({success:true,message:"User(s) added successfully"});
});


exports.removeFromGroup = catchAsyncErrors(async (req, res, next) => {
  const { chatId, userId } = req.body;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return next(new ErrorHandler("Chat Not Found"));
  }

  // Check if user is not in the group
  const existingUser = chat.users.find(
    (user) => user.toString() === userId.toString()
  );
  if (!existingUser) {
    return next(new ErrorHandler("User is not in the group", 400));
  }

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.status(200).json({succes:true, message:"User(s) removed successfully"});
});
