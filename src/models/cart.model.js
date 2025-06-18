const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const cartSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    userId: {
      type: String,
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    appointmentDate: {
      type: String,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },
    productId: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    staffId: {
      type: String,
      // required: true,
      default: null,
    },
    clubTogetherWith: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
