const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    passwords: {
      type: String,
      required: true,
    },
    avatar: {
      public_id: { type: String },
      url: { type: String },
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("User", userSchema);
