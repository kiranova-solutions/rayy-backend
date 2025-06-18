const mongoose = require("mongoose");
const productSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    categoryName: {
      type: String,
      enum: [
        "Organic",
        "Sulfate-Free",
        "Paraben-Free",
        "Cruelty-Free",
        "Vegan",
      ],
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
