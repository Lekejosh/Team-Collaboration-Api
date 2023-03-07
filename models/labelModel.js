const mongoose = require("mongoose");

const labelSchema = new mongoose.Schema({
  color: {
    type: String,
  },
  title: {
    type: String,
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board",
  },
});

module.exports = mongoose.model("Label", labelSchema);
