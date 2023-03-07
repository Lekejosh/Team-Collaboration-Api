const mongoose = require("mongoose");

const checklistSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  startDate: {
    type: Date,
  },
  dueDate: {
    type: Date,
  },
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Card",
  },
});

module.exports = mongoose.model("Checklist", checklistSchema);
