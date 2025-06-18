const Rating = require("../models/rating.model");
const Store = require("../models/store.model");
const Service = require("../models/service.model");
const {
  sendNotificationRatingSubmit,
} = require("../services/notification.service");

// Create Rating
const createRating = async (req, res) => {
  try {
    const {
      appointmentId,
      staffId,
      serviceId,
      serviceRating,
      productRating,
      staffRating,
      ambienceRating,
      overallRating,
      images,
      comments,
    } = req.body;

    console.log("req.body: ", req.body);

    // 1. Fetch the service to get the userId and storeId
    const service = await Service.findById(serviceId);
    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    const { userId, storeId } = service;

    const store = await Store.findById(storeId);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Store not found for this vendor" });
    }

    // 2. Create the rating
    const rating = new Rating({
      clientId: req.userId,
      vendorId: userId,
      appointmentId,
      storeId,
      serviceId,
      staffId: staffId || userId,
      serviceRating,
      productRating,
      staffRating,
      ambienceRating,
      overallRating,
      images,
      comments,
    });

    await rating.save();

    // 3. Get all ratings for this store
    const allStoreRatings = await Rating.find({ storeId });

    // 4. Calculate the average overallRating
    const totalOverall = allStoreRatings.reduce(
      (acc, curr) => acc + curr.overallRating,
      0
    );
    const avgOverallRating = totalOverall / allStoreRatings.length;

    await sendNotificationRatingSubmit({
      serviceId,
      service,
      storeId,
      clientId: req.userId,
      userId: store.userId,
    });
    // 5. Update the store's rating
    store.rating = parseFloat(avgOverallRating.toFixed(1)); // one decimal precision
    await store.save();

    res.status(201).json({ success: true, rating });
  } catch (error) {
    console.log("Error: ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all ratings (optional filtering by vendor, client, or appointment)
const getRatings = async (req, res) => {
  try {
    const filters = {};
    if (req.query.clientId) filters.clientId = req.query.clientId;
    if (req.query.vendorId) filters.vendorId = req.query.vendorId;
    if (req.query.appointmentId)
      filters.appointmentId = req.query.appointmentId;

    const ratings = await Rating.find(filters);
    res.status(200).json({ success: true, ratings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get rating by ID
const getRatingById = async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);
    if (!rating) {
      return res
        .status(404)
        .json({ success: false, message: "Rating not found" });
    }
    res.status(200).json({ success: true, rating });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update rating
const updateRating = async (req, res) => {
  try {
    const rating = await Rating.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!rating) {
      return res
        .status(404)
        .json({ success: false, message: "Rating not found" });
    }
    res.status(200).json({ success: true, rating });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete rating
const deleteRating = async (req, res) => {
  try {
    const rating = await Rating.findByIdAndDelete(req.params.id);
    if (!rating) {
      return res
        .status(404)
        .json({ success: false, message: "Rating not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Rating deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRatingsByVendorId = async (req, res) => {
  try {
    const vendorId = req.userId; // Assuming vendorId is stored in req.userId

    if (!vendorId) {
      return res
        .status(400)
        .json({ success: false, message: "Vendor ID is required" });
    }

    console.log("vendorId: ", vendorId);

    // Populate `serviceId` to get service details and `clientId` to get user details
    const ratings = await Rating.find({ vendorId })
      .populate("serviceId") // Adjust fields as necessary
      .populate("clientId"); // Adjust fields as necessary

    console.log("ratings: ", ratings);

    res.status(200).json({ success: true, ratings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAverageRatingByVendorId = async (req, res) => {
  try {
    const vendorId = req.userId; // Assuming vendorId is stored in req.userId

    if (!vendorId) {
      return res
        .status(400)
        .json({ success: false, message: "Vendor ID is required" });
    }

    console.log("vendorId: ", vendorId);

    // Calculate the average overallRating
    const result = await Rating.aggregate([
      { $match: { vendorId } }, // Filter by vendorId
      {
        $group: {
          _id: null, // Group all documents
          averageOverallRating: { $avg: "$overallRating" }, // Calculate average
        },
      },
    ]);

    // Extract the average rating or default to 0 if no ratings exist
    const averageRating =
      result.length > 0 ? result[0].averageOverallRating : 0;

    res
      .status(200)
      .json({ success: true, averageOverallRating: averageRating });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRatingsByStoreId = async (req, res) => {
  try {
    const { storeId } = req.params; // Get storeId from request parameters

    if (!storeId) {
      return res
        .status(400)
        .json({ success: false, message: "Store ID is required" });
    }

    console.log("storeId: ", storeId);

    // Fetch ratings related to the storeId and populate necessary fields
    const ratings = await Rating.find({ storeId })
      .populate("serviceId") // Populate service details
      .populate("clientId"); // Populate client details

    console.log("ratings: ", ratings);

    res.status(200).json({ success: true, ratings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRating,
  getRatings,
  getRatingById,
  updateRating,
  deleteRating,
  getRatingsByVendorId,
  getAverageRatingByVendorId,
  getRatingsByStoreId,
};
