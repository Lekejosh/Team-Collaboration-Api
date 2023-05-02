const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const Message = require("../models/messageModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
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
      var newMessage = {
        sender: req.user._id,
        content: {
          message: `Chat is Encrypted`,
          type: "Group Activity",
        },
        chat: createdChat._id,
      };

      try {
        var message = await Message.create(newMessage);
        message = await message.populate("sender", "username avatar");
        message = await message.populate("chat");
        message = await User.populate(message, {
          path: "chat.users",
          select: "username avatar email",
        });
        await Chat.findByIdAndUpdate(createdChat._id, {
          latestMessage: message,
        });

        res.status(200).json({ success: true, message });
      } catch (error) {}
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
      superAdmin: req.user,
    });
   await Chat.findOne({ _id: groupChat.id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    var newMessage = {
      sender: req.user._id,
      content: {
        message: `Chat is Encrypted`,
        type: "Group Activity",
      },
      chat: groupChat._id,
    };

    try {
      var message = await Message.create(newMessage);
      message = await message.populate("sender", "username avatar");
      message = await message.populate("chat");
      message = await User.populate(message, {
        path: "chat.users",
        select: "username avatar email",
      });

      await Chat.findByIdAndUpdate(
        req.body.groupChat._id,
        {
          latestMessage: message,
        },
        { new: true }
      );

      res.status(200).json({ success: true, message: "Created", message });
    } catch (error) {}
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

  const checkExistingUser = chat.users.find(
    (user) => user.toString() === req.user._id.toString()
  );

  if (!checkExistingUser) {
    return next(new ErrorHandler("Not a group Admin", 401));
  }

  const checkExistingAdmin = chat.groupAdmin.find(
    (user) => user.toString() === req.user._id.toString()
  );

  if (!checkExistingAdmin)
    return next(new ErrorHandler("Specified user is not an Admin"));

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
  const checkExistingAdmin = chat.groupAdmin.find(
    (user) => user.toString() === req.user._id.toString()
  );

  if (!checkExistingAdmin)
    return next(new ErrorHandler("Specified user is not an Admin"));

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

exports.makeGroupAdmin = catchAsyncErrors(async (req, res, next) => {
  const { chatId, userId } = req.params;

  if (!chatId || !userId)
    return next(new ErrorHandler("Required Body not provided", 400));

  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ErrorHandler("Chat Not Found", 404));

  if (!chat.superAdmin.toString() === req.user._id.toString())
    return next(new ErrorHandler("Cannot Make this request", 401));

  const checkExistingUser = chat.users.find(
    (user) => user.toString() === userId.toString()
  );

  if (!checkExistingUser)
    return next(new ErrorHandler("User not found in this group", 404));

  chat.groupAdmin.push(userId);
  await chat.save();

  res.status(200).json({ success: true, message: "Successull made an admin" });
});

exports.removeGroupAdmin = catchAsyncErrors(async (req, res, next) => {
  const { chatId, userId } = req.params;

  if (!chatId || !userId)
    return next(new ErrorHandler("Required Body not provided", 400));

  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ErrorHandler("Chat Not Found", 404));

  if (!chat.superAdmin.toString() === req.user._id.toString())
    return next(new ErrorHandler("Cannot Make this request", 401));

  const checkExistingUser = chat.users.find(
    (user) => user.toString() === userId.toString()
  );

  if (!checkExistingUser)
    return next(new ErrorHandler("User not found in this group", 404));

  const checkExistingAdmin = chat.groupAdmin.find(
    (user) => user.toString() === userId.toString()
  );

  if (!checkExistingAdmin)
    return next(new ErrorHandler("Specified user is not an Admin"));

  await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { groupAdmin: userId },
    },
    { new: true }
  );
  res
    .status(200)
    .json({ success: true, message: "User Successully Removed as an admin" });
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
  const checkExistingAdmin = chat.groupAdmin.find(
    (user) => user.toString() === req.user._id.toString()
  );

  if (!checkExistingAdmin)
    return next(new ErrorHandler("User is not an Admin"));
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
  const checkExistingAdmin = chat.groupAdmin.find(
    (user) => user.toString() === req.user._id.toString()
  );

  if (!checkExistingAdmin)
    return next(new ErrorHandler("User is not an Admin"));

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

  const checkExistingAdmin = chat.groupAdmin.find(
    (user) => user.toString() === req.user._id.toString()
  );

  if (!checkExistingAdmin)
    return next(new ErrorHandler("User is not an Admin"));
  // Check if user is not in the group
  const existingUser = chat.users.find(
    (user) => user.toString() === userId.toString()
  );
  if (!existingUser) {
    return next(new ErrorHandler("User is not in the group", 400));
  }
  await Chat.findByIdAndUpdate(
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
      message: `${req.user.username} left the Group`,
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
