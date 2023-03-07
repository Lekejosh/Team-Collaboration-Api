const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema(
  {
    type: {
      type: String,
    },
    imageBackground: {
      type: String,
      default: "White",
    },
    task: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: task,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    collection: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Board",boardSchema)