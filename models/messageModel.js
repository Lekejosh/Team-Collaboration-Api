const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    audio: {
      public_id: {
        type: String,
      },
      url: { type: String },
    },
    image: {
      public_id: {
        type: String,
      },
      url: { type: String },
    },
    video: {
      public_id: {
        type: String,
      },
      url: { type: String },
    },
    document: {
      public_id: {
        type: String,
      },
      url: { type: String },
    },
    content: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
    },
    isDeletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Message", messageSchema);
