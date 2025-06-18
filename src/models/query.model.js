const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const querySchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    reason: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: {
      type: [String], // Array of image URLs
      default: [],
    },
    userId: {
      type: String,
      required: true,
      ref: "User", // Reference to User model
    },
    userType: {
      type: String,
      enum: ["Vendor", "Owner", "Staff", "Client"], // Ensure userType matches User model type
      required: true,
    },
    isResolved: {
      type: Boolean,
      default: false, // Default value set to false
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Query", querySchema);
