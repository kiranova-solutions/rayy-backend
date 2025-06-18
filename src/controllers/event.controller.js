const Event = require("../models/event.model");
const { sendEventDeletionNotification } = require("../services/notification.service");
const Service = require("../models/service.model");
const User = require("../models/user.model");
const Store = require("../models/store.model");


const timeToMinutes = (timeString) => {
  const [time, period] = timeString.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  let hour24 = hours;
  if (period === 'PM' && hours !== 12) {
    hour24 += 12;
  } else if (period === 'AM' && hours === 12) {
    hour24 = 0;
  }
  
  return hour24 * 60 + minutes;
};


const createEvent = async (req, res) => {
  try {

    console.log('starting event creation')
    console.log('req.body', req.body)

    const {
      name,
      startDate,
      endDate,
      startTime,
      endTime,
      images,
      video,
      services,
      numberOfAttendees,
      eventPrice,
      isPaid,
      paymentCollection,
      userId, 
      paymentDetails , 
      serviceDetails
    } = req.body;

    const vendorDetails = await User.findById(userId);
    
    if(!vendorDetails?.type === "Vendor") {
      return res.status(400).json({
        success: false,
        message: "User is not a vendor",
      });
    }

    // Input validation for required fields
    const requiredFields = {
      name: "Event name is required",
      startDate: "Start date is required",
      endDate: "End date is required",
      startTime: "Start time is required",
      endTime: "End time is required",
      numberOfAttendees: "Number of attendees is required",
      serviceDetails: "Service details are required",
      images: "Images are required",
      services: "Services are required",
      ...(isPaid && {paymentCollection: "Payment collection method is required"}),
      ...(isPaid && {eventPrice: "Event price is required"}),
    };

    const missingFields = [];
    Object.keys(requiredFields).forEach((field) => {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === "") {
        missingFields.push(requiredFields[field]);
      }
    });

    if (missingFields.length > 0) {
      console.log('missingFields', missingFields)
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        errors: missingFields,
      });
    }

    // Data type and format validation
    const validationErrors = [];

      // Validate dates
      // Handle date format like '14 Jun 2025'
    const parseDate = (dateString) => {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date;
    };

    const startDateObj = parseDate(startDate);
    const endDateObj = parseDate(endDate);
    const currentDate = new Date();
    const currentDateStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

    if (!startDateObj) {
      validationErrors.push("Invalid start date format. Expected format: '14 Jun 2025'");
    } else if (startDateObj < currentDateStart) {
      validationErrors.push("Start date cannot be in the past");
    }

    if (!endDateObj) {
      validationErrors.push("Invalid end date format. Expected format: '14 Aug 2025'");
    } else if (startDateObj && endDateObj < startDateObj) {
      validationErrors.push("End date must be greater than or equal to start date");
    }

    // Validate time format (HH:MM)
    // const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    // if (!timeRegex.test(startTime)) {
    //   validationErrors.push("Invalid start time format. Use HH:MM format");
    // }
    // if (!timeRegex.test(endTime)) {
    //   validationErrors.push("Invalid end time format. Use HH:MM format");
    // }

    // Validate time logic for same day events
    if (startDateObj.toDateString() === endDateObj.toDateString()) {
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (endMinutes <= startMinutes) {
        validationErrors.push("End time must be after start time for same-day events");
      }
    }

    // Validate numeric fields
    if (typeof numberOfAttendees !== "number" || numberOfAttendees < 1) {
      validationErrors.push("Number of attendees must be a positive number");
    }

    if(isPaid) {
    if (typeof eventPrice !== "number" || eventPrice < 0) {
      validationErrors.push("Event price must be a non-negative number");
    }
    
    // Validate enum fields
    const validPaymentCollections = ["preEvent", "atEvent"];
    if (!validPaymentCollections.includes(paymentCollection)) {
      validationErrors.push("Payment collection must be either 'preEvent' or 'atEvent'");
    }
  }

      
      if (images.length <= 0) {
        validationErrors.push("Images are required");
      }


    // @todo : Validate video URL if provided
    // if (video && (typeof video !== "string" || !/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(video))) {
    //   validationErrors.push("Video must be a valid HTTP/HTTPS URL");
    // }


    if (validationErrors.length > 0) {
      console.log('validationErrors', validationErrors)
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: validationErrors,
      });
    }

    // Create event data object
    const eventData = {
      name: name.trim(),
      startDate: startDateObj,
      endDate: endDateObj,
      startTime,
      endTime,
      serviceDetails: serviceDetails.trim(),
      paymentDetails: paymentDetails.trim(),
      numberOfAttendees,
      eventPrice,
      isPaid,
      paymentCollection,
      attendees: [], // Initialize empty attendees array
      location: vendorDetails?.location,
      vendor: userId,
      images: images,
    };

    // Add optional fields if provided
    if (images && images.length > 0) {
      eventData.images = images;
    }
    
    if (video?.length) {
      eventData.video = video?.[0];
    }
    
    if (services) {
      eventData.services = services.trim();
    }


    // Create the event
    const newEvent = new Event(eventData);
    const savedEvent = await newEvent.save();

    // Return success response with created event
    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: savedEvent,
    });

  } catch (error) {
    console.error("Error creating event:", error);

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.log("validationErrors", validationErrors);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Event with this information already exists",
        error: "Duplicate entry",
      });
    }

    // Handle cast errors (invalid ObjectId, etc.)
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid data format",
        error: error.message,
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log('starting event update')
    console.log('req.body', req.body)
    console.log('eventId', eventId)

    // Validate event ID
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    // Find the existing event
    const existingEvent = await Event.findById(eventId);
    if (!existingEvent) {
      console.log('event not found')
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const {
      name,
      startDate,
      endDate,
      startTime,
      endTime,
      images,
      video,
      services,
      numberOfAttendees,
      eventPrice,
      isPaid,
      paymentCollection,
      userId, 
      paymentDetails , 
      serviceDetails
    } = req.body;

    // Verify that the user is the vendor who created the event
    if (existingEvent.vendor.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this event. Only the vendor who created the event can update it.",
      });
    }

    const vendorDetails = await User.findById(userId);
    
    if(!vendorDetails?.type === "Vendor") {
      return res.status(400).json({
        success: false,
        message: "User is not a vendor",
      });
    }

    // Input validation for required fields
    const requiredFields = {
      name: "Event name is required",
      startDate: "Start date is required",
      endDate: "End date is required",
      startTime: "Start time is required",
      endTime: "End time is required",
      numberOfAttendees: "Number of attendees is required",
      serviceDetails: "Service details are required",
      images: "Images are required",
      services: "Services are required",
      ...(isPaid && {paymentCollection: "Payment collection method is required"}),
      ...(isPaid && {eventPrice: "Event price is required"}),
    };

    const missingFields = [];
    Object.keys(requiredFields).forEach((field) => {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === "") {
        missingFields.push(requiredFields[field]);
      }
    });

    if (missingFields.length > 0) {
      console.log('missingFields', missingFields)
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        errors: missingFields,
      });
    }

    // Data type and format validation
    const validationErrors = [];

    // Validate dates
    // Handle date format like '14 Jun 2025'
    const parseDate = (dateString) => {
      const date = new Date(dateString);
      // Additional validation for the expected format
      if (isNaN(date.getTime())) {
        return null;
      }
      return date;
    };

    const startDateObj = parseDate(startDate);
    const endDateObj = parseDate(endDate);
    const currentDate = new Date();
    const currentDateStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

    if (!startDateObj) {
      validationErrors.push("Invalid start date format. Expected format: '14 Jun 2025'");
    } else if (startDateObj < currentDateStart) {
      validationErrors.push("Start date cannot be in the past");
    }

    if (!endDateObj) {
      validationErrors.push("Invalid end date format. Expected format: '14 Aug 2025'");
    } else if (startDateObj && endDateObj < startDateObj) {
      validationErrors.push("End date must be greater than or equal to start date");
    }


    if (startDateObj.toDateString() === endDateObj.toDateString()) {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      
      if (endMinutes <= startMinutes) {
        validationErrors.push("End time must be after start time for same-day events");
      }
    }

    // Validate time logic for same day events
    // if (startDateObj.toDateString() === endDateObj.toDateString()) {
    //   const [startHour, startMin] = startTime.split(":").map(Number);
    //   const [endHour, endMin] = endTime.split(":").map(Number);
    //   const startMinutes = startHour * 60 + startMin;
    //   const endMinutes = endHour * 60 + endMin;
      
    //   if (endMinutes <= startMinutes) {
    //     validationErrors.push("End time must be after start time for same-day events");
    //   }
    // }

    // Validate numeric fields
    if (typeof numberOfAttendees !== "number" || numberOfAttendees < 1) {
      validationErrors.push("Number of attendees must be a positive number");
    }

    // Check if reducing numberOfAttendees would affect existing attendees
    const currentAttendees = existingEvent.attendees.length;
    if (numberOfAttendees < currentAttendees) {
      validationErrors.push(`Cannot reduce number of attendees below current registrations (${currentAttendees})`);
    }

    if(isPaid) {
      if (typeof eventPrice !== "number" || eventPrice < 0) {
        validationErrors.push("Event price must be a non-negative number");
      }
      
      // Validate enum fields
      const validPaymentCollections = ["preEvent", "atEvent"];
      if (!validPaymentCollections.includes(paymentCollection)) {
        validationErrors.push("Payment collection must be either 'preEvent' or 'atEvent'");
      }
    }

    if (images.length <= 0) {
      validationErrors.push("Images are required");
    }

    if (validationErrors.length > 0) {
      console.log('validationErrors', validationErrors)
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: validationErrors,
      });
    }

    // Create update data object
    const updateData = {
      name: name.trim(),
      startDate: startDateObj,
      endDate: endDateObj,
      startTime,
      endTime,
      numberOfAttendees,
      eventPrice,
      isPaid,
      paymentCollection,
      location: vendorDetails?.location,
      images: images,
      serviceDetails: serviceDetails.trim(),
      paymentDetails: paymentDetails.trim(),
    };

    // Add optional fields if provided
    if (video?.length) {
      updateData.video = video?.[0];
    }
    
    if (services) {
      updateData.services = services.trim();
    }

    // Update the event
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      updateData,
      { new: true, runValidators: true, context: 'query' }
    );

    // Return success response with updated event
    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: updatedEvent,
    });

  } catch (error) {
    console.error("Error updating event:", error);

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.log("validationErrors", validationErrors);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      });
    }

    // Handle cast errors (invalid ObjectId, etc.)
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid data format",
        error: error.message,
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const vendorId = req.body?.userId; // Get vendor ID from request body

    // Validate event ID
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    // Validate vendor ID
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID is required",
      });
    }

    // Find the event to be deleted
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Verify that the current vendor is the one who created the event
    if (event.vendor.toString() !== vendorId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this event. Only the vendor who created the event can delete it.",
      });
    }

    // Store event details and attendees for notifications before deletion
    const eventName = event.name;
    const startDate = event.startDate;
    const attendees = event.attendees;
    const eventVendorId = event.vendor;

    // Delete the event
    await Event.findByIdAndDelete(eventId);

    // Send notifications to all attendees about event deletion
    if (attendees && attendees.length > 0) {
      const notificationPromises = attendees.map(attendee => 
        sendEventDeletionNotification(attendee.clientId, {
          eventName,
          startDate,
          vendorId: eventVendorId,
          eventId
        })
      );

      // Send all notifications in parallel
      await Promise.allSettled(notificationPromises);
    }

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
      data: {
        deletedEventId: eventId,
        notificationsSent: attendees.length,
      },
    });

  } catch (error) {
    console.error("Error deleting event:", error);

    // Handle cast errors (invalid ObjectId, etc.)
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format",
        error: error.message,
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

const getOngoingEventsByVendor = async (req, res) => {
  try {
    const  vendorId  = req.body?.userId;

    // Get current datetime for filtering ongoing events
    const currentDateTime = new Date();

    const ongoingEvents = await Event.find({
      vendor: vendorId,
      endDate: { $gt: currentDateTime },
    }).select('_id name numberOfAttendees attendees images endDate');


    console.log('ongoingEvents', ongoingEvents)

    // Transform the data to include only required fields
    const formattedEvents = ongoingEvents.map(event => {
      // Calculate available slots
      const totalSlots = event.numberOfAttendees;
      const occupiedSlots = event.attendees ? event.attendees.length : 0;
      const availableSlots = Math.max(0, totalSlots - occupiedSlots);

      // Get the first image or null if no images
      const image = event.images && event.images.length > 0 ? event.images[0] : null;

      return {
        id: event._id,
        name: event.name,
        totalSlotsAvailable: availableSlots,
        occupiedSlots: occupiedSlots,
        totalSlots: totalSlots,
        image: image,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Ongoing events retrieved successfully",
      data: {
        events: formattedEvents,
        totalEvents: formattedEvents.length,
      },
    });

  } catch (error) {
    console.error("Error fetching ongoing events:", error);

    // Handle cast errors (invalid ObjectId, etc.)
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID format",
        error: error.message,
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate event ID
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    // Find the event by ID
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Calculate available slots
    const totalSlots = event.numberOfAttendees;
    const occupiedSlots = event.attendees ? event.attendees.length : 0;
    const availableSlots = Math.max(0, totalSlots - occupiedSlots);

    // Format the response with additional computed fields
    const eventDetails = {
      id: event._id,
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      images: event.images || [],
      video: event.video || null,
      paymentDetails: event.paymentDetails,
      services: event.services || null,
      numberOfAttendees: event.numberOfAttendees,
      currentAttendees: occupiedSlots,
      availableSlots: availableSlots,
      eventPrice: event.eventPrice,
      registrationFieldConfig: event.registrationFieldConfig || {},
      vendorId: event.vendorId,
      isPaid: event.isPaid,
      paymentCollection: event.paymentCollection,
      attendees: event.attendees,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      isFull: availableSlots === 0,
    };

    return res.status(200).json({
      success: true,
      message: "Event details retrieved successfully",
      data: {
        event: eventDetails,
      },
    });

  } catch (error) {
    console.error("Error fetching event details:", error);

    // Handle cast errors (invalid ObjectId, etc.)
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format",
        error: error.message,
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

const getUpcomingEventsForUser = async (req, res) => {
  try {
    const { all } = req.query;

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set to start of day for comparison


    let query = Event.find({
      endDate: { $gt: currentDate }, // Check if event hasn't ended yet
    }).select('_id name startDate endDate startTime endTime numberOfAttendees attendees images eventPrice isPaid vendor details')
    .populate('vendor', 'name email') // Populate vendor information 
    .sort({ startDate: 1 }); // Sort by start date ascending


    if (!all) {
      query = query.limit(10);
    }

    const upcomingEvents = await query;

    console.log('upcomingEvents', upcomingEvents);

    // Transform the data to include only required fields with additional computed data
    const formattedEvents = upcomingEvents.map(event => {
      // Calculate available slots
      const totalSlots = event.numberOfAttendees;
      const occupiedSlots = event.attendees ? event.attendees.length : 0;
      const availableSlots = Math.max(0, totalSlots - occupiedSlots);

      // Get the first image or null if no images
      const image = event.images && event.images.length > 0 ? event.images[0] : null;

      return {
        id: event._id,
        name: event.name,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        details: event.details,
        totalSlots: totalSlots,
        currentAttendees: occupiedSlots,
        availableSlots: availableSlots,
        eventPrice: event.eventPrice,
        isPaid: event.isPaid,
        image: image,
        vendor: {
          id: event.vendor._id,
          name: event.vendor.name,
          email: event.vendor.email,
        },
        isFull: availableSlots === 0,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Upcoming events retrieved successfully",
      data: {
        events: formattedEvents,
        totalEvents: formattedEvents.length,
        isLimited: !all && formattedEvents.length === 10,
      },
    });

  } catch (error) {
    console.error("Error fetching upcoming events:", error);

    // Generic server error
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

const getEventInfo = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.body?.userId;

    // Validate event ID
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    // Find the event by ID and select only required fields
    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const services = await Service.find({
      userId: event.vendor,
    }).select('name images');

    const rating = await Store.findOne({
      userId: event.vendor,
    }).select('rating');

    console.log('event', event)

    const isFull = event.attendees.map(attendee => attendee.status === "approved").length >= event.numberOfAttendees;

    // Format the response with exactly the requested fields
    const eventInfo = {
      id : event._id,
      name : event.name,
      price : event.eventPrice,
      paymentType : event.paymentCollection,
      images: event.images || [],
      videos: event.video ? [event.video] : [], // Convert single video to array format
      location: event.location || "",
      clientServices: event.services || "",
      eventStartDate: event.startDate,
      eventEndDate: event.endDate,
      timeSlot: `${event.startTime} - ${event.endTime}`,
      eventDescription: event.details,
      services: services || [],
      isPaid : event.isPaid,
      isBooked : event.attendees.some(attendee => attendee.clientId === userId),
      startTime : event.startTime,
      isFull : isFull,
      endTime : event.endTime,
      paymentDetails : event.paymentDetails,
      serviceDetails : event.serviceDetails,
      numberOfAttendees : event.numberOfAttendees,
      rating : rating?.rating || 0,
    };

    console.log('eventInfo', eventInfo)

    return res.status(200).json({
      success: true,
      message: "Event information retrieved successfully",
      data: eventInfo,
    });

  } catch (error) {
    console.error("Error fetching event info:", error);

    // Handle cast errors (invalid ObjectId, etc.)
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format",
        error: error.message,
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

const confirmBooking = async (req, res) => {
  try {
    const { eventId, userId, paymentScreenshotUrl } = req.body;

    console.log('confirmBooking', req.body)

    // Input validation for required fields
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const userDetails = await User.findById(userId);
    console.log('userDetails', userDetails)
    const isVendor = userDetails?.type === "Vendor" || userDetails?.type === "Owner" || false ;

    // Check if event is full
    if (event.attendees.length >= event.numberOfAttendees) {
      console.log('event is full')
      return res.status(400).json({
        success: false,
        message: "Event is full, no more attendees can be registered",
      });
    }

    // Check if user is already registered for this event
    const isAlreadyRegistered = event.attendees.some(attendee => attendee.clientId === userId);
    console.log('isAlreadyRegistered', isAlreadyRegistered)
    if (isAlreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: "User is already registered for this event",
      });
    }

    // Check if event has already started or ended
    // const currentDate = new Date();
    // if (event.startDate < currentDate) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Cannot register for an event that has already started",
    //   });
    // }

    // Get registration field configuration
    const registrationFields = event.registrationFieldConfig

   if(registrationFields) {
    // Validate registration data based on event configuration
    const validationResult = event.validateRegistrationData(registrationFields || {});
    
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: "Registration validation failed",
        errors: validationResult.errors,
      });
    }
  }

    // Check if payment screenshot is required
    const paymentScreenshotConfig = event.registrationFieldConfig?.paymentScreenshot;
    const isPaymentScreenshotRequired = paymentScreenshotConfig?.isRequired && paymentScreenshotConfig?.isEnabled;
    
    if (isPaymentScreenshotRequired && !paymentScreenshotUrl) {
      return res.status(400).json({
        success: false,
        message: "Payment screenshot is required for this event",
      });
    }

    const newAttendee = {
      clientId: userId,
      registeredAt: new Date(),
      status: "pending",
    };

    // Add payment screenshot URL if provided
    if (paymentScreenshotUrl) {
      newAttendee.paymentScreenshotUrl = paymentScreenshotUrl;
    }

    event.attendees.push(newAttendee);
    await event.save();

    const availableSlots = event.numberOfAttendees - event.attendees.length;

    return res.status(200).json({
      success: true,
      message: "Booking confirmed successfully",
      data: {
        eventId: event._id,
        eventName: event.name,
        userId: userId,
        registeredAt: newAttendee.registeredAt,
        totalAttendees: event.attendees.length,
        availableSlots: availableSlots,
        isFull: availableSlots === 0,
        isVendor: isVendor,
      },
    });

  } catch (error) {
    console.error("Error confirming booking:", error);

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      });
    }

    // Handle cast errors (invalid ObjectId, etc.)
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
        error: error.message,
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

const getEventBookingStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Validate event ID
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    // Find the event by ID
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Get all attendees
    const attendees = event.attendees || [];

    // Calculate statistics
    const total = event.numberOfAttendees;
    const approved = attendees.filter(attendee => attendee.status === "approved").length;
    const pending = attendees.filter(attendee => attendee.status === "pending").length;
    const denied = attendees.filter(attendee => attendee.status === "denied").length;

    const stats = {
      total: total,
      current: approved,
      approved: approved,
      pending: pending,
      denied: denied,
    };

    // Get user details for each attendee
    const userIds = attendees.map(attendee => attendee.clientId);
    const users = await User.find({ _id: { $in: userIds } }).select('_id fullName profileImage email');

    const userMap = {};
    users.forEach(user => {
      userMap[user._id] = user;
    });

    const usersData = attendees.map(attendee => {
      const user = userMap[attendee.clientId];
      
      const formattedDate = new Date(attendee.registeredAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit'
      });

      return {
        id: attendee.clientId,
        name: user?.fullName || null,
        profileImage: user?.profileImage || null,
        mobile: user?.mobile || null, 
        age: user?.age || null,
        gender : user?.gender || null,
        date: formattedDate,
        status: attendee.status.toUpperCase(),
        paymentScreenshotUrl: attendee.paymentScreenshotUrl || null,
      };
    });

    const payment = {
      isPaid : event.isPaid,
      paymentType : event.paymentCollection,
    }

    return res.status(200).json({
      success: true,
      message: "Event booking statistics retrieved successfully",
      data: {
        payment : payment,
        stats: stats,
        users: usersData,
      },
    });

  } catch (error) {
    console.error("Error fetching event booking stats:", error);

    // Handle cast errors (invalid ObjectId, etc.)
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format",
        error: error.message,
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

const confirmAttendee = async (req, res) => {
  try {
    const { eventId, clientId } = req.body;

    if(!eventId || !clientId) {
      return res.status(400).json({
        success: false,
        message: "Event ID, User ID, and Client ID are required",
      });
    }

    const event = await Event.findById(eventId);

    const attendee = event.attendees.find(attendee => attendee.clientId === clientId);

    if(attendee.status === "approved") {
      throw new Error("Attendee is already approved");
    }

    attendee.status = "approved";  
    await event.save(); 

    return res.status(200).json({
      success: true,
      message: "Attendee approved successfully",
    }); 

  } catch (error) {
    console.error("Error confirming attendee:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  getOngoingEventsByVendor,
  getEventById,
  getUpcomingEventsForUser,
  getEventInfo,
  confirmBooking,
  getEventBookingStats,
  confirmAttendee,
};
