const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const vendorScheduleSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    vendorId: {
      type: String,
      required: true,
      ref: "Vendor",
    },
    appointmentId: {
      type: String,
    },
    createdBy: {
      type: String,
      required: true,
    },
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Blocked", "Appointment"],
      required: true,
    },
    reason: {
      type: String,
      required: false,
    },
    isCancelled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VendorSchedule", vendorScheduleSchema);
