const StaffSchedule = require("../models/staff.schedule.model");

// Create Staff Schedule
const createStaffSchedule = async (req, res) => {
  try {
    const { date, startTime, endTime, status, reason, staffId } = req.body;
    const createdBy = req.userId; // Assuming `req.userId` holds the user ID

    const startDateTime = new Date(`${date} ${startTime}`);
    const endDateTime = new Date(`${date} ${endTime}`);

    console.log("startDateTime: ", startDateTime);
    console.log("endDateTime: ", endDateTime);

    // Validate if startDateTime is greater than endDateTime
    if (startDateTime >= endDateTime) {
      return res.status(400).json({
        success: false,
        message: "Start time must be before end time.",
      });
    }

    // Check for existing schedule conflicts
    const existingSchedule = await StaffSchedule.findOne({
      staffId: staffId,
      isCancelled: false,
      $or: [
        {
          startDateTime: { $lt: endDateTime },
          endDateTime: { $gt: startDateTime },
        },
      ],
    });

    console.log("existingSchedule: ", existingSchedule);

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message:
          existingSchedule?.status == "Blocked"
            ? "The staff member is already blocked during this time."
            : "The staff member is already scheduled for an appointment during this time. Please cancel the active booking before blocking availability.",
      });
    }

    // Create a new staff schedule entry
    const staffSchedule = new StaffSchedule({
      staffId,
      createdBy,
      startDateTime,
      endDateTime,
      status,
      reason,
    });

    await staffSchedule.save();

    res.status(201).json({ success: true, data: staffSchedule });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All Staff Schedules created by the user
const getStaffSchedules = async (req, res) => {
  try {
    const staffSchedules = await StaffSchedule.find({ createdBy: req.userId });
    res.status(200).json({ success: true, staffSchedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Staff Schedule by ID
const getStaffScheduleById = async (req, res) => {
  try {
    const staffSchedule = await StaffSchedule.findById(req.params.id);
    if (!staffSchedule) {
      return res
        .status(404)
        .json({ success: false, message: "Staff Schedule not found" });
    }
    res.status(200).json({ success: true, staffSchedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Staff Schedule
const updateStaffSchedule = async (req, res) => {
  try {
    const staffSchedule = await StaffSchedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!staffSchedule) {
      return res
        .status(404)
        .json({ success: false, message: "Staff Schedule not found" });
    }
    res.status(200).json({ success: true, staffSchedule });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete Staff Schedule
const deleteStaffSchedule = async (req, res) => {
  try {
    const staffSchedule = await StaffSchedule.findByIdAndDelete(req.params.id);
    if (!staffSchedule) {
      return res
        .status(404)
        .json({ success: false, message: "Staff Schedule not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Staff Schedule deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createStaffSchedule,
  getStaffSchedules,
  getStaffScheduleById,
  updateStaffSchedule,
  deleteStaffSchedule,
};
