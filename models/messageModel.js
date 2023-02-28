const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat"
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  message:{
    type:String
  }
});
module.exports = mongoose.model("Message", messageSchema);
