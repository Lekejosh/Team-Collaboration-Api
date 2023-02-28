const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
  
}
);
module.exports = mongoose.model("Chat", chatSchema);
