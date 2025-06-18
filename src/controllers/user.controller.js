const userService = require("../services/user.service");
const User = require("../models/user.model");
const Token = require("../models/token.model");
const Otp = require("../models/otp.model");
const Store = require("../models/store.model");
const Service = require("../models/service.model");
const Appointment = require("../models/appointment.model");
const Staff = require("../models/staff.model");

const sendMobileOtp = async (req, res) => {
  try {
    const { phone, role } = req.body;

    console.log("sendMobileOtp: ", phone, role);

    const response = await userService.sendMobileOtp(phone, role);

    res.status(200).json({ success: true, response });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

const verifyMobileOtp = async (req, res) => {
  try {
    const { otp, userId, role } = req.body;
    if (!otp || !userId || !role) {
      return res.status(400).send({
        success: false,
        message: "OTP, role and userId are required",
      });
    }

    console.log("verifyMobileOtp: ", otp, userId, role);

    const response = await userService.verifyMobileOtp(otp, userId, role);
    res.status(200).send(response);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { email, type } = req.body;
    console.log("sendOtp: ", email, type);
    const response = await userService.sendOtp(email, type);

    res.status(200).json({ success: true, response });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp, userId, type } = req.body;
    if (!otp || !userId || !type) {
      return res.status(400).send({
        success: false,
        message: "OTP, role and userId are required",
      });
    }

    console.log("verifyOtp: ", otp, userId, type);

    const response = await userService.verifyOtp(otp, userId, type);
    res.status(200).send(response);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// Create User
const createUser = async (req, res) => {
  try {
    const { email, phone, inputType, type } = req.body;

    if (inputType === "email") {
      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email already exists" });
      }
    } else if (inputType === "phone") {
      // Check if phone already exists
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Phone number already exists" });
      }
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid input type" });
    }

    // Create new user
    const user = new User({ email, phone, type });
    await user.save();

    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Create User by admin
const createAdminUsers = async (req, res) => {
  try {
    const {
      type,
      email,
      companyName,
      fullName,
      phone,
      noOfStaff,
      location,
      categories,
      servicingTo,
      gstNumber,
    } = req.body;

    if (
      !type ||
      !email ||
      !companyName ||
      !fullName ||
      !phone ||
      !noOfStaff ||
      !location ||
      !categories ||
      !servicingTo ||
      !gstNumber
    ) {
      return res.status(400).send({ message: "All input fields are required" });
    }
    if (email) {
      // Check if email already exists
      const existingUser = await User.findOne({ email, type: "Vendor" });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email already exists" });
      }
    }
    if (companyName) {
      // Check if phone already exists
      const existingUser = await User.findOne({ companyName, type: "Vendor" });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Company Name already exists" });
      }
    }
    if (phone) {
      // Check if phone already exists
      const existingUser = await User.findOne({ phone, type: "Vendor" });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Phone number already exists" });
      }
    }
    if (gstNumber) {
      // Check if phone already exists
      const existingUser = await User.findOne({ gstNumber });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "GST Number already exists" });
      }
    }

    // Create new user
    const user = new User({
      type,
      email,
      companyName,
      fullName,
      phone,
      noOfStaff,
      location,
      categories,
      servicingTo,
      gstNumber,
    });
    await user.save();

    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Create client by admin
const createClientByAdmin = async (req, res) => {
  try {
    const {
      type,
      pronoun,
      fullName,
      email,
      phone,
      age,
      gender,
      location,
      latitude,
      longitude,
    } = req.body;

    if (
      !type ||
      !pronoun ||
      !fullName ||
      !email ||
      !phone ||
      !age ||
      !gender ||
      !location
    ) {
      return res.status(400).send({ message: "All input fields are required" });
    }
    if (email) {
      // Check if email already exists
      const existingUser = await User.findOne({ email, type: "Client" });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email already exists" });
      }
    }
    if (fullName) {
      // Check if phone already exists
      const existingUser = await User.findOne({ fullName, type: "Client" });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Client Name already exists" });
      }
    }
    if (phone) {
      // Check if phone already exists
      const existingUser = await User.findOne({ phone, type: "Client" });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Phone number already exists" });
      }
    }

    // Create new user
    const user = new User({
      type,
      pronoun,
      fullName,
      email,
      phone,
      age,
      gender,
      location,
      latitude,
      longitude,
    });
    await user.save();

    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All Users
