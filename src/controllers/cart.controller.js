const Cart = require("../models/cart.model");
const Service = require("../models/service.model");
const Staff = require("../models/staff.model");
const StaffSchedule = require("../models/staff.schedule.model");

// Create Cart
const createCart = async (req, res) => {
  try {
    const { serviceId, appointmentDate, appointmentTime, staffId } = req.body;

    if (!serviceId || !appointmentDate || !appointmentTime) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    // Parse startDateTime
    const startDateTime = new Date(`${appointmentDate} ${appointmentTime}`);

    // Fetch service duration
    const service = await Service.findById(serviceId);
    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found." });
    }

    // Extract duration and convert to minutes
    const durationMatch = service.duration.match(/(\d+)\s*(minutes?|hours?)/i);
    if (!durationMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid service duration format." });
    }

    const durationValue = parseInt(durationMatch[1]);
    const durationUnit = durationMatch[2].toLowerCase();

    // Calculate endDateTime
    let endDateTime = new Date(startDateTime);
    if (durationUnit.includes("hour")) {
      endDateTime.setHours(endDateTime.getHours() + durationValue);
    } else {
      endDateTime.setMinutes(endDateTime.getMinutes() + durationValue);
    }

    console.log("startDateTime:", startDateTime);
    console.log("endDateTime:", endDateTime);

    // Check for scheduling conflicts
    const existingSchedule = await StaffSchedule.findOne({
      staffId,
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
          existingSchedule.status === "Blocked"
            ? "The staff member is already blocked during this time. Please select another staff."
            : "The staff member is already scheduled for an appointment during this time. Please select another staff.",
      });
    }

    // Proceed with cart creation
    const cart = new Cart({ ...req.body, userId: req.userId });
    await cart.save();

    return res.status(201).json({ success: true, cart });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error." });
  }
};

// Get All Carts for the logged-in user
const getAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find({ userId: req.userId });
    res.status(200).json({ success: true, carts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Cart by ID (only if it belongs to the logged-in user)
const getCartById = async (req, res) => {
  try {
    const cart = await Cart.findOne({ _id: req.params.id, userId: req.userId });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Cart (only if it belongs to the logged-in user)
const updateCart = async (req, res) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete Cart (only if it belongs to the logged-in user)
const deleteCart = async (req, res) => {
  try {
    const cart = await Cart.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Cart deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Cart by User ID
const getCartByUserId = async (req, res) => {
  try {
    const userId = req.userId;
    console.log("userId: ", userId);

    const carts = await Cart.find({ userId });

    if (!carts.length) {
      return res
        .status(404)
        .json({ success: false, message: "No carts found for this user." });
    }

    const populatedCarts = await Promise.all(
      carts.map(async (cart) => {
        const service = await Service.findById(cart.serviceId);

        const products = service?.product?.filter((p) =>
          cart.productId.includes(p._id.toString())
        );

        const staff = await Staff.findById(cart.staffId);

        // ✅ FIX: Use cart.clubTogetherWith instead of service.clubTogetherWith
        let clubWithTogetherServices = [];
        if (
          Array.isArray(cart?.clubTogetherWith) &&
          cart.clubTogetherWith.length
        ) {
          clubWithTogetherServices = await Service.find({
            _id: { $in: cart.clubTogetherWith },
          }).select("_id name price");
        }

        return {
          ...cart.toObject(),
          service,
          products,
          staff,
          clubWithTogetherServices,
        };
      })
    );

    res.status(200).json({ success: true, carts: populatedCarts });
  } catch (error) {
    console.log("Error: --", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCart,
  getAllCarts,
  getCartById,
  updateCart,
  deleteCart,
  getCartByUserId,
};
