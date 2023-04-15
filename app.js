/*
 ** App.js
 ** Created By Adeleke Joshua
 ** 2/2023
 */

const express = require("express");
const app = express();
const errorMiddleware = require("./middlewares/error");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bodyParser = require("body-parser");
const checkDue = require("./middlewares/serviceWorker");
const cors = require("cors");
const credentials = require("./middlewares/credentials");
const corsOptions = require("./config/corsOptions");

app.use(
  session({
    secret: "egeGBTCTEcgwrtgc54cg66666666h.b/3/3.b/[g[er2",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      maxAge: 1000 + 60 * 60 * 24 * 7,
      sameSite: "strict",
    },
  })
);
// const io = require('socket.io')(server,{
//     cors: {
//         origin: '*'
//     }
// });

// io.on("Connection",(socket) => console.log("connected"))
app.use(credentials);
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
// setInterval(checkDue, 60 * 1000);
setInterval(checkDue, 60 * 1000);

const user = require("./routes/userRoute");
const chat = require("./routes/chatRoute");
const message = require("./routes/messageRoute.js");
const task = require("./routes/taskRoute");

//Route
app.use("/api/v1/user", user);
app.use("/api/v1/chat", chat);
app.use("/api/v1/message", message);
app.use("/api/v1/task", task);

app.use(errorMiddleware);

module.exports = app;
