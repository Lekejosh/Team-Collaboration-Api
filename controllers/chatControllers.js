const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const Message = require("../models/messageModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const cloudinary = require("cloudinary");

exports.accessChat = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.body;
  if (!userId) {
    return next(new ErrorHandler("User Id not provided", 400));
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
        res.status(200).send({ success: true, data: results });
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

    res
      .status(200)
      .json({ success: true, message: "Created", data: fullGroupChat });
  } catch (error) {
    return next(new ErrorHandler("Unable to creat Group chat", 400));
  }
});

exports.changeGroupIcon = catchAsyncErrors(async (req, res, next) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return next(new ErrorHandler("Chat not found", 404));
  }

  if (chat.groupAvatar.public_id !== "default_image") {
    await cloudinary.v2.uploader.destroy(chat.groupAvatar.public_id);
  }

  const result = await cloudinary.v2.uploader.upload(req.file.path, {
    folder: "Chat_app_avatar",
    width: 150,
    crop: "scale",
  });

  chat.groupAvatar = {
    public_id: result.public_id,
    url: result.secure_url,
  };

  var newMessage = {
    sender: req.user._id,
    content: {
      message: `${req.user.username} change the Group Icon`,
      type: "Group Activity",
    },
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);
    message = await message.populate("sender", "username avatar");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "username avatar email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });
    await chat.save();
    res.status(200).json({ success: true, message });
  } catch (error) {
    return next(new ErrorHandler("Invalid Chat Id", 400));
  }
});
exports.removeGroupIcon = catchAsyncErrors(async (req, res, next) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return next(new ErrorHandler("Chat not found", 404));
  }

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  chat.groupAvatar = {
    public_id: "default_image",
    url: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
  };

  var newMessage = {
    sender: req.user._id,
    content: {
      message: `${req.user.username} Removed the Group Icon`,
      type: "Group Activity",
    },
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);
    message = await message.populate("sender", "username avatar");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "username avatar email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });
    await chat.save();
    res.status(200).json({ success: true, message });
  } catch (error) {
    return next(new ErrorHandler("Invalid Chat Id", 400));
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
    return next(new ErrorHandler("Chat Not Found", 404));
  }
  var newMessage = {
    sender: req.user._id,
    content: {
      message: `${req.user.username} Renamed the Group`,
      type: "Group Activity",
    },
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);
    message = await message.populate("sender", "username avatar");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "username avatar email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });
    await chat.save();
    res.status(200).json({ success: true, message });
  } catch (error) {
    return next(new ErrorHandler("Invalid Chat Id", 400));
  }
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

  await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: users },
    },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  var newMessage = {
    sender: req.user._id,
    content: {
      message: `${req.user.username} added Member(S) to the group`,
      type: "Group Activity",
    },
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);
    message = await message.populate("sender", "username avatar");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "username avatar email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });
    await chat.save();
    res.status(200).json({ success: true, message });
  } catch (error) {
    return next(new ErrorHandler("Invalid Chat Id", 400));
  }
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

  var newMessage = {
    sender: req.user._id,
    content: {
      message: `${req.user.username} removed Member(s) from the group`,
      type: "Group Activity",
    },
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);
    message = await message.populate("sender", "username avatar");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "username avatar email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });
    await chat.save();
    res.status(200).json({ success: true, message });
  } catch (error) {
    return next(new ErrorHandler("Invalid Chat Id", 400));
  }
});

exports.exitGroup = catchAsyncErrors(async (req, res, next) => {
  const { chatId } = req.body;
  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  const checkExistingUser = await chat.users.find(
    (user) => user._id.toString() === req.user._id.toString()
  );
  if (!checkExistingUser)
    return next(new ErrorHandler("User does not exist in group"));

  await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: req.user._id },
    },
    { new: true }
  );
  var newMessage = {
    sender: req.user._id,
    content: {
      message: `${req.user.username} left the group`,
      type: "Group Activity",
    },
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);
    message = await message.populate("sender", "username avatar");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "username avatar email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });
    await chat.save();
    res.status(200).json({ success: true, message });
  } catch (error) {
    return next(new ErrorHandler("Invalid Chat Id", 400));
  }
});
