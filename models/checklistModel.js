const mongoose = require("mongoose");

const checklistSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  totalCompleted: {
    type: Number,
    default: 0,
  },
  totalTask: {
    type: Number,
    default: 0,
  },
  content: [
    {
      title: {
        type: String,
      },
      isCompleted: {
        type: Boolean,
        default: false,
      },
      addMembers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
        },
      ],
      startDate: {
        type: Date,
      },
      dueDate: {
        type: Date,
      },
      lastEditedBy: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          time: {
            type: Date,
          },
        },
      ],
    },
  ],
  lastEditedBy: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      time: {
        type: Date,
      },
    },
  ],
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Card",
  },
});

module.exports = mongoose.model("Checklist", checklistSchema);
