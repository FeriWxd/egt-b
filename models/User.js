const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  username:  { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  group:     { type: String, required: true },
  role:      { type: String, default: "user" } // 👈 admin üçün ayrıca role əlavə etdik
});

module.exports = mongoose.model("User", userSchema);
