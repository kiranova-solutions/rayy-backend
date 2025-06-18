const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const appointmentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: Number,
      unique: true,
    },
    _id: {
      type: String,
      default: uuidv4,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    appointmentStartTime: {
      type: String,
      required: true,
    },
    appointmentEndTime: {
      type: String,
    },
    clientName: {
      type: String,
    },
    clientPhone: {
      type: String,
    },
    clientEmail: {
      type: String,
    },
    clientId: {
      type: String,
    },
    vendorId: {
      type: String,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    staff: {
      type: String,
      // required: true,
      default: null,
    },
    createdBy: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Created", "Confirmed", "Cancelled", "Completed"],
      default: "Created",
    },
    confirmedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
    cancellationDescription: {
      type: String,
    },
    productId: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    userType: {
      type: String,
      enum: ["Vendor", "Client"],
      default: "Vendor",
    },
    clubTogetherWith: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
  },
  { timestamps: true }
);

// Apply auto-increment plugin
appointmentSchema.plugin(AutoIncrement, { inc_field: "bookingId" });

module.exports = mongoose.model("Appointment", appointmentSchema);
