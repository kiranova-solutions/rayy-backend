const express = require("express");
const router = express.Router();
const {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
} = require("../controllers/banner.controller");

// const authMiddleware = require("../middlewares/authMiddleware");

// Create a new banner
router.post("/", createBanner);

// Get all banners
router.get("/", getAllBanners);

// Get a single banner by ID
router.get("/:id", getBannerById);

// Update a banner by ID
router.put("/:id", updateBanner);

// Delete a banner by ID
router.delete("/:id", deleteBanner);

module.exports = router;
