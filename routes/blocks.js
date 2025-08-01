const express = require("express");
const router = express.Router();
const Block = require("../models/Block");

router.post("/create", async (req, res) => {
  try {
    const { number, topic } = req.body;
    const newBlock = new Block({ number, topic });
    await newBlock.save();
    res.json({ message: "✅ Blok əlavə edildi", block: newBlock });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Blok yaratmaqda xəta" });
  }
});

module.exports = router;
