const ServiceProduct = require("../models/serviceProduct.model");

const createProduct = async (req, res) => {
  try {
    const { categoryName, productName } = req.body;
    const userId = req.userId;
    const product = new ServiceProduct({
      userId,
      categoryName,
      productName,
    });
    await product.save();
    res.status(201).json({ product });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllProducts = async (req, res) => {
  console.log("getAllProducts");
  try {
    const userId = req.userId;
    console.log("userId", userId);
    const products = await ServiceProduct.find({ userId });

    const productCategory = [
      "Organic",
      "Sulfate-Free",
      "Paraben-Free",
      "Cruelty-Free",
      "Vegan",
    ];

    const data = productCategory.map((category) => {
      return {
        category,
        products: products.filter(
          (product) => product.categoryName === category
        ),
      };
    });
    res.status(200).json({ data: data, userId });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
};
