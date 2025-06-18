const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  activeToken: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["Vendor", "Staff", "Owner", "Client"],
    required: true,
  },
});

const Token = mongoose.model("Token", tokenSchema);

module.exports = Token;
