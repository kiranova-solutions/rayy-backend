const express = require("express");
const router = express.Router();
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  changeStaff,
  cancelAppointment,
  confirmAppointment,
  completeAppointment,
  getAppointmentsForStaff,
  processCartToAppointment,
  getAppointmentsForBigCalendar,
  getAppointmentsByStaffId,
  changeSlot,
  getLatestCompletedAppointment
} = require("../controllers/appointment.controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/forStaff", authMiddleware, getAppointmentsForStaff);
router.post("/byClient", authMiddleware, processCartToAppointment);
router.get("/forCalendar", authMiddleware, getAppointmentsForBigCalendar);

// Change Staff
router.put("/updateStaff", authMiddleware, changeStaff);
router.put("/updateSlot", authMiddleware, changeSlot);

// Cancel Appointment
router.put("/cancelAppointment", authMiddleware, cancelAppointment);

// Confirm Appointment
router.put("/confirmAppointment/:id", authMiddleware, confirmAppointment);

// Complete Appointment
router.put("/completeAppointment/:id", authMiddleware, completeAppointment);

// Create Appointment
router.post("/", authMiddleware, createAppointment);

// Get All Appointments for the logged-in user
router.get("/", authMiddleware, getAppointments);

// Get Appointment by ID
router.get("/:id", authMiddleware, getAppointmentById);

// Update Appointment
router.put("/:id", authMiddleware, updateAppointment);

// Delete Appointment
router.delete("/:id", authMiddleware, deleteAppointment);

router.get('/get-latest-appointment/completed', authMiddleware, getLatestCompletedAppointment);

module.exports = router;
