const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Card",
  },
  attachment: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attachment",
    },
  ],
  content: {
    type: String,
    trim: true,
  },
});

module.exports = mongoose.model("Comment", commentSchema);
