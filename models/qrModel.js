const mongoose = require("mongoose");
const { Schema } = mongoose;

const qrCodeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  connectedDeviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "connectedDevices",
  },
  lastUsedDate: { type: Date, default: null },
  isActive: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

module.exports = mongoose.model("qrCode", qrCodeSchema);
