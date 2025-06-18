const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const staffSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
    },
    createdBy: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    fcmToken: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);
