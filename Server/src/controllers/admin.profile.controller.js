const Admin = require("../models/Admin");

const toSafeAdmin = (admin) => ({
  id:             admin._id,
  name:           `${admin.firstName} ${admin.lastName}`,
  firstName:      admin.firstName,
  lastName:       admin.lastName,
  email:          admin.email,
  phone:          admin.phone,
  societyName:    admin.societyName,
  societyAddress: admin.societyAddress,
  totalFlats:     admin.totalFlats,
});

// GET /api/admin/profile
const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id);
    if (!admin) return res.status(404).json({ message: "Admin not found." });
    res.json({ admin: toSafeAdmin(admin) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/admin/profile  (update profile details — not email, not password)
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, societyName, societyAddress, totalFlats } = req.body;

    if (!firstName?.trim() || !lastName?.trim() || !phone?.trim() ||
        !societyName?.trim() || !societyAddress?.trim() || !totalFlats) {
      return res.status(400).json({ message: "All fields are required." });
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

    res.json({ message: "Profile updated successfully!", admin: toSafeAdmin(admin) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/admin/profile/password
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
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getProfile, updateProfile, changePassword };
