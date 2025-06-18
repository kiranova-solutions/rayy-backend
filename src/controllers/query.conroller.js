const Query = require("../models/query.model");
const User = require("../models/user.model");

// Create a new query
const createQuery = async (req, res) => {
  try {
    const { reason, description, images, userId, userType } = req.body;

    if (!reason || !description || !userId || !userType) {
      return res.status(400).json({
        success: false,
        message: "Reason, description, userId, and userType are required",
      });
    }

    const query = new Query({
      reason,
      description,
      images: images || [],
      userId,
      userType,
    });

    await query.save();
    res.status(201).json({ success: true, query });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all queries
// Get all queries with user data populated
const getQueries = async (req, res) => {
  try {
    const queries = await Query.find()
      .populate("userId") // Populating the 'userId' field with selected user fields
      .exec();

    res.status(200).json({ success: true, queries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single query by ID
const getQueryById = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) {
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    }
    res.status(200).json({ success: true, query });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a query by ID
const updateQuery = async (req, res) => {
  try {
    const { reason, description, images, userId, userType } = req.body;

    const updatedQuery = await Query.findByIdAndUpdate(
      req.params.id,
      { reason, description, images, userId, userType },
      { new: true, runValidators: true }
    );

    if (!updatedQuery) {
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    }

    res.status(200).json({ success: true, query: updatedQuery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a query by ID
const deleteQuery = async (req, res) => {
  try {
    const query = await Query.findByIdAndDelete(req.params.id);
    if (!query) {
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Query deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Controller to update the query status
const updateQueryStatus = async (req, res) => {
  try {
    // Extract the queryId and isResolved from the request body
    const { queryId, isResolved } = req.body;

    // Validate input
    if (!queryId || typeof isResolved !== "boolean") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid input data" });
    }

    // Find the query by its ID and update the status
    const updatedQuery = await Query.findByIdAndUpdate(
      queryId, // The query ID to search for
      { isResolved }, // The new status to set
      { new: true } // Return the updated document
    );

    // Check if the query was found and updated
    if (!updatedQuery) {
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    }

    // Return the updated query in the response
    return res.status(200).json({
      success: true,

      message: "Query status updated successfully",
      updatedQuery,
    });
  } catch (error) {
    console.error("Error updating query status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating query status",
      error: error.message,
    });
  }
};

module.exports = {
  createQuery,
  getQueries,
  getQueryById,
  updateQuery,
  deleteQuery,
  updateQueryStatus,
};
