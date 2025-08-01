const express = require("express");
const router = express.Router();
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const streamifier = require("streamifier");

const cloudinary = require("../utils/cloudinary");
const Question = require("../models/Question");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadStreamAsync = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });

router.post("/upload", upload.any(), async (req, res) => {
  try {
    const {
      questionType,
      difficulty,
      category,
      topic,
      group,
      blockNumber,
      correctAnswer,
      numericAnswer,
    } = req.body;

    // Basic validation
    if (!topic || topic.trim() === "") {
      return res.status(400).json({ message: "Mövzu (topic) boş ola bilməz." });
    }

    const parsedBlock = parseInt(blockNumber);
    if (isNaN(parsedBlock)) {
      return res.status(400).json({ message: "Blok nömrəsi düzgün deyil." });
    }

    if (!["test", "open"].includes(questionType)) {
      return res.status(400).json({ message: "Yanlış sual tipi!" });
    }

    const questionFile = req.files.find((f) => f.fieldname === "questionImage");
    if (!questionFile) {
      return res.status(400).json({ message: "Sual şəkli yoxdur!" });
    }

    const uploadedQuestion = await uploadStreamAsync(questionFile.buffer, {
      folder: "questions",
      public_id: `q-${uuidv4()}`,
    });

    let answerUrls = {};
    if (questionType === "test") {
      const variantKeys = ["A", "B", "C", "D", "E"];
      for (const key of variantKeys) {
        const file = req.files.find((f) => f.fieldname === `answerImage_${key}`);
        if (!file) {
          return res.status(400).json({ message: `Variant ${key} şəkli yoxdur!` });
        }
        const uploaded = await uploadStreamAsync(file.buffer, {
          folder: "answers",
          public_id: `a-${uuidv4()}-${key}`,
        });
        answerUrls[key] = uploaded.secure_url;
      }
    }

    const newQuestion = new Question({
      imageUrl: uploadedQuestion.secure_url,
      answerImageUrl:
        questionType === "test" ? answerUrls[correctAnswer] : numericAnswer,
      type: group === "örnek" ? "example" : "homework",
      difficulty: convertDifficulty(difficulty),
      category: convertCategory(category),
      topic: topic.trim(),
      blockNumber: parsedBlock,
    });

    await newQuestion.save();
    res.json({ message: "✅ Sual əlavə edildi" });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ message: "Server xətası", error: err.message });
  }
});

function convertDifficulty(val) {
  const map = {
    kolay: "easy",
    orta: "medium",
    çətin: "hard",
    zor: "hard",
    hard: "hard",
    medium: "medium",
    easy: "easy",
  };
  return map[val] || "easy";
}

function convertCategory(val) {
  const map = {
    sayisal: "math",
    riyaziyyat: "math",
    geometri: "geometry",
    math: "math",
    geometry: "geometry",
  };
  return map[val] || "math";
}

// GET - Bütün sualları siyahıla
router.get("/", async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 }); // Sonuncular əvvəl
    res.json(questions);
  } catch (err) {
    console.error("❌ Sualları çəkmək mümkün olmadı:", err);
    res.status(500).json({ message: "Server xətası" });
  }
});


module.exports = router;
