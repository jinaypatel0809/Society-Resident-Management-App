const Maintenance  = require("../models/Maintenance");
const Notification = require("../models/Notification");

// GET /api/admin/maintenance
const getAllBills = async (req, res) => {
  try {
    const { search, status, month, year } = req.query;

    // Build base filter
    const filter = {};
    if (status) filter.status = status;
    if (month)  filter.month  = Number(month);
    if (year)   filter.year   = Number(year);

    // Fetch with resident populated
    let bills = await Maintenance.find(filter)
      .populate("residentId", "name email phone flatNumber wing floor")
      .sort({ year: -1, month: -1, createdAt: -1 });

    // Auto-mark overdue bills
    const today = new Date();
    const bulkOps = [];
    bills = bills.map(b => {
      const bill = b.toObject();
      if (
        bill.status === "pending" &&
        bill.dueDate &&
        new Date(bill.dueDate) < today
      ) {
        bill.status = "overdue";
        bulkOps.push({
          updateOne: { filter: { _id: bill._id }, update: { $set: { status: "overdue" } } },
        });
      }
      return bill;
    });
    if (bulkOps.length) Maintenance.bulkWrite(bulkOps).catch(console.error);

    // Search filter (post-populate)
    if (search) {
      const regex = new RegExp(search, "i");
      bills = bills.filter(b =>
        regex.test(b.residentId?.name) ||
        regex.test(b.residentId?.flatNumber) ||
        regex.test(b.residentId?.wing) ||
        regex.test(b.description)
      );
    }

    res.json({ bills, total: bills.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/admin/maintenance/:id
const getBill = async (req, res) => {
  try {
    const bill = await Maintenance.findById(req.params.id)
      .populate("residentId", "name email phone flatNumber wing floor");
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    res.json({ bill });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/admin/maintenance
const addBill = async (req, res) => {
  try {
    const { residentId, month, year, amount, dueDate, status, paidOn, description } = req.body;

    if (!residentId || !month || !year || !amount || !dueDate) {
      return res.status(400).json({ message: "Resident, month, year, amount and due date are required." });
    }

    // Duplicate check
    const existing = await Maintenance.findOne({
      residentId,
      month: Number(month),
      year: Number(year),
    });
    if (existing) {
      return res.status(409).json({
        message: `A bill for this resident already exists for that month and year.`,
      });
    }

    const bill = await Maintenance.create({
      residentId,
      month: Number(month),
      year: Number(year),
      amount: Number(amount),
      dueDate: new Date(dueDate),
      status: status || "pending",
      paidOn: status === "paid" && paidOn ? new Date(paidOn) : null,
      description: (description || "").trim(),
    });

    const populated = await bill.populate("residentId", "name email phone flatNumber wing floor");

    // In-app notification → resident, so they see the bill on their Maintenance page
    const MONTHS = ["January","February","March","April","May","June",
      "July","August","September","October","November","December"];
    await Notification.create({
      audience:           residentId,
      title:              "New Maintenance Bill",
      message:            `A maintenance bill of ₹${bill.amount} for ${MONTHS[bill.month - 1]} ${bill.year} has been added. Due on ${new Date(bill.dueDate).toLocaleDateString("en-IN")}.`,
      category:           "bill_added",
      relatedResident:    residentId,
      relatedMaintenance: bill._id,
      seenByAdmin:        true,
    });

    res.status(201).json({ message: "Maintenance bill added successfully!", bill: populated });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Bill for this resident, month and year already exists." });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/admin/maintenance/:id
const updateBill = async (req, res) => {
  try {
    const { residentId, month, year, amount, dueDate, status, paidOn, description } = req.body;

    const bill = await Maintenance.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });

    const wasUnpaid = bill.status !== "paid";

    if (residentId !== undefined) bill.residentId = residentId;
    if (month      !== undefined) bill.month      = Number(month);
    if (year       !== undefined) bill.year       = Number(year);
    if (amount     !== undefined) bill.amount     = Number(amount);
    if (dueDate    !== undefined) bill.dueDate    = new Date(dueDate);
    if (status     !== undefined) bill.status     = status;
    if (description !== undefined) bill.description = description.trim();

    // Handle paidOn
    if (status === "paid") {
      bill.paidOn = paidOn ? new Date(paidOn) : new Date();
    } else if (status === "pending" || status === "overdue") {
      bill.paidOn = null;
    }

    await bill.save();
    const populated = await bill.populate("residentId", "name email phone flatNumber wing floor");

    // If this update is the moment the bill became "paid", notify the resident
    // and keep any linked Payment record in sync (mirrors markPaid behaviour).
    if (wasUnpaid && bill.status === "paid") {
      const Payment = require("../models/Payment");
      await Payment.updateMany(
        { maintenanceId: bill._id, verificationStatus: { $ne: "verified" } },
        { verificationStatus: "verified", verifiedAt: bill.paidOn }
      );

      const MONTHS = ["January","February","March","April","May","June",
        "July","August","September","October","November","December"];
      await Notification.create({
        audience:           bill.residentId,
        title:              "Maintenance Payment Successful ✅",
        message:            `Admin has marked your maintenance of ₹${bill.amount} for ${MONTHS[(bill.month || 1) - 1]} ${bill.year} as paid successfully.`,
        category:           "payment_verified",
        relatedResident:    bill.residentId,
        relatedMaintenance: bill._id,
        seenByAdmin:        true,
      });
    }

    res.json({ message: "Bill updated successfully!", bill: populated });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "A bill for this resident, month and year already exists." });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/admin/maintenance/:id/mark-paid
const markPaid = async (req, res) => {
  try {
    const { paidOn } = req.body;

    const bill = await Maintenance.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });

    const paidOnDate = paidOn ? new Date(paidOn) : new Date();
    bill.status = "paid";
    bill.paidOn = paidOnDate;
    await bill.save();

    // Keep any linked Payment record (e.g. resident's pending submission) in sync
    const Payment = require("../models/Payment");
    await Payment.updateMany(
      { maintenanceId: bill._id, verificationStatus: { $ne: "verified" } },
      { verificationStatus: "verified", verifiedAt: paidOnDate }
    );

    // In-app notification → resident: "admin completed/confirmed your maintenance payment"
    const MONTHS = ["January","February","March","April","May","June",
      "July","August","September","October","November","December"];
    await Notification.create({
      audience:           bill.residentId,
      title:              "Maintenance Payment Successful ✅",
      message:            `Admin has marked your maintenance of ₹${bill.amount} for ${MONTHS[(bill.month || 1) - 1]} ${bill.year} as paid successfully.`,
      category:           "payment_verified",
      relatedResident:    bill.residentId,
      relatedMaintenance: bill._id,
      seenByAdmin:        true,
    });

    res.json({ message: "Bill marked as paid successfully!", bill });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/admin/maintenance/:id
const deleteBill = async (req, res) => {
  try {
    const bill = await Maintenance.findByIdAndDelete(req.params.id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    res.json({ message: "Bill deleted permanently." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getAllBills, getBill, addBill, updateBill, markPaid, deleteBill };