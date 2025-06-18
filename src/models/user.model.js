const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    type: {
      type: String,
      enum: ["Vendor", "Owner", "Client"],
      required: true,
    },
    email: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    companyName: {
      type: String,
    },
    fullName: {
      type: String,
    },
    phone: {
      type: String,
    },
    countryCode: {
      type: String,
    },
    noOfStaff: {
      type: Number,
    },
    location: {
      type: String,
    },
    categories: {
      type: [String],
    },
    servicingTo: {
      type: String,
    },
    gstNumber: {
      type: String,
    },
    gender: {
      // for client only
      type: String,
    },
    pronoun: {
      // for client only
      type: String,
    },
    age: {
      // for client only
      type: Number,
    },
    latitude: {
      type: String,
    },
    longitude: {
      type: String,
    },
    fcmToken: {
      type: String,
    },
    isZorainVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
