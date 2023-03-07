const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board",
  },
  assignedTo: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  title: {
    type: Date,
  },
 card:[{
    type: mongoose.Schema.Types.ObjectId,
    ref:'Card'
 }]
});

module.exports = mongoose.model("Task",taskSchema)