const Flat = require("../models/Flat");
const User = require("../models/User");

// GET /api/admin/flats
const getAllFlats = async (req, res) => {
  try {
    const { wing, status, flatType, search } = req.query;
    const filter = {};

    if (wing)     filter.wing     = { $regex: wing, $options: "i" };
    if (status)   filter.status   = status;
    if (flatType) filter.flatType = flatType;
    if (search)   filter.$or = [
      { flatNumber: { $regex: search, $options: "i" } },
      { wing:       { $regex: search, $options: "i" } },
      { notes:      { $regex: search, $options: "i" } },
    ];

    const flats = await Flat.find(filter)
      .populate("resident", "name email phone ownerType")
      .sort({ wing: 1, flatNumber: 1 });

    // Summary counts
    const all = await Flat.find({});
    const summary = {
      total:       all.length,
      occupied:    all.filter(f => f.status === "occupied").length,
      vacant:      all.filter(f => f.status === "vacant").length,
      maintenance: all.filter(f => f.status === "maintenance").length,
    };

    res.json({ flats, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/admin/flats/:id
const getFlat = async (req, res) => {
  try {
    const flat = await Flat.findById(req.params.id).populate("resident", "name email phone");
    if (!flat) return res.status(404).json({ message: "Flat not found" });
    res.json({ flat });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/admin/flats
const addFlat = async (req, res) => {
  try {
    const { wing, flatNumber, floor, flatType, area, notes } = req.body;

    if (!flatNumber) return res.status(400).json({ message: "Flat number is required." });

    const existing = await Flat.findOne({
      wing: wing?.trim() || "",
      flatNumber: flatNumber.trim(),
    });
    if (existing) {
      return res.status(409).json({ message: `Flat ${wing ? wing+"-" : ""}${flatNumber} already exists.` });
    }

    const flat = await Flat.create({
      wing: wing || "",
      flatNumber,
      floor: floor || "",
      flatType: flatType || "2BHK",
      area: area || 0,
      status: "vacant",
      notes: notes || "",
    });

    res.status(201).json({ message: "Flat added successfully!", flat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/admin/flats/:id
const updateFlat = async (req, res) => {
  try {
    const { wing, flatNumber, floor, flatType, area, status, notes, residentId } = req.body;

    const flat = await Flat.findById(req.params.id);
    if (!flat) return res.status(404).json({ message: "Flat not found" });

    // If assigning a resident
    if (residentId) {
      const user = await User.findById(residentId);
      if (!user) return res.status(404).json({ message: "Resident not found" });
      flat.resident = residentId;
      flat.status   = "occupied";
    }

    // If removing resident
    if (residentId === null) {
      flat.resident = null;
      flat.status   = "vacant";
    }

    if (wing      !== undefined) flat.wing      = wing;
    if (flatNumber)              flat.flatNumber = flatNumber;
    if (floor     !== undefined) flat.floor      = floor;
    if (flatType)                flat.flatType   = flatType;
    if (area      !== undefined) flat.area       = area;
    if (status    && residentId === undefined) flat.status = status;
    if (notes     !== undefined) flat.notes      = notes;

    await flat.save();
    await flat.populate("resident", "name email phone ownerType");

    res.json({ message: "Flat updated successfully!", flat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/admin/flats/:id
const deleteFlat = async (req, res) => {
  try {
    const flat = await Flat.findById(req.params.id);
    if (!flat) return res.status(404).json({ message: "Flat not found" });
    if (flat.status === "occupied") {
      return res.status(400).json({ message: "Cannot delete an occupied flat. Remove resident first." });
    }
    await flat.deleteOne();
    res.json({ message: "Flat deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/admin/flats/residents-list  — for dropdown (unassigned residents)
const getResidentsList = async (req, res) => {
  try {
    const residents = await User.find({ isActive: true }).select("name email flatNumber wing phone");
    res.json({ residents });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getAllFlats, getFlat, addFlat, updateFlat, deleteFlat, getResidentsList };