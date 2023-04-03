const express = require("express");
const app = express();
const errorMiddleware = require("./middlewares/error");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require('cors')
const checkDue = require('./middlewares/serviceWorker')
// const io = require('socket.io')(server,{
//     cors: {
//         origin: '*'
//     }
// });

// io.on("Connection",(socket) => console.log("connected"))
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
// setInterval(checkDue, 60 * 1000);
setInterval(checkDue, 60 * 1000);

const user = require('./routes/userRoute')
const chat = require('./routes/chatRoute')
const message = require("./routes/messageRoute.js");
const task = require('./routes/taskRoute')

//Route
app.use("/api/v1/user", user)
app.use('/api/v1/chat', chat)
app.use("/api/v1/message", message);
app.use("/api/v1/task", task);

const sessionConfig = {
  secret: "egeGBTCTEcgwrtgc54cg66666666h.b/3/3.b/[g[er2",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 + 60 * 60 * 24 * 7,
    maxAge: 1000 + 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));

app.use(errorMiddleware);

module.exports = app;
