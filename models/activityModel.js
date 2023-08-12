const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    activites: {
      description: {
        type: String,
      },

      date: {
        type: Date,
        default: Date.now(),
      },
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);
