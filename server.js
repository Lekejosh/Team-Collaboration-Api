const app = require("./app");
const mongoose = require("mongoose");
const colors = require("colors");
require("dotenv").config();

process.on("uncaughtException", (err) => {
  console.log(`Error: $err: ${err.message}`);
  console.log(`Shutting down the server due to uncaught Expectation`);
  process.exit(1);
});
mongoose.set("strictQuery", true);
mongoose
  .connect(`${process.env.DB_URI}/${process.env.DB_NAME}`)
  .then(() =>
    app.listen(process.env.PORT, () => {
      console.log(`Server is working on http://localhost:${process.env.PORT}`.cyan.underline);
    })
  )
  .catch((err) => {
    console.error(err);
  });
mongoose.set("strictQuery", true);

process.on("unhandledRejection", (err) => {
  console.log(`Error: $err: ${err.message}`.red.bold);
  console.log(`Shutting down the server due to unhandled promise Rejection`.red.bold);

  server.close(() => {
    process.exit(1);
  });
});
