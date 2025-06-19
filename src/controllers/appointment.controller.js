const Appointment = require("../models/appointment.model");
const Staff = require("../models/staff.model");
const StaffSchedule = require("../models/staff.schedule.model");
const VendorSchedule = require("../models/vendor.schedule.model");
const Service = require("../models/service.model");
const Cart = require("../models/cart.model");
const Rating = require("../models/rating.model");
const User = require("../models/user.model");
const Event = require("../models/event.model");
const moment = require("moment");
const userService = require("../services/user.service");
const {
  bookingCreateSMS,
  bookingCreateVendorSMS,
} = require("../sms/bookingCreated");
const {
  bookingConfirmedSMS,
  staffNewBookingSMS,
} = require("../sms/bookingConfirmed");
const { bookingCancelledSMS } = require("../sms/bookingCancelled");
const { bookingCompletedSMS } = require("../sms/bookingCompleted");
const {
  sendNewAppointmentNotification,
  sendAppointmentStatusNotification,
  sendNotificationToStaffNoBookingConfirm,
} = require("../services/notification.service");
const storeModel = require("../models/store.model");

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    weekday: "short", // Adds the day (e.g., Mon)
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
};

// Create Appointment
const createAppointment = async (req, res) => {
  try {
    const { appointmentDate, appointmentStartTime, appointmentEndTime, staff } =
      req.body;
    const createdBy = req.userId; // Assuming `req.userId` holds the user ID

    const startDateTime = new Date(
      `${appointmentDate} ${appointmentStartTime}`
    );
    const endDateTime = new Date(`${appointmentDate} ${appointmentEndTime}`);

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
      staffId: staff,
      isCancelled: false,
      $or: [
        {
          startDateTime: { $lt: endDateTime },
          endDateTime: { $gt: startDateTime },
        },
      ],
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
         message:
          existingSchedule?.status == "Blocked"
            ? "The staff member is already blocked during this time."
            : "The staff member is already scheduled for an appointment during this time. Please cancel the active booking before creating a new one.",
      });
    }

    // Create the appointment first
    const appointment = new Appointment({
      ...req.body,
      createdBy,
    });

    await appointment.save();

    // Create a new staff schedule entry using the appointment's _id
    const staffSchedule = new StaffSchedule({
      staffId: staff,
      createdBy,
      startDateTime,
      endDateTime,
      status: "Appointment",
      appointmentId: appointment._id, // Link appointment to staff schedule
    });

    await staffSchedule.save();

    res.status(201).json({ success: true, appointment, staffSchedule });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const changeSlot = async (req, res) => {
  try {
    const { appointmentId, newStartTime } = req.body;

    console.log("appointmentId: ", appointmentId, newStartTime);

    if (!appointmentId || !newStartTime) {
      return res.status(400).json({
        success: false,
        message: "Missing appointmentId or newStartTime",
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    const { appointmentDate, appointmentStartTime, appointmentEndTime, staff } =
      appointment;

    const dateString = appointmentDate.toISOString().split("T")[0];

    // Convert times to moment using 12-hour format
    const oldStart = moment(
      `${dateString} ${appointmentStartTime}`,
      "YYYY-MM-DD hh:mm A"
    );
    const oldEnd = moment(
      `${dateString} ${appointmentEndTime}`,
      "YYYY-MM-DD hh:mm A"
    );

    console.log("old: ", oldStart, oldEnd);

    if (!oldStart.isValid() || !oldEnd.isValid()) {
      return res.status(400).json({
        success: false,
        message: "Invalid original appointment time format",
      });
    }

    const duration = oldEnd.diff(oldStart); // in milliseconds

    console.log("duration: ", duration);

    const newStartMoment = moment(
      `${dateString} ${newStartTime}`,
      "YYYY-MM-DD hh:mm A"
    );
    const newEndMoment = moment(newStartMoment).add(duration, "ms");

    if (!newStartMoment.isValid() || !newEndMoment.isValid()) {
      return res.status(400).json({
        success: false,
        message: "Invalid new appointment time",
      });
    }

    if (newStartMoment >= newEndMoment) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid start time or duration" });
    }

    // Check for staff schedule conflicts
    if (staff) {
      const conflict = await StaffSchedule.findOne({
        staffId: staff,
        appointmentId: { $ne: appointmentId },
        isCancelled: false,
        $or: [
          {
            startDateTime: { $lt: newEndMoment.toDate() },
            endDateTime: { $gt: newStartMoment.toDate() },
          },
        ],
      });

      if (conflict) {
        return res.status(400).json({
          success: false,
          message:
            "The selected staff already has an overlapping schedule at this time.",
        });
      }

      const schedule = await StaffSchedule.findOne({
        appointmentId,
        isCancelled: false,
      });

      if (schedule) {
        schedule.startDateTime = newStartMoment.toDate();
        schedule.endDateTime = newEndMoment.toDate();
        await schedule.save();
      }
    }

    // Convert time to 12-hour string (e.g., "01:45 PM")
    const newStartStr = newStartMoment.format("hh:mm A");
    const newEndStr = newEndMoment.format("hh:mm A");

    appointment.appointmentStartTime = newStartStr;
    appointment.appointmentEndTime = newEndStr;
    await appointment.save();

    return res.status(200).json({
      success: true,
      message: "Appointment slot updated successfully",
      appointment,
    });
  } catch (err) {
    console.error("Error in changeSlot:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getServiceDuration = async (serviceId) => {
  const service = await Service.findById(serviceId);
  let duration = service?.duration || "60 minute"; // Default to 60 minutes

  // Extract number and unit from duration string (e.g., "2 hours", "45 minutes")
  const match = duration.match(/(\d+)\s*(minute|minutes|hour|hours)/i);
  if (match) {
    let value = parseInt(match[1], 10);
    let unit = match[2].toLowerCase();

    if (unit.includes("hour")) {
      value *= 60; // Convert hours to minutes
    }
    return value;
  }

  return 60; // Fallback to 60 minutes if parsing fails
};

const formatTo12Hour = (date) => {
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12; // Convert to 12-hour format
  return `${hours}:${minutes} ${ampm}`;
};

// const processCartToAppointment = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const cartItems = await Cart.find({ userId });

//     if (!cartItems.length) {
//       return res.status(400).json({
//         success: false,
//         message: "No items in the cart.",
//       });
//     }

//     let successfulAppointments = 0;
//     let skippedAppointments = 0;

//     for (const cart of cartItems) {
//       const service = await Service.findById(cart.serviceId);
//       if (!service) {
//         console.log(`Service not found for ID: ${cart.serviceId}`);
//         continue;
//       }

//       const vendorId = service.userId;
//       console.log("vendorId: ", vendorId);
//       const serviceDuration = await getServiceDuration(cart.serviceId);

//       // Correct Date-Time Construction
//       const startDateTime = new Date(
//         `${cart.appointmentDate}T${cart.appointmentTime}:00Z`
//       );
//       const endDateTime = new Date(
//         startDateTime.getTime() + serviceDuration * 60000
//       );

//       console.log("startDateTime: ", startDateTime);
//       console.log("endDateTime: ", endDateTime);

//       // Check for conflicting schedules
//       const existingSchedule = await StaffSchedule.findOne({
//         staffId: cart.staffId,
//         isCancelled: false,
//         $or: [
//           {
//             startDateTime: { $lt: endDateTime },
//             endDateTime: { $gt: startDateTime },
//           },
//         ],
//       });

//       if (existingSchedule) {
//         console.log(
//           `Staff member ${cart.staffId} is not available at ${startDateTime}`
//         );
//         skippedAppointments++; // Increment skipped count
//         continue; // Skip this appointment
//       }

//       // Convert to 12-hour format for appointment times
//       const appointmentStartTime = formatTo12Hour(startDateTime);
//       const appointmentEndTime = formatTo12Hour(endDateTime);

//       // Create appointment
//       const appointment = new Appointment({
//         appointmentDate: cart.appointmentDate,
//         appointmentStartTime,
//         appointmentEndTime,
//         clientId: userId,
//         service: cart.serviceId,
//         staff: cart.staffId,
//         createdBy: userId,
//         productId: cart.productId,
//         status: "Created",
//         userType: "Client",
//         vendorId,
//       });

//       await appointment.save();
//       successfulAppointments++; // Increment successful count

//       // Create staff schedule
//       const staffSchedule = new StaffSchedule({
//         staffId: cart.staffId,
//         createdBy: userId,
//         startDateTime,
//         endDateTime,
//         status: "Appointment",
//         appointmentId: appointment._id,
//       });

//       await staffSchedule.save();
//     }

//     // **Delete all cart items after processing**
//     await Cart.deleteMany({ userId });

//     return res.status(201).json({
//       success: true,
//       message: `Appointments created: ${successfulAppointments}, Skipped due to schedule conflicts: ${skippedAppointments}`,
//     });
//   } catch (error) {
//     console.error("Error processing cart:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Error processing cart items.",
//     });
//   }
// };

// // Get All Appointments for the Logged-in User
// const getAppointments = async (req, res) => {
//   try {
//     // Fetch all appointments for the logged-in user
//     const userId = req.userId;

//     // Check if the user is a client (createdBy) or a vendor (vendorId)
//     const appointments = await Appointment.find({
//       $or: [{ createdBy: userId }, { vendorId: userId }],
//     });

//     // Iterate through each appointment and fetch additional details
//     const appointmentsWithDetails = await Promise.all(
//       appointments.map(async (appointment) => {
//         const service = await Service.findOne({ _id: appointment.service });
//         const staff = await Staff.findOne({ _id: appointment.staff });
//         const rating = await Rating.findOne({ appointmentId: appointment._id });
//         const client = await User.findOne({ _id: appointment.clientId });

//         return {
//           ...appointment._doc,
//           serviceName: service ? service.name : null,
//           serviceDetails: service,
//           staffName: staff?.name,
//           rating: rating ? rating : null, // Assuming rating has a `value` field
//           client,
//         };
//       })
//     );

//     res
//       .status(200)
//       .json({ success: true, appointments: appointmentsWithDetails });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

const processCartToAppointment = async (req, res) => {
  try {
    const userId = req.userId;
    const cartItems = await Cart.find({ userId });

    if (!cartItems.length) {
      return res.status(400).json({
        success: false,
        message: "No items in the cart.",
      });
    }

    let successfulAppointments = 0;
    let skippedAppointments = 0;
    let skippedDueToPastTime = 0;

    for (const cart of cartItems) {
      const service = await Service.findById(cart.serviceId);
      if (!service) {
        console.log(`Service not found for ID: ${cart.serviceId}`);
        continue;
      }

      const vendorId = service.userId;

      // Ensure time is formatted correctly
      const formattedTime = cart.appointmentTime.padStart(5, "0"); // Ensures "9:00" → "09:00"
      const startDateTime = new Date(
        `${cart.appointmentDate}T${formattedTime}:00Z`
      );
      const currentDateTime = new Date();
      currentDateTime.setMinutes(currentDateTime.getMinutes() + 330); // 5 hours 30 minutes = 330 minutes

      console.log("Current Time: ", currentDateTime);
      console.log("Start DateTime: ", startDateTime);

      // Check if the appointment time has already passed
      if (startDateTime < currentDateTime) {
        console.log(
          `Skipping appointment: Time has already passed for ${startDateTime}`
        );
        skippedDueToPastTime++;
        continue; // Skip this appointment
      }

      const serviceDuration = await getServiceDuration(cart.serviceId);
      const endDateTime = new Date(
        startDateTime.getTime() + serviceDuration * 60000
      );

      console.log("End DateTime: ", endDateTime);

      // Check for conflicting schedules
      if (cart.staffId) {
        const existingSchedule = await StaffSchedule.findOne({
          staffId: cart.staffId,
          isCancelled: false,
          $or: [
            {
              startDateTime: { $lt: endDateTime },
              endDateTime: { $gt: startDateTime },
            },
          ],
        });

        if (existingSchedule) {
          console.log(
            `Staff member ${cart.staffId} is not available at ${startDateTime}`
          );
          skippedAppointments++; // Increment skipped count
          continue; // Skip this appointment
        }
      } else {
        const staffList = await Staff.find({
          createdBy: vendorId,
          $or: [
            { isActive: true },
            { isActive: { $exists: false } }, // covers null or missing field
          ],
        });

        if (staffList.length === 0) {
          const existingSchedule = await VendorSchedule.findOne({
            vendorId: vendorId,
            isCancelled: false,
            $or: [
              {
                startDateTime: { $lt: endDateTime },
                endDateTime: { $gt: startDateTime },
              },
            ],
          });

          if (existingSchedule) {
            console.log(
              `Vendor ${vendorId}} is not available at ${startDateTime}`
            );
            skippedAppointments++; // Increment skipped count
            continue; // Skip this appointment
          }
        }
      }

      // Convert to 12-hour format for appointment times
      const appointmentStartTime = formatTo12Hour(startDateTime);
      const appointmentEndTime = formatTo12Hour(endDateTime);

      // Create appointment
      const appointment = new Appointment({
        appointmentDate: cart.appointmentDate,
        appointmentStartTime,
        appointmentEndTime,
        clientId: userId,
        service: cart.serviceId,
        staff: cart.staffId || null,
        createdBy: userId,
        productId: cart.productId,
        status: "Created",
        userType: "Client",
        vendorId,
        clubTogetherWith: cart?.clubTogetherWith,
      });

      await appointment.save();
      successfulAppointments++; // Increment successful count

      // Send push notification to the vendor about the new appointment
      try {
        await sendNewAppointmentNotification(vendorId, appointment);
        console.log(
          `Notification sent to vendor ${vendorId} for appointment ${appointment._id}`
        );
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
        // Continue processing even if notification fails
      }

      if (cart.staffId) {
        // Create staff schedule
        const staffSchedule = new StaffSchedule({
          staffId: cart.staffId,
          createdBy: userId,
          startDateTime,
          endDateTime,
          status: "Appointment",
          appointmentId: appointment._id,
        });

        await staffSchedule.save();
      } else {
        console.log("vendorId---------------------------------", vendorId);
        const staffList = await Staff.find({
          createdBy: vendorId,
          $or: [
            { isActive: true },
            { isActive: { $exists: false } }, // covers null or missing field
          ],
        });

        console.log(
          "staffList-------------------------------- ",
          staffList,
          staffList.length
        );

        if (staffList.length === 0) {
          // Create Vendor Schedule if no staff is assigned
          const vendorSchedule = new VendorSchedule({
            vendorId,
            createdBy: vendorId,
            startDateTime,
            endDateTime,
            status: "Appointment",
            appointmentId: appointment._id,
          });

          await vendorSchedule.save();
        }
      }

      const savedAppointment = await Appointment.findById(appointment._id);

      const bookingDetails = {
        appointmentTime: startDateTime,
        bookingId: savedAppointment.bookingId,
        appointmentDate: cart.appointmentDate,
        appointmentStartTime,
        appointmentEndTime,
        serviceName: service.name,
        servicePrice: service.price || 0,
        staffName: cart.staffId
          ? (await Staff.findById(cart.staffId))?.name || "Not Assigned"
          : "Not Assigned",
      };

      let storeName;
      // Send booking creation email
      const user = await User.findById(userId); // Fetch user details
      const vendor = await User.findById(vendorId);
      if (vendor && vendor.companyName) {
        storeName = vendor.companyName;
      }

      if (user && user.email) {
        console.log("Sending email to:", user.email); // Debug log
        userService.sendEmailForBookingCreated(
          user.email,
          storeName,
          bookingDetails
        );
        bookingCreateSMS({
          recipientNumber: user.phone,
          var1: bookingDetails.bookingId,
          var2: bookingDetails.appointmentDate,
          var3: bookingDetails.appointmentStartTime,
          var4: storeName,
        });
        console.log("Email sent successfully to:", user.email); // Success
      } else {
        console.log("User email not found, skipping email.");
      }

      // send email to vendor
      if (vendor && vendor.email) {
        console.log("Sending email to vendor: ", vendor.email);
        userService.sendEmailToVendor(
          vendor.email,
          user.fullName,
          bookingDetails
        );
        bookingCreateVendorSMS({
          recipientNumber: vendor.phone,
          var1: bookingDetails.bookingId,
          var2: bookingDetails.appointmentDate,
          var3: bookingDetails.appointmentStartTime,
          var4: user.fullName,
        });
        console.log("Email sent successfully to vendor:", vendor.email);
      } else {
        console.log("Vendor email not found for vendorId:", vendorId);
      }
    }

    // **Delete all cart items after processing**
    await Cart.deleteMany({ userId });

    return res.status(201).json({
      success: true,
      message: `Appointments created: ${successfulAppointments}, Skipped due to schedule conflicts: ${skippedAppointments}, Skipped due to schedule time has passed: ${skippedDueToPastTime}`,
    });
  } catch (error) {
    console.error("Error processing cart:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing cart items.",
    });
  }
};

// Get All Appointments for the Logged-in User
const getAppointments = async (req, res) => {
  try {
    // Fetch all appointments for the logged-in user
    const userId = req.userId;

    console.log('userId', userId)

    // Check if the user is a client (createdBy) or a vendor (vendorId)
    const appointments = await Appointment.find({
      $or: [{ createdBy: userId }, { vendorId: userId }],
    });

    console.log('appointments', appointments)

    // Separate event appointments from regular appointments
    const eventAppointments = appointments.filter(appointment => appointment.eventId);
    const regularAppointments = appointments.filter(appointment => !appointment.eventId);

    // Process regular appointments
    const appointmentsWithDetails = await Promise.all(
      regularAppointments.map(async (appointment) => {
        const service = await Service.findOne({ _id: appointment.service });
        const staff = await Staff.findOne({ _id: appointment.staff });
        const rating = await Rating.findOne({ appointmentId: appointment._id });
        const client = await User.findOne({ _id: appointment.clientId });

        return {
          ...appointment._doc,
          serviceName: service ? service.name : null,
          serviceDetails: service,
          staffName: staff?.name,
          rating: rating ? rating : null,
          client,
        };
      })
    );

    // Process event appointments
    const eventsWithDetails = await Promise.all(
      eventAppointments.map(async (appointment) => {
        const event = await Event.findOne({ _id: appointment.eventId });
        const vendor = await User.findOne({ _id: event?.vendor });
        const client = await User.findOne({ _id: appointment.clientId });

        return {
          ...appointment._doc,
          eventDetails: {
            _id: event?._id,
            name: event?.name,
            images: event?.images || [],
            startDate: event?.startDate,
            endDate: event?.endDate,
            startTime: event?.startTime,
            endTime: event?.endTime,
            price: event?.eventPrice,
            vendorName: vendor?.fullName || vendor?.companyName,
            location: event?.location,
            serviceDetails: event?.serviceDetails,
            paymentCollection: event?.paymentCollection,
            isPaid: event?.isPaid,
          },
          client,
        };
      })
    );

    res.status(200).json({ 
      success: true, 
      appointments: appointmentsWithDetails,
      events: eventsWithDetails
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Appointment by ID (Only if createdBy matches req.userId)

const getAppointmentById = async (req, res) => {
  try {
    // Find the appointment by ID and validate access
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.userId },
        { staff: req.userId },
        { vendorId: req.userId },
      ],
    });

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    // Fetch the main service
    const service = await Service.findById(appointment.service);

    // Filter selected products
    const products =
      service?.product?.filter((p) =>
        appointment.productId.includes(p._id.toString())
      ) || [];

    // Fetch staff
    const staff = await Staff.findById(appointment.staff);

    // Fetch rating
    const rating = await Rating.findOne({ appointmentId: appointment._id });

    // Fetch client
    const client = await User.findById(appointment.clientId);
    const store = await storeModel.findById(service.storeId);
    const vendor = await User.findById(store.userId);
    // Fetch club together services if any
    let clubWithTogetherServices = [];
    if (
      Array.isArray(appointment.clubTogetherWith) &&
      appointment.clubTogetherWith.length > 0
    ) {
      clubWithTogetherServices = await Service.find({
        _id: { $in: appointment.clubTogetherWith },
      }).select("_id name price");
    }

    // Compile the response
    const appointmentDetails = {
      ...appointment._doc,
      staffName: staff ? staff.name : null,
      serviceName: service ? service.name : null,
      service,
      products,
      rating,
      client,
      clubWithTogetherServices,
      store,
      vendor,
    };

    res.status(200).json({ success: true, appointment: appointmentDetails });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching appointment details." });
  }
};

// Update Appointment (Only if createdBy matches req.userId)
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or unauthorized",
      });
    }

    res.status(200).json({ success: true, appointment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete Appointment (Only if createdBy matches req.userId)
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.userId,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or unauthorized",
      });
    }

    res
      .status(200)
      .json({ success: true, message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const changeStaff = async (req, res) => {
  try {
    const { appointmentId, newStaffId } = req.body;

    const appointment = await Appointment.findOne({ _id: appointmentId });

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    if (newStaffId) {
      if (appointment.staff && appointment.staff.toString() === newStaffId) {
        return res.status(400).json({
          success: false,
          message:
            "The selected staff member is already assigned to this appointment.",
        });
      }

      const { appointmentStartTime, appointmentEndTime, appointmentDate } =
        appointment;

      const formattedDate = formatDate(appointmentDate);

      const startDateTime = new Date(
        `${formattedDate} ${appointmentStartTime}`
      );
      const endDateTime = new Date(`${formattedDate} ${appointmentEndTime}`);

      const existingSchedule = await StaffSchedule.findOne({
        staffId: newStaffId,
        isCancelled: false,
        $or: [
          {
            startDateTime: { $lt: endDateTime },
            endDateTime: { $gt: startDateTime },
          },
        ],
      });

      if (existingSchedule) {
        return res.status(400).json({
          success: false,
          message:
            existingSchedule?.status === "Blocked"
              ? "The new staff member is already blocked during this time."
              : "The new staff member is already scheduled for another appointment during this time.",
        });
      }

      // Create or update StaffSchedule
      const staffSchedule = await StaffSchedule.findOne({ appointmentId });

      if (staffSchedule) {
        // Update existing schedule
        staffSchedule.staffId = newStaffId;
        await staffSchedule.save();
      } else {
        // Create new schedule
        await StaffSchedule.create({
          appointmentId,
          staffId: newStaffId,
          startDateTime,
          endDateTime,
          isCancelled: false,
          status: "Appointment",
          createdBy: appointment?.clientId,
        });
      }
    }

    // Update appointment with new staff
    appointment.staff = newStaffId;
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error changing staff:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const cancelAppointment = async (req, res) => {
  const { appointmentId, cancellationReason, cancellationDescription } =
    req.body;

  try {
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Update appointment details
    appointment.status = "Cancelled";
    appointment.cancellationReason = cancellationReason;
    appointment.cancellationDescription = cancellationDescription;
    appointment.cancelledAt = new Date();

    await appointment.save();

    // Update isCancelled to true in StaffSchedule
    await StaffSchedule.findOneAndUpdate(
      { appointmentId: appointmentId },
      { isCancelled: true },
      { new: true }
    );

    const isRegisteredClient = appointment?.clientId ? true : false;

    const client = isRegisteredClient ? await User.findById(appointment?.clientId) : null;

    const service = await Service.findById(appointment.service);
    const vendor = await User.findById(appointment.vendorId);

    // Determine if the cancellation is initiated by client or vendor
    const isClientCancellation = req.userId === appointment?.clientId?.toString();

    let storeName;
    if (vendor && vendor.companyName) {
      storeName = vendor.companyName;
    }
    if (client && client.email) {
      const appointmentDetails = {
        bookingId: appointment.bookingId,
        appointmentDate: appointment.appointmentDate,
        appointmentStartTime: appointment.appointmentStartTime,
        appointmentEndTime: appointment.appointmentEndTime,
        serviceName: service ? service.name : "Unknown Service",
        servicePrice: service?.price,
        cancellationReason,
        cancellationDescription,
      };
      await userService.sendEmailOnCancel(
        client.email,
        storeName,
        appointmentDetails
      );
      await bookingCancelledSMS({
        recipientNumber: client.phone,
        var1: appointment.bookingId,
        var2: new Date(appointment.appointmentDate).toISOString().split("T")[0],
        var3: appointment.appointmentStartTime,
        var4: storeName,
      });
      console.log("Cancellation email sent to client:", client.email);
    } else {
      console.log("Client email not found for clientId:", appointment.clientId);
    }

    // Send push notification based on who cancelled the appointment
    try {
      if (isClientCancellation) {
        // Client cancelled - notify vendor
        await sendAppointmentStatusNotification(
          appointment.vendorId,
          appointment,
          "Cancelled"
        );
        console.log(
          `Notification sent to vendor ${appointment.vendorId} for cancelled appointment ${appointment._id}`
        );
      } else {
        // Vendor cancelled - notify client
        await sendAppointmentStatusNotification(
          appointment.clientId,
          appointment,
          "Cancelled"
        );
        console.log(
          `Notification sent to client ${appointment.clientId} for cancelled appointment ${appointment._id}`
        );
      }
    } catch (notificationError) {
      console.error(
        "Error sending cancellation notification:",
        notificationError
      );
      // Continue processing even if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel appointment",
      error: error.message,
    });
  }
};

const confirmAppointment = async (req, res) => {
  const { id } = req.params;

  console.log("id: ", id);

  try {
    const appointment = await Appointment.findOne({
      _id: id,
      $or: [
        { createdBy: req.userId },
        { vendorId: req.userId }, // Assuming you meant req.userId, not req.userIsd
      ],
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or unauthorized",
      });
    }

    if (appointment.status !== "Created") {
      return res.status(400).json({
        success: false,
        message: "Only created appointments can be confirmed",
      });
    }

    appointment.status = "Confirmed";
    appointment.confirmedAt = new Date();

    await appointment.save();

    // Fetch client, service, and staff details for email
    const client = await User.findById(appointment.clientId);
    const service = await Service.findById(appointment.service);
    const staff = await Staff.findById(appointment.staff);
    const vendor = await User.findById(appointment.vendorId);
    let storeName;
    if (vendor && vendor.companyName) {
      storeName = vendor.companyName;
    }

    if (client && client.email) {
      const appointmentDetails = {
        bookingId: appointment.bookingId,
        appointmentDate: appointment.appointmentDate,
        appointmentStartTime: appointment.appointmentStartTime,
        appointmentEndTime: appointment.appointmentEndTime,
        serviceName: service ? service.name : "Unknown Service",
        servicePrice: service?.price,
        staffName: staff ? staff.name : "",
      };
      await userService.sendEmailOnConfirm(
        client.email,
        storeName,
        appointmentDetails
      );
      await bookingConfirmedSMS({
        recipientNumber: client.phone,
        var1: appointment.bookingId,
        var2: new Date(appointment.appointmentDate).toISOString().split("T")[0],
        var3: appointment.appointmentStartTime,
        var4: storeName,
      });
      if (staff) {
        await staffNewBookingSMS({
          recipientNumber: staff.phone,
          var1: appointment.bookingId,
          var2: new Date(appointment.appointmentDate)
            .toISOString()
            .split("T")[0],
          var3: appointment.appointmentStartTime,
          var4: client.fullName,
          var5: client.fullName,
        });

        const notificationType= 'Staff'

        await sendNotificationToStaffNoBookingConfirm({
          recipientId: staff._id,
          appointment,
          orderId: "",
          notificationType
        });
      }
      console.log("Confirmation email sent to client:", client.email);
    } else {
      console.log("Client email not found for clientId:", appointment.clientId);
      // Send push notification to the client about the confirmed appointment
    }
    try {
      await sendAppointmentStatusNotification(
        appointment.clientId,
        appointment,
        "Confirmed"
      );
      console.log(
        `Notification sent to client ${appointment.clientId} for confirmed appointment ${appointment._id}`
      );
    } catch (notificationError) {
      console.error(
        "Error sending confirmation notification:",
        notificationError
      );
      // Continue processing even if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Appointment confirmed successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error confirming appointment:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to confirm appointment" });
  }
};
const completeAppointment = async (req, res) => {
  const { id } = req.params;

  try {
    const appointment = await Appointment.findOne({
      _id: id,
      $or: [
        { createdBy: req.userId },
        { vendorId: req.userId },
        { staff: req.userId },
      ],
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or unauthorized",
      });
    }

    if (appointment.status !== "Confirmed") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed appointments can be completed",
      });
    }

    appointment.status = "Completed";
    appointment.completedAt = new Date();

    await appointment.save();
    // Fetch client, service, and staff details for email
    const client = await User.findById(appointment.clientId);
    const service = await Service.findById(appointment.service);
    const staff = await Staff.findById(appointment.staff);
    const vendor = await User.findById(appointment.vendorId);
    let storeName;
    if (vendor && vendor.companyName) {
      storeName = vendor.companyName;
    }

    const servicePrice = service?.price || 0;

    if (client && client.email) {
      const appointmentDetails = {
        bookingId: appointment.bookingId,
        status: appointment.status,
        appointmentDate: appointment.appointmentDate,
        appointmentStartTime: appointment.appointmentStartTime,
        appointmentEndTime: appointment.appointmentEndTime,
        serviceName: service ? service.name : "Unknown Service",
        servicePrice: servicePrice,
        staffName: staff ? staff.name : null,
      };
      await userService.sendEmailOnComplete(
        client.email,
        storeName,
        appointmentDetails
      );
      await bookingCompletedSMS({
        recipientNumber: client.phone,
        var1: appointment.bookingId,
        var2: new Date(appointment.appointmentDate).toISOString().split("T")[0],
        var3: appointment.appointmentStartTime,
        var4: storeName,
        var5: storeName,
      });
      console.log("Completion email sent to client:", client.email);
    } else {
      console.log("Client email not found for clientId:", appointment.clientId);
    }

    // Determine if completed by client or vendor
    const isClientCompleting = req.userId === appointment.clientId.toString();

    // Send push notification based on who completed the appointment
    try {
      if (isClientCompleting) {
        // Client completed - notify vendor
        await sendAppointmentStatusNotification(
          appointment.vendorId,
          appointment,
          "Completed",
          
        );
        console.log(
          `Notification sent to vendor ${appointment.vendorId} for appointment completed by client ${appointment._id}`
        );
      } else {
        // Vendor completed - notify client
        await sendAppointmentStatusNotification(
          appointment.clientId,
          appointment,
          "Completed",
          appointment._id
        );
        console.log(
          `Notification sent to client ${appointment.clientId} for completed appointment ${appointment._id}`
        );
      }
    } catch (notificationError) {
      console.error(
        "Error sending completion notification:",
        notificationError
      );
      // Continue processing even if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Appointment completed successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error completing appointment:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to complete appointment" });
  }
};

