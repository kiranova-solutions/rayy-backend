const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const eventController = require("../controllers/event.controller");

// Create a new event
router.post("/", authMiddleware, eventController.createEvent);

// Confirm booking for an event
router.post("/confirm-booking", authMiddleware, eventController.confirmBooking);

// Get ongoing events for a vendor
router.get("/ongoing", authMiddleware, eventController.getOngoingEventsByVendor);

// Get upcoming events for user
router.get("/upcoming", authMiddleware, eventController.getUpcomingEventsForUser);

// Get single event by ID
router.get("/:eventId", authMiddleware, eventController.getEventById);

// Get event info (specific format for frontend)
router.get("/:eventId/info", authMiddleware, eventController.getEventInfo);

// Delete an event
router.delete("/:eventId", authMiddleware, eventController.deleteEvent);

router.get("/:eventId/stats", authMiddleware, eventController.getEventBookingStats);

// Vendor confirms client booking
router.put("/:eventId/confirm-attendee", authMiddleware, eventController.confirmAttendee);

// Update an event
router.put('/:eventId', authMiddleware, eventController.updateEvent);

module.exports = router;    