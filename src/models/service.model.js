const mongoose = require("mongoose");

const genderSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      required: true,
    },
    isEnable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

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

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    productType: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const clubTogetherWithSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    serviceId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const serviceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    storeId: { type: String, ref: "Store", required: true }, // Add reference

    serviceType: {
      type: String,
      enum: [
        "Salon Services",
        "Beauty Shops",
        "Barber Shops",
        "Makeup Artists",
        "Wellness Centres",
        "Beauty Parlour",
      ],
      required: true,
    },
    subCategories: {
      type: [String],
      required: true,
    },
    images: {
      type: [imageSchema],
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    gender: {
      type: [genderSchema],
      required: true,
    },
    clubTogetherWith: {
      type: [String],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    product: {
      type: [productSchema],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Export the model instead of the schema
module.exports = mongoose.model("Service", serviceSchema);
