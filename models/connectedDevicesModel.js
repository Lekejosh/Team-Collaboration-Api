const mongoose = require("mongoose");
const { Schema } = mongoose;

const connectedDeviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  qrCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "qrCode",
  },
  deviceName: { type: String, default: null },
  deviceModel: { type: String, default: null },
  deviceOS: { type: String, default: null },
  deviceVersion: { type: String, default: null },
  disabled: { type: Boolean, default: false },
});

module.exports = mongoose.model("connectedDevice", connectedDeviceSchema);
