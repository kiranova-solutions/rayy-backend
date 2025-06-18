const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    otp: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["Vendor", "Staff", "Owner", "Client"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Export the model instead of the schema
const Otp = mongoose.model("Otp", otpSchema);
module.exports = Otp;