const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All admin Users
const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find({ type: "Vendor" });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClientsByAdmin = async (req, res) => {
  try {
    const users = await User.find({ type: "Client" });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get admin client by ID
const getAdminClientById = async (req, res) => {
  try {
    console.log("userId: ", req.params.id);
    const user = await User.findById(req.params.id);
    console.log("userData: ", user);
    if (!user) {
      return res.status(404).json({ message: "client not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get User by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get admin User by ID
const getAdminUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update User
const updateUser = async (req, res) => {
  try {
    const userId = req.userId; // Get userId from middleware
    const { phone, gstNumber, email } = req.body;

    // Check if email already exists (excluding the current user)
    if (email) {
      const existingEmailUser = await User.findOne({
        email,
        _id: { $ne: userId },
      });
      if (existingEmailUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Check if phone already exists (excluding the current user)
    if (phone) {
      const existingPhoneUser = await User.findOne({
        phone,
        _id: { $ne: userId },
      });
      if (existingPhoneUser) {
        return res.status(400).json({
          success: false,
          message: "Phone number already exists",
        });
      }
    }

    // Check if gstNumber already exists (excluding the current user)
    if (gstNumber) {
      const existingGSTUser = await User.findOne({
        gstNumber,
        _id: { $ne: userId },
      });
      if (existingGSTUser) {
        return res.status(400).json({
          success: false,
          message: "GST Number already exists",
        });
      }
    }

    const user = await User.findByIdAndUpdate(userId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateProfileImage = async (req, res) => {
  try {
    const userId = req.userId; // Get userId from middleware
    const { profileImage } = req.body; // URL of the uploaded image

    console.log("userId: ", userId, profileImage);

    if (!profileImage) {
      return res.status(400).json({
        success: false,
        message: "Profile image URL is required",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { profileImage },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating profile image:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteUser = async (req, res) => {
  const userId = req.userId;

  try {
    // Delete user from User collection
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Delete associated tokens
    await Token.deleteMany({ userId });

    // Delete associated OTPs
    await Otp.deleteMany({ userId });

    // Delete associated store
    const store = await Store.findOneAndDelete({ userId });
    if (store) {
      // Delete associated services linked to the deleted store
      await Service.deleteMany({ storeId: store._id });
    }

    // Delete associated services if any exist independently
    await Service.deleteMany({ userId });

    // Delete associated staff
    await Staff.deleteMany({ createdBy: userId });

    // Delete associated appointments
    await Appointment.deleteMany({
      $or: [{ createdBy: userId }, { vendorId: userId }],
    });

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteUserByAdmin = async (req, res) => {
  const { userId } = req.params;

  try {
    // Delete user from User collection
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Delete associated tokens
    await Token.deleteMany({ userId });

    // Delete associated OTPs
    await Otp.deleteMany({ userId });

    // Delete associated store
    const store = await Store.findOneAndDelete({ userId });
    if (store) {
      // Delete associated services linked to the deleted store
      await Service.deleteMany({ storeId: store._id });
    }

    // Delete associated services if any exist independently
    await Service.deleteMany({ userId });

    // Delete associated staff
    await Staff.deleteMany({ createdBy: userId });

    // Delete associated appointments
    await Appointment.deleteMany({
      $or: [{ createdBy: userId }, { vendorId: userId }],
    });

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// delete client data by admin
const deleteClientByAdmin = async (req, res) => {
  const userId = req.params.id;
  console.log("userid for client deletion: ", userId);
  try {
    // Delete user from User collection
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Delete associated appointments
    await Appointment.deleteMany({
      $or: [{ createdBy: userId }, { vendorId: userId }],
    });

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// update client by admin panel
const updateClientByAdmin = async (req, res) => {
  try {
    const userId = req.params.id; // Get userId from params
    const {
      type,
      pronoun,
      fullName,
      phone,
      age,
      gender,
      email,
      location,
      latitude,
      longitude,
    } = req.body;

    console.log("client id : ", userId);
    // check if client is exist or not

    const isClientExist = await User.findById(userId);
    if (!isClientExist) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }
    // Check if email already exists (excluding the current user)
    if (email) {
      const existingEmailUser = await User.findOne({
        email,
        type: "Client",
        _id: { $ne: userId },
      });
      if (existingEmailUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Check if phone already exists (excluding the current user)
    if (phone) {
      const existingPhoneUser = await User.findOne({
        phone,
        type: "Client",
        _id: { $ne: userId },
      });
      if (existingPhoneUser) {
        return res.status(400).json({
          success: false,
          message: "Phone number already exists",
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        type,
        pronoun,
        fullName,
        phone,
        age,
        gender,
        email,
        location,
        latitude,
        longitude,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params; // Get userId from middleware
    const { phone, gstNumber, email  } = req.body;

    // Check if email already exists (excluding the current user)
    if (email) {
      const existingEmailUser = await User.findOne({
        email,
        type: "Vendor",
        _id: { $ne: userId },
      });
      if (existingEmailUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Check if phone already exists (excluding the current user)
    if (phone) {
      const existingPhoneUser = await User.findOne({
        phone,
        type: "Vendor",
        _id: { $ne: userId },
      });
      if (existingPhoneUser) {
        return res.status(400).json({
          success: false,
          message: "Phone number already exists",
        });
      }
    }

    // Check if gstNumber already exists (excluding the current user)
    if (gstNumber) {
      const existingGSTUser = await User.findOne({
        gstNumber,
        type: "Vendor",
        _id: { $ne: userId },
      });
      if (existingGSTUser) {
        return res.status(400).json({
          success: false,
          message: "GST Number already exists",
        });
      }
    }

    const user = await User.findByIdAndUpdate(userId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update FCM Token
const updateFcmToken = async (req, res) => {
  try {
    const userId = req.userId; // Get userId from middleware
    const { fcmToken, role } = req.body;

    // if (!fcmToken) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "FCM Token is required",
    //   });
    // }
    console.log("role----------", { role, body: req.body });
    let user = null;
    if (role == "Staff") {
      user = await Staff.findByIdAndUpdate(userId, { fcmToken }, { new: true });
    } else {
      user = await User.findByIdAndUpdate(userId, { fcmToken }, { new: true });
    }

    if (!user) {
      // If user is not found, check if it's a staff member
      console.log("User not found, checking staff member", { user, userId });
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "FCM Token updated successfully",
    });
  } catch (error) {
    console.log('"Error updating FCM token:", error);', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  createUser,
  getUsers,
  getAdminUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfileImage,
  sendMobileOtp,
  verifyMobileOtp,
  createAdminUsers,
  getAdminUserById,
  deleteUserByAdmin,
  updateUserByAdmin,
  updateFcmToken,
  getClientsByAdmin,
  createClientByAdmin,
  getAdminClientById,
  updateClientByAdmin,
  deleteClientByAdmin,
};
