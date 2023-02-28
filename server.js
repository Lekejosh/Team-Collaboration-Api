const app = require('./app')
const mongoose = require('mongoose')
require("dotenv").config();

mongoose
  .connect(`${process.env.DB_URI}/${process.env.DB_NAME}`)
  .then(() =>
    app.listen(process.env.PORT, () => {
      console.log(`Server is working on http://localhost:${process.env.PORT}`);
    })
  )
  .catch((err) => {
    console.error(err);
  });