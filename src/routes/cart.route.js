const express = require("express");
const router = express.Router();
const {
  createCart,
  getAllCarts,
  getCartById,
  updateCart,
  deleteCart,
  getCartByUserId,
} = require("../controllers/cart.controller");
const authMiddleware = require("../middlewares/authMiddleware");

// Create a cart
router.post("/", authMiddleware, createCart);

// Get all carts for logged-in user
router.get("/", authMiddleware, getAllCarts);
router.get("/byUser", authMiddleware, getCartByUserId);

// Get a specific cart by ID (only if it belongs to the logged-in user)
router.get("/:id", authMiddleware, getCartById);

// Update a cart (only if it belongs to the logged-in user)
router.put("/:id", authMiddleware, updateCart);

// Delete a cart (only if it belongs to the logged-in user)
router.delete("/:id", authMiddleware, deleteCart);

module.exports = router;
