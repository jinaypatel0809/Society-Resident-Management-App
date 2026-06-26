const User          = require("../models/User");
const { generateToken } = require("../config/jwt");

// ─────────────────────────────────────────────
// POST /api/auth/user/signup
// ─────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    const { name, email, phone, flatNumber, wing, floor, ownerType, password } = req.body;

    // Required fields check
    if (!name || !email || !phone || !flatNumber || !password) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    // ── Duplicate email check ──────────────────────────────────────
    // A user must register with a UNIQUE email.
    // The same email cannot be used twice (even across admin & user).
    const existingUser  = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: "This email is already registered. Please sign in." });
    }

    // Also prevent using an email that belongs to an admin account
    const Admin = require("../models/Admin");
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existingAdmin) {
      return res.status(409).json({ message: "This email is already used for an admin account." });
    }

    // Password length
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    // Create user (password hashed via pre-save hook)
    const user = await User.create({
      name, email, phone, flatNumber, wing, floor,
      ownerType: ownerType || "owner",
      password,
    });

    // Build safe user object (no password)
    const safeUser = {
      id:         user._id,
      name:       user.name,
      email:      user.email,
      phone:      user.phone,
      flatNumber: user.flatNumber,
      wing:       user.wing,
      floor:      user.floor,
      ownerType:  user.ownerType,
    };

    const token = generateToken({ id: user._id, role: "user" });

    return res.status(201).json({
      message: "Registration successful!",
      user:    safeUser,
      token,
    });
  } catch (err) {
    console.error("User signup error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/user/signin
// ─────────────────────────────────────────────
const signin = async (req, res) => {
  try {
    const { email, flatNumber, password } = req.body;

    if (!email || !flatNumber || !password) {
      return res.status(400).json({ message: "Email, flat number and password are required." });
    }

    // Find user and explicitly select password (hidden by default)
    const user = await User.findOne({
      email:      email.toLowerCase().trim(),
      flatNumber: flatNumber.trim(),
    }).select("+password");

    // ── Key rule: ONLY the registered email can log in ─────────────
    if (!user) {
      return res.status(401).json({
        message: "No account found with this email and flat number combination.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated. Contact admin." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password. Please try again." });
    }

    const safeUser = {
      id:         user._id,
      name:       user.name,
      email:      user.email,
      phone:      user.phone,
      flatNumber: user.flatNumber,
      wing:       user.wing,
      floor:      user.floor,
      ownerType:  user.ownerType,
    };

    const token = generateToken({ id: user._id, role: "user" });

    return res.status(200).json({
      message: `Welcome back, ${user.name}!`,
      user:    safeUser,
      token,
    });
  } catch (err) {
    console.error("User signin error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ─────────────────────────────────────────────
// GET /api/auth/user/me  (protected)
// ─────────────────────────────────────────────
const getMe = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

module.exports = { signup, signin, getMe };
