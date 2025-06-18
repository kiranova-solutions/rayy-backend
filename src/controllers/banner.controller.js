const Banner = require("../models/banner.model");

// Create Banner
const createBanner = async (req, res) => {
  try {
    const { bannerId, s3ImageUrl, redirectLink } = req.body;

    // Check for existing bannerId
    const existingBanner = await Banner.findOne({ bannerId });
    if (existingBanner) {
      return res.status(400).json({
        success: false,
        message: "Banner with this bannerId already exists",
      });
    }

    const banner = new Banner({ bannerId, s3ImageUrl, redirectLink });
    await banner.save();

    res.status(201).json({ success: true, banner });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All Banners
const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find();
    res.status(200).json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Banner by ID
const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }
    res.status(200).json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Banner
const updateBanner = async (req, res) => {
  try {
    const { bannerId } = req.body;
    const id = req.params.id;

    // Ensure bannerId is not duplicated
    if (bannerId) {
      const existing = await Banner.findOne({ bannerId });
      if (existing && existing._id.toString() !== id) {
        return res
          .status(400)
          .json({ success: false, message: "BannerId already in use" });
      }
    }

    const updatedBanner = await Banner.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedBanner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    res.status(200).json({ success: true, banner: updatedBanner });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete Banner
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
};
