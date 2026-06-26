const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");

// ── Resident-facing ─────────────────────────────────────────────

// POST /api/user/complaints
const raiseComplaint = async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ message: "Subject and description are required." });
    }

    const complaint = await Complaint.create({
      resident: req.user._id,
      subject: subject.trim(),
      description: description.trim(),
      category: category || "other",
      priority: priority || "medium",
    });

    await Notification.create({
      title: "New Complaint Raised",
      message: `${req.user.name} (${req.user.wing || ""}${req.user.flatNumber}) raised: "${complaint.subject}"`,
      category: "complaint_raised",
      audience: null, // admin-only alert
      relatedResident: req.user._id,
      relatedComplaint: complaint._id,
    });

    res.status(201).json({ message: "Complaint submitted successfully!", complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/user/complaints  (only the logged-in resident's own complaints)
const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ resident: req.user._id }).sort({ createdAt: -1 });
    res.json({ complaints });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/user/complaints/:id  (resident can withdraw only if still open)
const withdrawComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ _id: req.params.id, resident: req.user._id });
    if (!complaint) return res.status(404).json({ message: "Complaint not found." });
    if (complaint.status !== "open") {
      return res.status(400).json({ message: "Only open complaints can be withdrawn." });
    }
    await complaint.deleteOne();
    res.json({ message: "Complaint withdrawn." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── Admin-facing ────────────────────────────────────────────────

// GET /api/admin/complaints
const getAllComplaints = async (req, res) => {
  try {
    const { status, priority, category, search } = req.query;

    const filter = {};
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    let complaints = await Complaint.find(filter)
      .populate("resident", "name email flatNumber wing floor")
      .sort({ createdAt: -1 });

    if (search) {
      const s = search.toLowerCase();
      complaints = complaints.filter((c) => {
        const r = c.resident || {};
        return (
          r.name?.toLowerCase().includes(s) ||
          r.flatNumber?.toLowerCase().includes(s) ||
          r.wing?.toLowerCase().includes(s) ||
          c.subject?.toLowerCase().includes(s)
        );
      });
    }

    const open       = complaints.filter((c) => c.status === "open").length;
    const inProgress = complaints.filter((c) => c.status === "in-progress").length;
    const resolved   = complaints.filter((c) => c.status === "resolved").length;
    const urgent     = complaints.filter((c) => c.priority === "high" && c.status !== "resolved").length;

    res.json({
      complaints,
      summary: { total: complaints.length, open, inProgress, resolved, urgent },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/admin/complaints/:id/status
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, adminNote, priority } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found." });

    if (status !== undefined) {
      complaint.status = status;
      complaint.resolvedAt = status === "resolved" ? new Date() : null;
    }
    if (adminNote !== undefined) complaint.adminNote = adminNote.trim();
    if (priority  !== undefined) complaint.priority  = priority;

    await complaint.save();
    const populated = await complaint.populate("resident", "name email flatNumber wing floor");

    if (status !== undefined || adminNote) {
      const statusLabel = { open: "Open", "in-progress": "In Progress", resolved: "Resolved" };
      await Notification.create({
        title: "Complaint Update",
        message: adminNote
          ? `Update on "${complaint.subject}": ${adminNote}`
          : `Your complaint "${complaint.subject}" is now ${statusLabel[complaint.status] || complaint.status}.`,
        category: "complaint_update",
        audience: complaint.resident._id || complaint.resident,
        relatedResident: complaint.resident._id || complaint.resident,
        relatedComplaint: complaint._id,
        seenByAdmin: true,
      });
    }

    res.json({ message: "Complaint updated!", complaint: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/admin/complaints/:id
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found." });
    res.json({ message: "Complaint deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  raiseComplaint, getMyComplaints, withdrawComplaint,
  getAllComplaints, updateComplaintStatus, deleteComplaint,
};