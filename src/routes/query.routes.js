const express = require("express");
const router = express.Router();
const {
  createQuery,
  getQueries,
  getQueryById,
  updateQuery,
  deleteQuery,
  updateQueryStatus,
} = require("../controllers/query.conroller");
const authMiddleware = require("../middlewares/authMiddleware");

// Create a new query
router.post("/", authMiddleware, createQuery);

// Get all queries
router.get("/", getQueries);

// Get a single query by ID
router.get("/:id", authMiddleware, getQueryById);

// Update a query by ID
router.put("/status", updateQueryStatus);
router.put("/:id", authMiddleware, updateQuery);

// Delete a query by ID
router.delete("/:id", authMiddleware, deleteQuery);

module.exports = router;
