const Otp = require("../models/otp.model");
const Users = require("../models/user.model");
const Token = require("../models/token.model");
const jwt = require("jsonwebtoken");
const transporter = require("../config/email");
const createError = require("http-errors");
const { sendSms } = require("../config/enableX");
const otpTemplate = require("../emails/send-otp-to-user");
const bookingCreationTemplate = require("../emails/booking-created-template");
const vendorBookingNotificationTemplate =require("../emails/vendor-booking-notification-template");
const appointmentConfirmedTemplate = require("../emails/appointment-confirmed-template");
const appointmentCancelledTemplate = require("../emails/appointment-cancelled-template");
const appointmentCompletedTemplate = require("../emails/appointment-completed-template");
require("dotenv").config();


const sendOtp = async (email, type) => {
  try {
    let user = await Users.findOne({ email, type });

    if (!user) {
      throw new Error("User does not exist.");
    }

    const userId = user._id;

    
    // Generate OTP
    let otp = "";
    if (
      user.email == "test.client@rayy.online" ||
      user.email == "test.vendor@rayy.online"
    ) {
      otp = "1234";
    } else {
      otp = Math.floor(1000 + Math.random() * 9000).toString();
    }

    // Load HTML template and fill values
    const htmlBody = otpTemplate(user?.fullName || "User", otp);

    // Mail options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "OTP to verify email address",
      html: htmlBody,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Save OTP in database
    const sentOtp = new Otp({ otp, userId, role: type });
    await sentOtp.save();

    return {
      success: true,
      message: "OTP sent successfully",
      data: user,
    };
  } catch (error) {
    console.error("Error in sending OTP:", error.message);
    throw new Error(error.message || "Failed to send OTP. Please try again.");
  }
};


const sendEmailForBookingCreated = async (email,storeName, bookingDetails) => {
  try {
    let user = await Users.findOne({ email});

    if (!user) {
      throw new Error("User does not exist.");
    }

    const userId = user._id;

    // Extract booking details
    const {
      bookingId,
      appointmentDate,
      appointmentStartTime,
      appointmentEndTime,
      serviceName,
      servicePrice,
      staffName,
  
    } = bookingDetails;
   // Load HTML template and fill values

   const htmlBody = bookingCreationTemplate(user?.fullName || "User", {
    bookingId,
    appointmentDate,
    appointmentSlot: `${appointmentStartTime} - ${appointmentEndTime}`,
    serviceName,
    servicePrice,
    staffName,
    storeName
  });
   

    // Mail options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Appointment Request Received - ${storeName}`,
      html: htmlBody,
    };

    // Send email with error logging
    await transporter.sendMail(mailOptions);
    console.log("Email sent to:", user.email); // Debug log

    return {
      success: true,
      message: "Booking appointment  email sent successfully",
      data: user,
    };
  } catch (error) {
    console.error("Error in sending booking creation email:", error.message);
    throw new Error(error.message || "Failed to send booking creation email. Please try again.");
  }
};

// send email to vendor
const sendEmailToVendor =async(vendorEmail,userName,bookingDetails)=>{
  try{
    let vendor = await Users.findOne({email:vendorEmail})
    if(!vendor){
      throw new Error("Vendor dose not exist.");
    }
    // extract booking details
    const {
      bookingId,
      appointmentDate,
      appointmentStartTime,
      appointmentEndTime,
      serviceName,
      servicePrice,
      staffName,
    } = bookingDetails;

    // Load HTML template and fill values
    const htmlBody = vendorBookingNotificationTemplate(vendor?.fullName || "Vendor", {
      bookingId,
      clientName: userName,
      appointmentDate,
      appointmentSlot: `${appointmentStartTime} - ${appointmentEndTime}`,
      serviceName,
      servicePrice,
      staffName,
    });

//  mail option
const mailOptions = {
  from: process.env.EMAIL_USER,
  to:vendor.email,
  subject: `Appointment Request Received - ${serviceName}`,
  html:htmlBody,
}
// Send email with error logging
await transporter.sendMail(mailOptions);
console.log("Email sent to vendor:", vendor.email);

return {
  success: true,
  message: "Vendor notification email sent successfully",
  data: vendor,
};

} catch (error) {
  console.error("Error in sending vendor notification email:", error.message);
  throw new Error(error.message || "Failed to send vendor notification email. Please try again.");
}
};


// appointment confirmation email to client
const sendEmailOnConfirm=async(email,storeName,appointmentDetails)=>{
try{
    let user = await Users.findOne({email});
    if(!user){
      throw new Error("User dose not exist");
    }
    const {
      bookingId,
      appointmentDate,
      appointmentStartTime,
      appointmentEndTime,
      serviceName,
      servicePrice,
      staffName,   
    } = appointmentDetails;

    const htmlBody = appointmentConfirmedTemplate(user?.fullName || "User",{
      bookingId,
      appointmentDate,
      appointmentSlot: `${appointmentStartTime} - ${appointmentEndTime}`,
      serviceName,
      servicePrice,
      staffName: staffName || "Not Assigned",
    })
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Appointment Confirm ${storeName}`,
      html: htmlBody,
    };
    await transporter.sendMail(mailOptions);
    console.log("Confirmation email sent to:", user.email);
    return {
      success: true,
      message: "Confirmation email sent successfully",
      data: user,
    };
  } catch (error) {
    console.error("Error in sending confirmation email:", error.message);
    throw new Error(error.message || "Failed to send confirmation email. Please try again.");
  }
};

// appointment cancellation  email to client
const sendEmailOnCancel = async (email, storeName,appointmentDetails) => {
  try {
    let user = await Users.findOne({ email });

    if (!user) {
      throw new Error("User does not exist.");
    }

    const {
      bookingId,
      appointmentDate,
      appointmentStartTime,
      appointmentEndTime,
      serviceName,
      servicePrice,
      cancellationReason,
      cancellationDescription,
    } = appointmentDetails;
  
    
    const htmlBody = appointmentCancelledTemplate(user?.fullName || "User", {
      bookingId,
      appointmentDate,
      appointmentSlot: `${appointmentStartTime} - ${appointmentEndTime}`,
      serviceName,
      servicePrice,
      cancellationReason,
      cancellationDescription,
    });
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Your Appointment Has Been Cancelled - ${storeName} `,
      html: htmlBody,
    };

    await transporter.sendMail(mailOptions);
    console.log("Cancellation email sent to:", user.email);

    return {
      success: true,
      message: "Cancellation email sent successfully",
      data: user,
    };
  } catch (error) {
    console.error("Error in sending cancellation email:", error.message);
    throw new Error(error.message || "Failed to send cancellation email. Please try again.");
  }
};

