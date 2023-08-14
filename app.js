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
const treblle = require("@treblle/express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

app.enable("trust proxy");
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

app.use((req, res, next) => {
  // Content-Security-Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; base-uri 'self'; font-src 'self' https: data:; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self' https:; upgrade-insecure-requests"
  );

  // X-Frame-Options
  res.setHeader("X-Frame-Options", "DENY");

  // Referrer-Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // X-Content-Type-Options
  res.setHeader("X-Content-Type-Options", "nosniff");

  // X-XSS-Protection
  res.setHeader("X-XSS-Protection", "0");

  // Strict-Transport-Security
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=15552000; includeSubDomains"
  );

  res.setHeader("Content-Type", "application/json");

  // Access-Control-Allow-Origin
  // res.setHeader(
  //   "Access-Control-Allow-Origin",
  //   "https://master--magenta-shortbread-105779.netlify.app/"
  // );

  next();
});

app.use(credentials);
app.use(
  cors({
    origin: "https://team-collaboration.onrender.com",
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(
  treblle({
    apiKey: process.env.TREBBLE_API_KEY,
    projectId: process.env.TREBBLE_PROJECTID,
    additionalFieldsToMask: [],
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
const limiter = rateLimit({
  windowMs: 1 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
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
