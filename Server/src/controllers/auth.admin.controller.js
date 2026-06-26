const Admin         = require("../models/Admin");
const { generateToken } = require("../config/jwt");

// ─────────────────────────────────────────────
// POST /api/auth/admin/signup
// ─────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, societyName, societyAddress, totalFlats, password } = req.body;

    // Required fields
    if (!firstName || !lastName || !email || !phone || !societyName || !societyAddress || !totalFlats || !password) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    // ── Duplicate email check ──────────────────────────────────────
    // Admin must register with a unique email.
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existingAdmin) {
      return res.status(409).json({ message: "This email is already registered as admin. Please sign in." });
    }

    // Also prevent using an email that belongs to a resident account
    const User = require("../models/User");
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: "This email is already used for a resident account." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const admin = await Admin.create({
      firstName, lastName, email, phone,
      societyName, societyAddress, totalFlats,
      password,
    });

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

    return res.status(201).json({
      message: "Admin account created successfully!",
      admin:   safeAdmin,
      token,
    });
  } catch (err) {
    console.error("Admin signup error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/admin/signin
// ─────────────────────────────────────────────
const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // ── Key rule: ONLY the registered admin email can log in ───────
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select("+password");

    if (!admin) {
      return res.status(401).json({
        message: "No admin account found with this email. Please register first.",
      });
    }

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
      admin:   safeAdmin,
      token,
    });
  } catch (err) {
    console.error("Admin signin error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ─────────────────────────────────────────────
// GET /api/auth/admin/me  (protected)
// ─────────────────────────────────────────────
const getMe = async (req, res) => {
  return res.status(200).json({ admin: req.user });
};

// ─────────────────────────────────────────────
// PUT /api/auth/admin/profile  (protected) — Settings: update profile info
// ─────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, societyName, societyAddress, totalFlats } = req.body;

    if (!firstName?.trim() || !lastName?.trim() || !phone?.trim() ||
        !societyName?.trim() || !societyAddress?.trim() || !totalFlats) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    const admin = await Admin.findById(req.user._id);
    if (!admin) return res.status(404).json({ message: "Admin not found." });

    admin.firstName      = firstName.trim();
    admin.lastName       = lastName.trim();
    admin.phone          = phone.trim();
    admin.societyName    = societyName.trim();
    admin.societyAddress = societyAddress.trim();
    admin.totalFlats     = totalFlats;
    await admin.save();

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

    res.json({ message: "Profile updated successfully!", admin: safeAdmin });
  } catch (err) {
    console.error("Admin update profile error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ─────────────────────────────────────────────
// PUT /api/auth/admin/change-password  (protected) — Settings: change password
// ─────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters." });
    }

    const admin = await Admin.findById(req.user._id).select("+password");
    if (!admin) return res.status(404).json({ message: "Admin not found." });

    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    admin.password = newPassword; // pre("save") hook re-hashes it
    await admin.save();

    res.json({ message: "Password changed successfully!" });
  } catch (err) {
    console.error("Admin change password error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

module.exports = { signup, signin, getMe, updateProfile, changePassword };
