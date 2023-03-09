const mongoose = require("mongoose");

const checklistSchema = new mongoose.Schema({
  title: {
    type: String,
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
      addMembers:[ {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      }],
      startDate: {
        type: Date,
      },
      dueDate: {
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
