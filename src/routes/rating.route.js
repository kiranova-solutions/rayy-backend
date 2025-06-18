const express = require("express");
const router = express.Router();
const {
  createRating,
  getRatings,
  getRatingById,
  updateRating,
  deleteRating,
  getRatingsByVendorId,
  getAverageRatingByVendorId,
  getRatingsByStoreId,
} = require("../controllers/rating.controller");
const authMiddleware = require("../middlewares/authMiddleware");

// Create a new rating
router.post("/", authMiddleware, createRating);

// Get all ratings (with optional filters)
router.get("/", authMiddleware, getRatings);
router.get("/byVendor", authMiddleware, getRatingsByVendorId);
router.get("/byVendor/getAverage", authMiddleware, getAverageRatingByVendorId);
router.get("/byStore/:storeId", getRatingsByStoreId);

// Get a single rating by ID
router.get("/:id", authMiddleware, getRatingById);

// Update a rating by ID
router.put("/:id", authMiddleware, updateRating);

// Delete a rating by ID
router.delete("/:id", authMiddleware, deleteRating);

module.exports = router;
