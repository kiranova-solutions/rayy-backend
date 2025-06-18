const express = require("express");
const router = express.Router();
const {
  createStaffSchedule,
  getStaffSchedules,
  getStaffScheduleById,
  updateStaffSchedule,
  deleteStaffSchedule,
} = require("../controllers/staff.schedule.controller");
const authMiddleware = require("../middlewares/authMiddleware");

// Create Staff Schedule
router.post("/", authMiddleware, createStaffSchedule);

// Get All Staff Schedules
router.get("/", authMiddleware, getStaffSchedules);

// Get Staff Schedule by ID
router.get("/:id", authMiddleware, getStaffScheduleById);

// Update Staff Schedule
router.put("/:id", authMiddleware, updateStaffSchedule);

// Delete Staff Schedule
router.delete("/:id", authMiddleware, deleteStaffSchedule);

module.exports = router;
