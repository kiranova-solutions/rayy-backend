const Otp = require("../models/otp.model");
const Staff = require("../models/staff.model");

const Token = require("../models/token.model");
const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const { sendSms } = require("../config/enableX");

require("dotenv").config();

const sendMobileOtp = async (phone) => {
  let staff = "";
  staff = await Staff.findOne({ phone: phone });

  if (!staff) {
    throw new Error("User does not exist.");
  }

  const staffId = staff?._id;

  // Generate OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Send and save OTP
  try {
    const response = await sendSms(`+91${phone}`, otp);

    console.log("response: ", response);
    const sentOtp = new Otp({ otp, userId: staffId, role: "Staff" });

    console.log("sentOtp: ", sentOtp);
    await sentOtp.save();

    return {
      success: true,
      message: "OTP sent successfully",
      data: staff,
    };
  } catch (error) {
    console.log("error in sending email", error, error.message);
    throw new Error("Error sending email");
  }
};

const verifyMobileOtp = async (otp, userId) => {
  // Check OTP
  const checkOtp = await Otp.findOne({ userId, role: "Staff" })
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

  let staff = "";
  // Check user existence
  staff = await Staff.findOne({ _id: userId });

  if (!staff) {
    throw new Error("User does not exist");
  }

  const token = jwt.sign({ userId: staff._id }, process.env.TOKEN_SECRET, {
    expiresIn: "30d",
  });

  const checkExistingSession = await Token.findOne({ userId: staff._id });

  if (checkExistingSession) {
    await Token.findByIdAndUpdate(checkExistingSession._id, {
      activeToken: token,
    });
  } else {
    const createSession = new Token({
      activeToken: token,
      userId,
      role: "Staff",
    });
    await createSession.save();
  }

  return {
    success: true,
    message: "User verified successfully",
    data: { user: staff, token },
  };
};

module.exports = {
  sendMobileOtp,
  verifyMobileOtp,
  sendSms,
};
