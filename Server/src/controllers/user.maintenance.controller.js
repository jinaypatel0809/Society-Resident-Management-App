const Maintenance   = require("../models/Maintenance");
const Payment       = require("../models/Payment");
const Notification  = require("../models/Notification");

const MONTHS = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

// GET /api/user/maintenance
const getMyBills = async (req, res) => {
  try {
    const residentId = req.user._id;

    let bills = await Maintenance.find({ residentId }).sort({ year: -1, month: -1 });

    // Auto-mark overdue
    const today = new Date();
    const bulkOps = [];
    bills = bills.map((b) => {
      const bill = b.toObject();
      if (bill.status === "pending" && bill.dueDate && new Date(bill.dueDate) < today) {
        bill.status = "overdue";
        bulkOps.push({ updateOne: { filter: { _id: bill._id }, update: { $set: { status: "overdue" } } } });
      }
      return bill;
    });
    if (bulkOps.length) Maintenance.bulkWrite(bulkOps).catch(console.error);

    // Attach pending payment request if any (so frontend can show "Payment Pending Verification")
    const billIds = bills.map(b => b._id);
    const pendingPayments = await Payment.find({
      maintenanceId: { $in: billIds },
      verificationStatus: "pending_verification",
    }).select("maintenanceId verificationStatus");

    const pendingMap = {};
    pendingPayments.forEach(p => { pendingMap[p.maintenanceId.toString()] = true; });

    bills = bills.map(b => ({
      ...b,
      hasPendingPayment: !!pendingMap[b._id.toString()],
    }));

    const paidBills    = bills.filter(b => b.status === "paid");
    const pendingBills = bills.filter(b => b.status !== "paid");

    res.json({
      bills,
      summary: {
        totalBills:   bills.length,
        paidCount:    paidBills.length,
        pendingCount: pendingBills.length,
        totalDue:     pendingBills.reduce((s, b) => s + (b.amount || 0), 0),
        totalPaid:    paidBills.reduce((s, b) => s + (b.amount || 0), 0),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/user/maintenance/:id
const getMyBill = async (req, res) => {
  try {
    const bill = await Maintenance.findOne({ _id: req.params.id, residentId: req.user._id });
    if (!bill) return res.status(404).json({ message: "Bill not found." });
    res.json({ bill });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/user/maintenance/:id/pay
// User submits payment details → goes for admin verification
const submitPayment = async (req, res) => {
  try {
    const residentId = req.user._id;
    const { paymentMode, transactionId, note, paymentDate } = req.body;

    const bill = await Maintenance.findOne({ _id: req.params.id, residentId });
    if (!bill) return res.status(404).json({ message: "Bill not found." });

    if (bill.status === "paid") {
      return res.status(400).json({ message: "This bill is already paid." });
    }

    // Check if a pending payment already exists for this bill
    const existing = await Payment.findOne({
      maintenanceId: bill._id,
      verificationStatus: "pending_verification",
    });
    if (existing) {
      return res.status(400).json({ message: "A payment request is already pending verification for this bill." });
    }

    const payment = await Payment.create({
      residentId,
      maintenanceId:      bill._id,
      amount:             bill.amount,
      paymentDate:        paymentDate ? new Date(paymentDate) : new Date(),
      paymentMode:        paymentMode || "cash",
      transactionId:      (transactionId || "").trim(),
      note:               (note || "").trim(),
      month:              bill.month,
      year:               bill.year,
      verificationStatus: "pending_verification",
      submittedBy:        "user",
    });

    // Update maintenance status to reflect payment submitted
    bill.status = "pending_verification";
    await bill.save();

    // In-app notification → admin (so admin sees "resident paid" immediately)
    const monthName = MONTHS[(bill.month || 1) - 1];
    await Notification.create({
      audience:           null, // admin-only alert
      title:              "New Maintenance Payment",
      message:            `${req.user.name} (${req.user.wing ? req.user.wing + "-" : ""}${req.user.flatNumber}) submitted a payment of ₹${bill.amount} for ${monthName} ${bill.year}. Please verify.`,
      category:           "payment_submitted",
      relatedResident:    residentId,
      relatedMaintenance: bill._id,
      relatedPayment:     payment._id,
    });

    res.status(201).json({
      message: "Payment submitted successfully! Waiting for admin verification.",
      payment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/user/payments  (resident's own payment history)
const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ residentId: req.user._id })
      .populate("maintenanceId", "month year amount dueDate")
      .sort({ createdAt: -1 });

    res.json({ payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getMyBills, getMyBill, submitPayment, getMyPayments };