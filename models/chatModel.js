const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    chatName: {
      type: String,
      trim: true,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    groupAvatar: {
      public_id: {
        type: String,
        default: "default_image",
      },
      url: {
        type: String,
        default:
          "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
      },
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    workspace: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Board",
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    groupAdmin: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    superAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    activites: [
      {
        message: { type: String },
        date: { type: Date },
      },
    ],
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Chat", chatSchema);
