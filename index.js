const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("./models/User");
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB bağlantısı
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB bağlantısı uğurla quruldu"))
  .catch((err) => console.error("❌ MongoDB bağlantısı xətası:", err));

// 🔐 Middleware – Token yoxla
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "Token təqdim edilməyib" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: "Token etibarsız və ya vaxtı keçib" });
  }
};

// 👮‍♂️ Middleware – Adminmi?
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Yalnız admin icazəlidir" });
  }
  next();
};

// Admin varsa yaratma, yoxdursa yarat
async function createAdmin() {
  const exists = await User.findOne({ username: "admin" });
  if (exists) return console.log("ℹ️ Admin artıq mövcuddur");

  const hashed = await bcrypt.hash("admin123", 10);
  const admin = new User({
    firstName: "Admin",
    lastName: "User",
    username: "admin",
    password: hashed,
    group: "-",
    role: "admin",
  });

  await admin.save();
  console.log("✅ Admin yaradıldı: admin / admin123");
}
createAdmin();

// Register
app.post("/api/register", async (req, res) => {
  const { firstName, lastName, username, password, group } = req.body;
  try {
    const exists = await User.findOne({ username });
    if (exists)
      return res.status(400).json({ message: "Bu istifadəçi adı artıq mövcuddur" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      username,
      password: hashed,
      group,
      role: "user",
    });
    await newUser.save();
    res.json({ message: "Qeydiyyat uğurla tamamlandı" });
  } catch (err) {
    res.status(500).json({ message: "Server xətası" });
  }
});

// Admin register
app.post("/api/admin-register", async (req, res) => {
  const { firstName, lastName, username, password } = req.body;
  try {
    const exists = await User.findOne({ username });
    if (exists)
      return res.status(400).json({ message: "Bu istifadəçi adı mövcuddur" });

    const hashed = await bcrypt.hash(password, 10);
    const newAdmin = new User({
      firstName,
      lastName,
      username,
      password: hashed,
      group: "-",
      role: "admin",
    });

    await newAdmin.save();
    res.json({ message: "Admin qeydiyyatı uğurla tamamlandı" });
  } catch (err) {
    res.status(500).json({ message: "Xəta baş verdi" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "İstifadəçi tapılmadı" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Şifrə yanlışdır" });

    const token = jwt.sign(
      {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        group: user.group,
        role: user.role,
        id: user._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server xətası" });
  }
});

// Profile (auth)
app.get("/api/profile", authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Bütün istifadəçiləri göstər (admin only)
app.get("/api/users", authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server xətası" });
  }
});

// İstifadəçi sil (admin only)
app.delete("/api/users/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });

    res.json({ message: "İstifadəçi silindi" });
  } catch (err) {
    res.status(500).json({ message: "Server xətası" });
  }
});

// Qrup dəyiş (admin only)
app.put("/api/users/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const { group } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { group },
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });

    res.json({ message: "Qrup yeniləndi", user: updated });
  } catch (err) {
    res.status(500).json({ message: "Xəta baş verdi" });
  }
});

app.listen(5000, () => {
  console.log("🚀 Backend çalışır: http://localhost:5000");
});
