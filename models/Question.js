// models/Question.js
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true }, // Sual şəkli
    answerImageUrl: { type: String, required: false }, // Açıq cavab və ya doğru variant şəkli
    answerImage_A: { type: String },
    answerImage_B: { type: String },
    answerImage_C: { type: String },
    answerImage_D: { type: String },
    answerImage_E: { type: String },
    type: {
      type: String,
      enum: ["example", "homework"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    category: {
      type: String,
      enum: ["math", "geometry"],
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    blockNumber: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);
