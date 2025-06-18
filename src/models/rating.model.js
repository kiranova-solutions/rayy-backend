const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const ratingSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    clientId: {
      type: String,
      required: true,
      ref: "User", // Reference to Client (User model)
    },
    vendorId: {
      type: String,
      required: true,
      ref: "User", // Reference to Vendor (User model)
    },
    staffId: {
      type: String,
      required: true,
      ref: "Staff", // Reference to Vendor (User model)
    },
    appointmentId: {
      type: String,
      required: true,
      ref: "Appointment", // Reference to Appointment model
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Store", // Reference to Store model
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Service", // Reference to Service model
    },
    serviceRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    productRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    staffRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    ambienceRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    images: {
      type: [String], // Array of image URLs
      default: [],
    },
    comments: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rating", ratingSchema);
