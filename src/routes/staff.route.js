const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/staff.controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/sendOTP", sendMobileOtp);
router.post("/verifyOTP", verifyMobileOtp);
router.put("/profileImage", authMiddleware, updateProfileImage);
router.get("/store/:storeId", authMiddleware, getStaffByStoreId);

// Create Staff
router.post("/", authMiddleware, createStaff);

// Get All Staff
router.get("/", authMiddleware, getStaff);
router.get("/active/list", authMiddleware, getActiveStaff);

// Get Staff by ID
router.get("/:id", authMiddleware, getStaffById);

// Update isActive status
router.patch("/:id/change-status", authMiddleware, updateIsActiveStatus);

// Update Staff
router.put("/:id", authMiddleware, updateStaff);

// Delete Staff
router.delete("/:id", authMiddleware, deleteStaff);

module.exports = router;