const getAppointmentsForStaff = async (req, res) => {
  try {
    let appointments = await Appointment.find({ staff: req.userId });

    const appointmentsWithService = await Promise.all(
      appointments.map(async (appointment) => {
        const service = await Service.findOne({
          _id: appointment.service,
        }).select("name");
        const client = await User.findOne({ _id: appointment.clientId });

        return {
          ...appointment._doc,
          serviceName: service ? service.name : null,
          serviceDetails: service,
          client,
        };
      })
    );

    res
      .status(200)
      .json({ success: true, appointments: appointmentsWithService });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAppointmentsForBigCalendar = async (req, res) => {
  try {
    const userId = req.userId;

    // Fetch all appointments for the logged-in user
    const appointments = await Appointment.find({
      $or: [{ createdBy: userId }, { vendorId: userId }, { staff: userId }],
    });

    const appointmentsWithService = await Promise.all(
      appointments.map(async (appointment) => {
        const service = await Service.findOne({ _id: appointment.service });
        const staff = await Staff.findOne({ _id: appointment.staff });

        // Convert Date and Time properly
        const formattedDate = formatDate(appointment?.appointmentDate);

        const formattedStartDateTime = new Date(
          `${formattedDate} ${appointment?.appointmentStartTime}`
        );
        const formattedEndDateTime = new Date(
          `${formattedDate} ${appointment?.appointmentEndTime}`
        );

        console.log("appointmentDate: ", formattedDate);
        console.log("formattedStartDateTime: ", formattedStartDateTime);
        console.log("formattedEndDateTime: ", formattedEndDateTime);

        return {
          ...appointment._doc,
          serviceName: service ? service.name : null,
          serviceDetails: service,
          staffName: staff?.name,
          formattedStartDateTime, // Converted Start Time
          formattedEndDateTime, // Converted End Time
        };
      })
    );

    console.log("appointmentsWithService:", appointmentsWithService);

    res
      .status(200)
      .json({ success: true, appointments: appointmentsWithService });
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLatestCompletedAppointment = async (req, res) => {
  try {
    console.log("Fetching latest completed appointment---------");
    const userId = req.userId;

    // Fetch the latest completed appointment for the logged-in user
    const appointment = await Appointment.findOne({
      $or: [{ createdBy: userId }, { vendorId: userId }],
      status: "Completed",
    })
      .sort({ completedAt: -1 })
      .limit(1);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "No completed appointments found",
      });
    }

    res.status(200).json({ success: true, appointment });
  } catch (error) {
    console.error("Error fetching latest completed appointment:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const cancelEvent = async (req, res) => {
  try {
    const { eventId, cancellationReason, cancellationDescription, userId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
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

    // Check if the user is authorized to cancel the event (vendor should be able to cancel their own events)
    // if (event.clientId !== req.userId) {
    //   console.log('event.clientId', event.clientId)
    //   console.log('req.userId', req.userId)
    //   return res.status(403).json({
    //     success: false,
    //     message: "You are not authorized to cancel this event",
    //   });
    // }

    // Check if event has already started
    const now = new Date();
    const eventStartDate = new Date(event.startDate);
    
    if (eventStartDate <= now) {
      console.log('eventStartDate', eventStartDate)
      console.log('now', now)
      return res.status(400).json({
        success: false,
        message: "Cannot cancel an event that has already started",
      });
    }

    // Find all appointments related to this event
    const eventAppointments = await Appointment.find({
      eventId: eventId,
      clientId: userId,
      status: { $nin: ["Cancelled", "Completed"] } // Only cancel active appointments
    });

    // Update all event appointments to cancelled status
    const appointmentUpdates = eventAppointments.map(async (appointment) => {
      appointment.status = "Cancelled";
      appointment.cancellationReason = cancellationReason;
      appointment.cancellationDescription = cancellationDescription;
      appointment.cancelledAt = new Date();
      
      await appointment.save();

      // Send notification to each client who had an appointment for this event
      // try {
      //   const client = await User.findById(appointment.clientId);
      //   if (client && client.email) {
      //     const appointmentDetails = {
      //       bookingId: appointment.bookingId,
      //       eventName: event.name,
      //       appointmentDate: appointment.appointmentDate,
      //       appointmentStartTime: appointment.appointmentStartTime,
      //       appointmentEndTime: appointment.appointmentEndTime,
      //       location: event.location,
      //       cancellationReason,
      //       cancellationDescription,
      //     };
          
      //     // Send email notification using existing service
      //     await userService.sendEmailOnCancel(
      //       client.email,
      //       event.name, // Using event name as store name
      //       appointmentDetails
      //     );

      //     // Send SMS notification
      //     await bookingCancelledSMS({
      //       recipientNumber: client.phone,
      //       var1: appointment.bookingId,
      //       var2: new Date(appointment.appointmentDate).toISOString().split("T")[0],
      //       var3: appointment.appointmentStartTime,
      //       var4: event.name,
      //     });

      //     // Send push notification
      //     await sendAppointmentStatusNotification(
      //       appointment.clientId,
      //       appointment,
      //       "Cancelled"
      //     );

      //     console.log(`Cancellation notifications sent to ${client.email} for event ${event.name}`);
      //   }
      // } catch (error) {
      //   console.error(`Error notifying client ${appointment.clientId}:`, error);
      // }

      return appointment;
    });

    const updatedAppointments = await Promise.all(appointmentUpdates);
    console.log('updatedAppointments', updatedAppointments)

    // Update event status if needed (you might want to add a status field to Event model)
    // event.status = "Cancelled";
    // event.cancelledAt = new Date();
    // await event.save();

    res.status(200).json({
      success: true,
      message: `Event cancelled successfully. ${updatedAppointments.length} appointments were cancelled.`,
      event,
      cancelledAppointments: updatedAppointments.length,
    });
  } catch (error) {
    console.error("Error cancelling event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel event",
      error: error.message,
    });
  }
};

module.exports = {
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
  changeSlot,
  getLatestCompletedAppointment,
  cancelEvent,
};
