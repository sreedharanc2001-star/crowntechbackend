const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (normalizedPassword.length < 6) {
      return res.status(400).json({ message: "Password must be 6+ characters" });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(normalizedPassword, 10);
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashed,
      phone,
      role: "user",
    });

    const token = signToken(user);
    return res.json({
      message: "Registration successful",
      token,
      user,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already registered" });
    }
    if (err.message === "JWT_SECRET is not set") {
      return res.status(500).json({ message: "Server misconfigured: JWT secret missing" });
    }
    return res.status(500).json({ message: "Registration failed" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(normalizedPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);
    return res.json({
      message: "Login successful",
      token,
      user,
    });
  } catch (err) {
    if (err.message === "JWT_SECRET is not set") {
      return res.status(500).json({ message: "Server misconfigured: JWT secret missing" });
    }
    return res.status(500).json({ message: "Login failed" });
  }
};

module.exports = { register, login };
