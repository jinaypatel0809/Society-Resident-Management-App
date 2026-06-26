const User  = require("../models/User");
const Admin = require("../models/Admin");
const { generateToken } = require("../config/jwt");

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/signin
// Smart unified signin — checks both Admin and User collections
// Returns role in response so client can redirect correctly
// ─────────────────────────────────────────────────────────────────
const unifiedSignin = async (req, res) => {
  try {
    const { email, password, flatNumber } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── 1. Check Admin collection first ──────────────────────────
    const admin = await Admin.findOne({ email: normalizedEmail }).select("+password");

    if (admin) {
      if (!admin.isActive) {
        return res.status(403).json({ message: "This admin account has been deactivated." });
      }

      const isMatch = await admin.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect password. Please try again." });
      }

      const safeAdmin = {
        id:             admin._id,
        name:           `${admin.firstName} ${admin.lastName}`,
        firstName:      admin.firstName,
        lastName:       admin.lastName,
        email:          admin.email,
        phone:          admin.phone,
        societyName:    admin.societyName,
        societyAddress: admin.societyAddress,
        totalFlats:     admin.totalFlats,
      };

      const token = generateToken({ id: admin._id, role: "admin" });

      return res.status(200).json({
        message: `Welcome back, ${admin.firstName}!`,
        role:    "admin",
        admin:   safeAdmin,
        token,
      });
    }

    // ── 2. Check User collection ──────────────────────────────────
    // User login requires flatNumber too
    if (!flatNumber) {
      // Email exists but not as admin → must be user → flatNumber needed
      const userExists = await User.findOne({ email: normalizedEmail });
      if (userExists) {
        return res.status(400).json({ message: "Flat number is required for resident login." });
      }
      return res.status(401).json({ message: "No account found with this email." });
    }

    const user = await User.findOne({
      email:      normalizedEmail,
      flatNumber: flatNumber.trim(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "No account found with this email and flat number combination." });
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
      role:    "user",
      user:    safeUser,
      token,
    });

  } catch (err) {
    console.error("Unified signin error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

module.exports = { unifiedSignin };