// appointment completion email to client
const sendEmailOnComplete = async (email,storeName, appointmentDetails) => {
  try {
    let user = await Users.findOne({ email });

    if (!user) {
      throw new Error("User does not exist.");
    }

    const {
      bookingId,
      status,
      appointmentDate,
      appointmentStartTime,
      appointmentEndTime,
      serviceName,
      servicePrice,
      staffName,
     
     
    } = appointmentDetails;

    const htmlBody = appointmentCompletedTemplate(user?.fullName || "User", {
      bookingId,
      status,
      appointmentDate,
      appointmentSlot: `${appointmentStartTime} - ${appointmentEndTime}`,
      serviceName,
      servicePrice,
      staffName: staffName || "Not Assigned",
    
      
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Your Appointment Has Been Completed - ${storeName}`,
      html: htmlBody,
    };

    await transporter.sendMail(mailOptions);
    console.log("Completion email sent to:", user.email);

    return {
      success: true,
      message: "Completion email sent successfully",
      data: user,
    };
  } catch (error) {
    console.error("Error in sending completion email:", error.message);
    throw new Error(error.message || "Failed to send completion email. Please try again.");
  }
};


const verifyOtp = async (otp, userId, type) => {
  // Check OTP
  const checkOtp = await Otp.findOne({ userId })
    .sort({ createdAt: -1 })
    .limit(1);

  if (!checkOtp) {
    throw createError(400, "OTP is not sent.Please try again");
  }

  if (!(checkOtp.otp === otp)) {
    throw createError(400, "Invalid OTP");
  }

  const otpAge = (new Date() - new Date(checkOtp.createdAt)) / 1000 / 60; // Minutes
  if (otpAge > 2) {
    throw createError(400, "OTP expired. Please request a new one");
  }

  let user = "";
  // Check user existence
  user = await Users.findOne({ _id: userId });

  if (!user) {
    throw new Error("User does not exist");
  }

  const token = jwt.sign({ userId: user._id }, process.env.TOKEN_SECRET, {
    expiresIn: "30d",
  });

  const checkExistingSession = await Token.findOne({ userId: user._id });

  if (checkExistingSession) {
    await Token.findByIdAndUpdate(checkExistingSession._id, {
      activeToken: token,
    });
  } else {
    const createSession = new Token({
      activeToken: token,
      userId,
      role: type,
    });
    await createSession.save();
  }

  return {
    success: true,
    message: "User verified successfully",
    data: { user, token },
  };
};

const sendMobileOtp = async (phone, role) => {
  let user = "";
  user = await Users.findOne({ phone: phone, type: role });

  console.log("user: ", user, phone, role);

  if (!user) {
    throw new Error("User does not exist.");
  }

  const userId = user?._id;

  // Generate OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Send and save OTP
  try {
    const response = await sendSms(`+91${phone}`, otp);

    console.log("response: ", response);
    const sentOtp = new Otp({ otp, userId: userId, role: role });

    console.log("sentOtp: ", sentOtp);
    await sentOtp.save();

    return {
      success: true,
      message: "OTP sent successfully",
      data: user,
    };
  } catch (error) {
    console.log("error in sending email", error, error.message);
    throw new Error("Error sending email");
  }
};

const verifyMobileOtp = async (otp, userId, role) => {
  // Check OTP
  const checkOtp = await Otp.findOne({ userId, role: role })
    .sort({ createdAt: -1 })
    .limit(1);

  if (!checkOtp) {
    throw createError(400, "OTP is not sent.Please try again");
  }

  if (!(checkOtp.otp === otp)) {
    throw createError(400, "Invalid OTP");
  }

  const otpAge = (new Date() - new Date(checkOtp.createdAt)) / 1000 / 60; // Minutes
  if (otpAge > 2) {
    throw createError(400, "OTP expired. Please request a new one");
  }

  console.log("checkOtp: ", checkOtp);

  let user = "";
  // Check user existence
  user = await Users.findOne({ _id: userId });

  if (!user) {
    throw new Error("User does not exist");
  }

  const token = jwt.sign({ userId: user._id }, process.env.TOKEN_SECRET, {
    expiresIn: "30d",
  });

  const checkExistingSession = await Token.findOne({ userId: user._id });

  if (checkExistingSession) {
    await Token.findByIdAndUpdate(checkExistingSession._id, {
      activeToken: token,
    });
  } else {
    const createSession = new Token({
      activeToken: token,
      userId,
      role: role,
    });
    await createSession.save();
  }

  return {
    success: true,
    message: "User verified successfully",
    data: { user: user, token },
  };
};

module.exports = {
  sendOtp,
  verifyOtp,
  sendMobileOtp,
  verifyMobileOtp,
  sendEmailForBookingCreated,
  sendEmailToVendor,
  sendEmailOnConfirm,
  sendEmailOnCancel,
  sendEmailOnComplete,
};
