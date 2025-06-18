const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    relationId: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Image", imageSchema);
