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
// const { useTreblle } = require("treblle");

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

app.use(credentials);
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
// useTreblle(app, {
//   apiKey: process.env.TREBBLE_API_KEY,
//   projectId: process.env.TREBBLE_PROJECTID,
// });
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
setInterval(checkDue, 60 * 1000);

const user = require("./routes/userRoute");
const chat = require("./routes/chatRoute");
const message = require("./routes/messageRoute.js");
const task = require("./routes/taskRoute");
const activity = require("./routes/activityRoute");

app.get("/", (req, res) => {
  res.status(200).json({
    status: true,
    message: "You probably shouldn't be here, but...",
    data: {
      service: "teamit-api",
      version: "1.0",
    },
  });
});

//Route
app.use("/api/v1/user", user);
app.use("/api/v1/chat", chat);
app.use("/api/v1/message", message);
app.use("/api/v1/task", task);
app.use("/api/v1/activity", activity);

app.use(errorMiddleware);

module.exports = app;
