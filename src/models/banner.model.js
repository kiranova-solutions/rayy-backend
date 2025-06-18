const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const bannerSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    bannerId: {
      type: Number,
      required: true,
      unique: true,
    },
    s3ImageUrl: {
      type: String,
      required: true,
    },
    redirectLink: {
      type: String,
      required: true,
    },
    bannerType: {
      type: String,
      enum: ["video", "image"],
      required: true,
    },
  },
  { timestamps: true }
);

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Banner;
