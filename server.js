/*
 ** Chat App Backend
 ** Server.js
 ** Created By Adeleke Joshua
 ** 2/2023
 */

const app = require("./app");
const mongoose = require("mongoose");
require("colors");
const cloudinary = require("cloudinary");
require("dotenv").config();

process.on("uncaughtException", (err) => {
  console.log(`Error: ${err}: ${err.message}`);
  console.log(`Shutting down the server due to uncaught Exception`);
  process.exit(1);
});
mongoose.set("strictQuery", true);

const isDocker = process.env.DOCKER === "true";

// MongoDB connection URL
const mongoURL = isDocker
  ? `${process.env.DB_URI}/${process.env.DB_NAME}`
  : `${process.env.DB_URI_1}/${process.env.DB_NAME}`;

mongoose.connect(mongoURL).catch((err) => {
  console.error(err);
});

const server = app.listen(process.env.PORT, () => {
  console.log(
    `Server is working on http://localhost:${process.env.PORT}`.cyan.underline
  );
});

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "https://team-collaboration.onrender.com",
  },
});

io.on("connection", (socket) => {
  console.log("Connected to Socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room" + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("Chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.on("new board", (newBoardDetails) => {
    var chat = newBoardDetails;
    socket.in(chat.group).emit('new board created')

  });
    socket.on("new task", (newTaskDetails) => {
      var task = newTaskDetails;
      socket.in(task.board).emit("new task created");
    });
     socket.on("new card", (newCardDetails) => {
       var card = newCardDetails;
       socket.in(card.taskId).emit("new card created");
     });

  socket.on("disconnect", () => {
    console.log("User Disconnected");
    socket.leaveAll();
  });
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err}: ${err.message}`.red.bold);
  console.log(
    `Shutting down the server due to unhandled promise Rejection`.red.bold
  );

  server.close(() => {
    process.exit(1);
  });
});
