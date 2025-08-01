const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema({
  number: { type: Number, required: true },  // məsələn: 1, 2, 3
  topic: { type: String, required: true },   // məsələn: "Ədədlər"
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Block", blockSchema);
