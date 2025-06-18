const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const daySchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
  },
  isOpen: {
    type: Boolean,
    required: true,
  },
});

const storeSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: "User",
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    companyLogo: {
      type: String,
      required: true,
    },
    storeImage: {
      type: [imageSchema],
      //   required: true,
    },
    storeLocation: {
      type: String,
      required: true,
    },
    storeCategory: {
      type: [String],
      required: true,
    },
    storeOpenDays: {
      type: [String],
      required: true,
    },
    storeSlots: {
      type: [String],
      required: true,
    },
    storeOpenTime: {
      type: String,
      required: true,
    },
    storeCloseTime: {
      type: String,
      required: true,
    },
    latitude: {
      type: String,
      required: true,
    },
    longitude: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      default: null,
      min: 0,
      max: 5,
    },
    isZorainVerified:{
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

// Export the model instead of the schema
module.exports = mongoose.model("Store", storeSchema);
