const Staff = require("../models/staff.model");
const staffService = require("../services/staff.service");
const Store = require("../models/store.model");

const sendMobileOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const response = await staffService.sendMobileOtp(phone);

    res.status(200).json({ success: true, response });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

const verifyMobileOtp = async (req, res) => {
  try {
    const { otp, userId } = req.body;
    if (!otp || !userId) {
      return res.status(400).send({
        success: false,
        message: "OTP and userId are required",
      });
    }

    const response = await staffService.verifyMobileOtp(otp, userId);
    res.status(200).send(response);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// Create Staff
const createStaff = async (req, res) => {
  try {
    const existingStaff = await Staff.findOne({ phone: req.body.phone });
    if (existingStaff) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number already exists" });
    }

    const staff = new Staff({ ...req.body, createdBy: req.userId });
    await staff.save();
    res.status(201).json({ success: true, staff });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All Staff whose createdBy = req.userId
const getStaff = async (req, res) => {
  try {
    const staff = await Staff.find({ createdBy: req.userId });
    res.status(200).json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getActiveStaff = async (req, res) => {
  try {
    const activeStaff = await Staff.find({
      createdBy: req.userId,
      $or: [
        { isActive: true },
        { isActive: { $exists: false } },
        { isActive: null },
      ],
    });

    res.status(200).json({ success: true, staff: activeStaff });
  } catch (error) {
    console.error("Error fetching active staff:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get Staff by ID
const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });
    }
    res.status(200).json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStaff = async (req, res) => {
  try {
    const staffId = req.params.id;
    const { phone } = req.body;

    // Find the staff member being updated
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });
    }

    // Check if the phone number exists for a different staff member
    const existingStaff = await Staff.findOne({ phone });
    if (existingStaff && existingStaff._id.toString() !== staffId) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number already exists" });
    }

    // Update the staff member
    const updatedStaff = await Staff.findByIdAndUpdate(staffId, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, staff: updatedStaff });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete Staff
const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Staff deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfileImage = async (req, res) => {
  try {
    const userId = req.userId; // Get userId from middleware
    const { profileImage } = req.body; // URL of the uploaded image

    if (!profileImage) {
      return res.status(400).json({
        success: false,
        message: "Profile image URL is required",
      });
    }

    const user = await Staff.findByIdAndUpdate(
      userId,
      { profileImage },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating profile image:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getStaffByStoreId = async (req, res) => {
  try {
    const { storeId } = req.params;

    // Find the store by storeId
    const store = await Store.findById(storeId);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Store not found" });
    }

    // Extract userId from store
    const userId = store.userId;

    // Find all staff members associated with the given storeId
    const staff = await Staff.find({
      createdBy: userId,
      $or: [
        { isActive: true },
        { isActive: { $exists: false } },
        { isActive: null },
      ],
    });

    if (!staff.length) {
      return res
        .status(404)
        .json({ success: false, message: "No staff found for this store" });
    }

    res.status(200).json({ success: true, staff });
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateIsActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    const staff = await Staff.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Staff isActive status updated to ${isActive}`,
      staff,
    });
  } catch (error) {
    console.error("Error updating isActive:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  sendMobileOtp,
  verifyMobileOtp,
  updateProfileImage,
  getStaffByStoreId,
  updateIsActiveStatus,
  getActiveStaff,
};
