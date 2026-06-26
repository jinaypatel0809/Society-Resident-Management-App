const User = require("../models/User");
const bcrypt = require("bcryptjs");

// GET /api/admin/residents — list all residents
const getAllResidents = async (req, res) => {
  try {
    const { search, wing, ownerType, status } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name:       { $regex: search, $options: "i" } },
        { email:      { $regex: search, $options: "i" } },
        { phone:      { $regex: search, $options: "i" } },
        { flatNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (wing)      filter.wing      = { $regex: wing, $options: "i" };
    if (ownerType) filter.ownerType = ownerType;
    if (status === "active")   filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    const residents = await User.find(filter).sort({ createdAt: -1 });
    res.json({ residents, total: residents.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/admin/residents/:id
const getResident = async (req, res) => {
  try {
    const resident = await User.findById(req.params.id);
    if (!resident) return res.status(404).json({ message: "Resident not found" });
    res.json({ resident });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/admin/residents — add resident (admin creates account)
const addResident = async (req, res) => {
  try {
    const { name, email, phone, flatNumber, wing, floor, ownerType, password } = req.body;

    if (!name || !email || !phone || !flatNumber || !password) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: "Email already registered." });

    const flatTaken = await User.findOne({
      flatNumber: flatNumber.trim(),
      wing: wing?.trim() || "",
      isActive: true,
    });
    if (flatTaken) {
      return res.status(409).json({ message: `Flat ${wing ? wing + "-" : ""}${flatNumber} already has an active resident.` });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const resident = await User.create({
      name, email, phone, flatNumber,
      wing: wing || "",
      floor: floor || "",
      ownerType: ownerType || "owner",
      password,
    });

    const safe = resident.toObject();
    delete safe.password;

    res.status(201).json({ message: "Resident added successfully!", resident: safe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/admin/residents/:id — edit resident
const updateResident = async (req, res) => {
  try {
    const { name, email, phone, flatNumber, wing, floor, ownerType } = req.body;

    const resident = await User.findById(req.params.id);
    if (!resident) return res.status(404).json({ message: "Resident not found" });

    // Check email conflict (exclude self)
    if (email && email !== resident.email) {
      const emailTaken = await User.findOne({ email: email.toLowerCase().trim() });
      if (emailTaken) return res.status(409).json({ message: "Email already in use." });
    }

    if (name)       resident.name       = name;
    if (email)      resident.email      = email.toLowerCase().trim();
    if (phone)      resident.phone      = phone;
    if (flatNumber) resident.flatNumber = flatNumber;
    if (wing  !== undefined) resident.wing  = wing;
    if (floor !== undefined) resident.floor = floor;
    if (ownerType)  resident.ownerType  = ownerType;

    await resident.save();

    const safe = resident.toObject();
    delete safe.password;
    res.json({ message: "Resident updated successfully!", resident: safe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/admin/residents/:id/toggle-status
const toggleStatus = async (req, res) => {
  try {
    const resident = await User.findById(req.params.id);
    if (!resident) return res.status(404).json({ message: "Resident not found" });

    resident.isActive = !resident.isActive;
    await resident.save();

    res.json({
      message: `Resident ${resident.isActive ? "activated" : "deactivated"} successfully.`,
      isActive: resident.isActive,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/admin/residents/:id — hard delete (use with caution)
const deleteResident = async (req, res) => {
  try {
    const resident = await User.findByIdAndDelete(req.params.id);
    if (!resident) return res.status(404).json({ message: "Resident not found" });
    res.json({ message: "Resident deleted permanently." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getAllResidents, getResident, addResident, updateResident, toggleStatus, deleteResident };