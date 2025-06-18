const admin = require("../config/firebase");
const User = require("../models/user.model");
const Service = require("../models/service.model");
const Staff = require("../models/staff.model");

/**
 * Send a push notification to a specific user
 * @param {string} userId - The user ID to send notification to
 * @param {object} notification - The notification object with title and body
 * @param {object} data - Additional data to send with the notification
 * @returns {Promise} - Result of the send operation
 */
const sendPushNotification = async (
  userId,
  notification,
  data = {},
  notificationType = ""
) => {
  try {
    // Get user from database
    let user;

    if (notificationType === "Staff") {
      user = await Staff.findById(userId);
    } else {
      user = await User.findById(userId);
    }

    console.log("User found:------------------------------------", { user });

    if (!user || !user.fcmToken) {
      console.log(`No FCM token found for user: ${userId}`);
      return false;
    }

    const message = {
      token: user.fcmToken,
      notification,
      data,
      android: {
        priority: "high",
        notification: {
          sound: "default",
          priority: "high",
          channelId: "appointments",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log("Notification sent successfully:", response);
    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
};

/**
 * Send a notification about a new appointment
 * @param {string} vendorId - The vendor to notify
 * @param {object} appointment - The appointment details
 */
const sendNewAppointmentNotification = async (vendorId, appointment) => {
  try {
    // Get client details
    // const client = await User.findById(appointment.clientId);
    // const clientName = client ? client.fullName || "Client" : "Client";

    // Get service details
    const service = await Service.findById(appointment.service);
    const serviceName = service ? service.name || "Service" : "Service";

    // Get vendor details for store name
    const vendor = await User.findById(appointment.vendorId || vendorId);
    const storeName = vendor ? vendor.companyName || "Store" : "Store";

    // Format time for better readability
    // const appointmentTime = `${appointment.appointmentStartTime} - ${appointment.appointmentEndTime}`;

    // Format date as "12 April 2025"
    const date = new Date(appointment.appointmentDate);
    const formattedDate = date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const notification = {
      title: "New Appointment Request Received",
      body: `For ${serviceName} on ${formattedDate}`,
    };

    const data = {
      type: "new_appointment",
      appointmentId: String(appointment._id),
      appointmentDate: String(appointment.appointmentDate),
      serviceName: String(serviceName),
      storeName: String(storeName),
      screen: "AppointmentManagement",
    };

    return await sendPushNotification(vendorId, notification, data);
  } catch (error) {
    console.error("Error preparing appointment notification:", error);
    return false;
  }
};

/**
 * Send a notification about an appointment status change
 * @param {string} recipientId - The recipient to notify
 * @param {object} appointment - The appointment details
 * @param {string} status - The new status
 */
const sendNotificationRatingSubmit = async ({
  serviceId,
  storeId,
  clientId,
  userId,
}) => {
  try {
    // Get service details
    const service = await Service.findById(serviceId);
    const serviceName = service ? service.name || "Service" : "Service";

    // Get vendor details
    const vendor = await User.findById(storeId);
    const vendorName = vendor ? vendor.companyName || "Vendor" : "Vendor";
    const storeName = vendor ? vendor.companyName || "Store" : "Store";

    // Get client details
    const client = await User.findById(clientId);
    const clientName = client ? client.fullName || "Client" : "Client";

    let title, body;

    title = `New Rating Submitted  for ${serviceName}`;
    body = `For ${serviceName} by ${clientName}`;

    const notification = { title, body };
    const recipientId = userId;

    const data = {
      type: "appointment_update",
      serviceName: String(serviceName),
      vendorName: String(vendorName),
      vendorId: String(storeId),
      storeName: String(storeName),
      clientId: String(clientId),
      clientName: String(clientName),
      screen: "MyRatingsScreen",
      // metaData: {
      //   orderId,
      // },
    };

    return await sendPushNotification(recipientId, notification, data);
  } catch (error) {
    console.error("Error preparing status notification:", error);
    return false;
  }
};

const sendNotificationToStaffNoBookingConfirm = async ({
  recipientId,
  appointment,
  orderId,
  notificationType,
}) => {
  try {
    // Get service details
    const service = await Service.findById(appointment.service);
    const serviceName = service ? service.name || "Service" : "Service";

    // Get vendor details
    const vendor = await User.findById(appointment.vendorId);
    const vendorName = vendor ? vendor.companyName || "Vendor" : "Vendor";
    const storeName = vendor ? vendor.companyName || "Store" : "Store";

    // Get client details
    const client = await User.findById(appointment.clientId);
    const clientName = client ? client.fullName || "Client" : "Client";

    // Format date as "12 April 2025"
    const date = new Date(appointment.appointmentDate);
    const formattedDate = date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let title, body;

    title = `New Appointment Allocated for  ${serviceName}`;
    body = `For ${formattedDate} at ${String(
      appointment.appointmentStartTime
    )} by ${clientName}`;

    const notification = { title, body };

    const data = {
      type: "appointment_update",
      appointmentId: String(appointment._id),
      appointmentDate: String(appointment.appointmentDate),
      appointmentTime: String(appointment.appointmentStartTime),
      serviceName: String(serviceName),
      vendorName: String(vendorName),
      vendorId: String(appointment.vendorId),
      storeName: String(storeName),
      clientId: String(appointment.clientId),
      clientName: String(clientName),
      screen: "AppointmentManagementForStaff",
      // metaData: {
      //   orderId,
      // },
    };

    console.log(
      "----------------sending notif to staff-------------------- ",
      recipientId
    );

    return await sendPushNotification(
      recipientId,
      notification,
      data,
      notificationType
    );
  } catch (error) {
    console.error("Error preparing status notification:", error);
    return false;
  }
};

const sendAppointmentStatusNotification = async (
  recipientId,
  appointment,
  status,
  orderId
) => {
  try {
    // Get service details
    const service = await Service.findById(appointment.service);
    const serviceName = service ? service.name || "Service" : "Service";

    // Get vendor details
    const vendor = await User.findById(appointment.vendorId);
    const vendorName = vendor ? vendor.companyName || "Vendor" : "Vendor";
    const storeName = vendor ? vendor.companyName || "Store" : "Store";

    // Get client details
    const client = await User.findById(appointment.clientId);
    const clientName = client ? client.fullName || "Client" : "Client";

    // Format date as "12 April 2025"
    const date = new Date(appointment.appointmentDate);
    const formattedDate = date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let title, body;
    const isVendor = recipientId === appointment.vendorId.toString();

    if (status === "Confirmed") {
      title = `Appointment Confirmed for ${serviceName}`;
      body = `For ${formattedDate} at ${storeName}`;
    } else if (status === "Cancelled") {
      if (isVendor) {
        // Notification for vendor when client cancels
        title = "Booking Cancelled by Client";
        body = `${clientName} cancelled appointment for ${formattedDate}`;
      } else {
        // Notification for client when vendor cancels
        title = "We're Sorry! Your Appointment is Cancelled";
        body = `For ${formattedDate} at ${storeName}`;
      }
    } else if (status === "Completed") {
      if (isVendor) {
        // Notification for vendor when client marks as complete
        title = "Appointment Marked as Complete by Client";
        body = `${clientName}'s appointment for ${formattedDate} was marked as complete`;
      } else {
        // Notification for client when vendor marks as complete
        title = `${serviceName} appointment is Complete`;
        body = `Thanks for visiting ${storeName}. Please rate our Service.`;
      }
    }

    const notification = { title, body };

    const data = {
      type: "appointment_update",
      appointmentId: String(appointment._id),
      status: String(status),
      appointmentDate: String(appointment.appointmentDate),
      appointmentTime: String(appointment.appointmentStartTime),
      serviceName: String(serviceName),
      vendorName: String(vendorName),
      vendorId: String(appointment.vendorId),
      storeName: String(storeName),
      clientId: String(appointment.clientId),
      clientName: String(clientName),
      screen: isVendor ? "AppointmentManagement" : "Bookings",
    };

    if (status === "Completed" && !isVendor && orderId) {
      data.metaData = String(orderId) || "";
    }

    return await sendPushNotification(recipientId, notification, data);
  } catch (error) {
    console.error("Error preparing status notification:", error);
    return false;
  }
};

/**
 * Send a notification about an event being deleted
 * @param {string} clientId - The client to notify
 * @param {object} eventDetails - The event details
 */
const sendEventDeletionNotification = async (clientId, eventDetails) => {
  try {
    const { eventName, startDate, vendorId, eventId } = eventDetails;

    // Get vendor details for company name
    const vendor = await User.findById(vendorId);
    const companyName = vendor ? vendor.companyName || vendor.fullName || "Event Organizer" : "Event Organizer";

    // Format date as "12 April 2025"
    const date = new Date(startDate);
    const formattedDate = date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const notification = {
      title: "Event Cancelled",
      body: `Unfortunately, "${eventName}" scheduled for ${formattedDate} has been cancelled by ${companyName}`,
    };

    const data = {
      type: "event_deleted",
      eventId: String(eventId),
      eventName: String(eventName),
      eventDate: String(startDate),
      formattedDate: String(formattedDate),
      vendorId: String(vendorId),
      companyName: String(companyName),
      screen: "Events",
    };

    return await sendPushNotification(clientId, notification, data);
  } catch (error) {
    console.error("Error preparing event deletion notification:", error);
    return false;
  }
};

module.exports = {
  sendPushNotification,
  sendNewAppointmentNotification,
  sendAppointmentStatusNotification,
  sendNotificationRatingSubmit,
  sendNotificationToStaffNoBookingConfirm,
  sendEventDeletionNotification,
};
