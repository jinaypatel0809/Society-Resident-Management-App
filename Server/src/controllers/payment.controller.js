const Payment      = require("../models/Payment");
const Maintenance  = require("../models/Maintenance");
const Notification = require("../models/Notification");
const { sendEmail, paymentVerifiedEmail, paymentRejectedEmail } = require("../utils/sendEmail");
const User = require("../models/User");

const MONTHS = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

// GET /api/admin/payments
const getAllPayments = async (req, res) => {
  try {
    const { search, paymentMode, month, year, verificationStatus } = req.query;

    const filter = {};
    if (paymentMode)        filter.paymentMode        = paymentMode;
    if (month)              filter.month              = Number(month);
    if (year)               filter.year               = Number(year);
    if (verificationStatus) filter.verificationStatus = verificationStatus;

    let payments = await Payment.find(filter)
      .populate("residentId",    "name email phone flatNumber wing floor")
      .populate("maintenanceId", "month year amount")
      .sort({ createdAt: -1 });

    if (search) {
      const regex = new RegExp(search, "i");
      payments = payments.filter(p =>
        regex.test(p.residentId?.name) ||
        regex.test(p.residentId?.flatNumber) ||
        regex.test(p.residentId?.wing) ||
        regex.test(p.transactionId) ||
        regex.test(p.note)
      );
    }

    const totalCollected = payments
      .filter(p => p.verificationStatus === "verified")
      .reduce((s, p) => s + (p.amount || 0), 0);

    const pendingCount = payments.filter(p => p.verificationStatus === "pending_verification").length;

    res.json({ payments, total: payments.length, totalCollected, pendingCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/admin/payments/:id
const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("residentId",    "name email phone flatNumber wing floor")
      .populate("maintenanceId", "month year amount");
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json({ payment });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/admin/payments  (admin records payment directly)
const addPayment = async (req, res) => {
  try {
    const { residentId, maintenanceId, amount, paymentDate, paymentMode, transactionId, month, year, note } = req.body;

    if (!residentId || !amount || !paymentDate) {
      return res.status(400).json({ message: "Resident, amount and payment date are required." });
    }

    const payment = await Payment.create({
      residentId,
      maintenanceId:      maintenanceId || null,
      amount:             Number(amount),
      paymentDate:        new Date(paymentDate),
      paymentMode:        paymentMode || "cash",
      transactionId:      (transactionId || "").trim(),
      month:              month ? Number(month) : null,
      year:               year  ? Number(year)  : null,
      note:               (note || "").trim(),
      verificationStatus: "verified",   // admin-added = auto verified
      submittedBy:        "admin",
      verifiedAt:         new Date(),
    });

    // Mark maintenance bill as paid if linked
    if (maintenanceId) {
      await Maintenance.findByIdAndUpdate(maintenanceId, {
        status: "paid",
        paidOn: new Date(paymentDate),
      });
    }

    const populated = await payment.populate([
      { path: "residentId",    select: "name email phone flatNumber wing floor" },
      { path: "maintenanceId", select: "month year amount" },
    ]);

    res.status(201).json({ message: "Payment recorded successfully!", payment: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/admin/payments/:id/verify
// Admin verifies a user-submitted payment → marks paid + sends notification + email
const verifyPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("residentId", "name email flatNumber wing")
      .populate("maintenanceId", "month year amount");

    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.verificationStatus === "verified") {
      return res.status(400).json({ message: "Payment is already verified." });
    }

    payment.verificationStatus = "verified";
    payment.verifiedAt         = new Date();
    await payment.save();

    // Update maintenance bill → paid
    if (payment.maintenanceId) {
      await Maintenance.findByIdAndUpdate(payment.maintenanceId._id, {
        status: "paid",
        paidOn: payment.paymentDate,
      });
    }

    const resident  = payment.residentId;
    const monthName = MONTHS[(payment.month || 1) - 1];

    // In-app notification → resident
    await Notification.create({
      audience:        resident._id,
      title:           "Payment Verified ✅",
      message:         `Your maintenance payment of ₹${payment.amount} for ${monthName} ${payment.year} has been verified by the admin.`,
      category:        "payment_verified",
      relatedResident: resident._id,
      relatedPayment:  payment._id,
      relatedMaintenance: payment.maintenanceId?._id || null,
      seenByAdmin:     true,
    });

    // Email notification
    const user = await User.findById(resident._id).select("email name");
    if (user?.email) {
      const { subject, html } = paymentVerifiedEmail({
        name:          user.name,
        amount:        payment.amount,
        month:         monthName,
        year:          payment.year,
        transactionId: payment.transactionId,
      });
      sendEmail({ to: user.email, subject, html });
    }

    res.json({ message: "Payment verified successfully! Resident notified.", payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/admin/payments/:id/reject
// Admin rejects a user-submitted payment
const rejectPayment = async (req, res) => {
  try {
    const { reason } = req.body;

    const payment = await Payment.findById(req.params.id)
      .populate("residentId", "name email flatNumber wing")
      .populate("maintenanceId", "month year amount");

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.verificationStatus = "rejected";
    payment.rejectionReason    = (reason || "").trim();
    await payment.save();

    // Revert maintenance bill back to pending/overdue
    if (payment.maintenanceId) {
      const today   = new Date();
      const dueDate = payment.maintenanceId.dueDate;
      const status  = dueDate && new Date(dueDate) < today ? "overdue" : "pending";
      await Maintenance.findByIdAndUpdate(payment.maintenanceId._id, { status });
    }

    const resident  = payment.residentId;
    const monthName = MONTHS[(payment.month || 1) - 1];

    // In-app notification → resident
    await Notification.create({
      audience:        resident._id,
      title:           "Payment Rejected ❌",
      message:         `Your payment of ₹${payment.amount} for ${monthName} ${payment.year} was rejected. Reason: ${reason || "Not specified"}. Please re-submit.`,
      category:        "payment_rejected",
      relatedResident: resident._id,
      relatedPayment:  payment._id,
      relatedMaintenance: payment.maintenanceId?._id || null,
      seenByAdmin:     true,
    });

    // Email notification
    const user = await User.findById(resident._id).select("email name");
    if (user?.email) {
      const { subject, html } = paymentRejectedEmail({
        name:   user.name,
        amount: payment.amount,
        month:  monthName,
        year:   payment.year,
        reason,
      });
      sendEmail({ to: user.email, subject, html });
    }

    res.json({ message: "Payment rejected. Resident notified.", payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/admin/payments/:id
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json({ message: "Payment deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── Receipts (derived from verified payments) ──────────────────────

const receiptNoFor = (payment) =>
  `RCPT-${payment.year || new Date(payment.paymentDate).getFullYear()}${String(payment.month || new Date(payment.paymentDate).getMonth() + 1).padStart(2, "0")}-${payment._id.toString().slice(-6).toUpperCase()}`;

const toReceipt = (payment) => {
  const monthStr = payment.year && payment.month
    ? `${payment.year}-${String(payment.month).padStart(2, "0")}`
    : null;
  return {
    _id:       payment._id,
    receiptNo: receiptNoFor(payment),
    resident:  payment.residentId,
    month:     monthStr,
    type:      "maintenance",
    amount:    payment.amount,
    paidDate:  payment.paymentDate,
    dueDate:   payment.maintenanceId?.dueDate || null,
    note:      payment.note || "",
  };
};

// GET /api/admin/receipts
const getReceipts = async (req, res) => {
  try {
    const { search, type, month } = req.query;

    const filter = { verificationStatus: "verified" };
    if (month) {
      const [y, m] = month.split("-");
      if (y) filter.year = Number(y);
      if (m) filter.month = Number(m);
    }

    let payments = await Payment.find(filter)
      .populate("residentId",    "name email phone flatNumber wing floor")
      .populate("maintenanceId", "month year amount dueDate")
      .sort({ paymentDate: -1 });

    let receipts = payments.map((p) => toReceipt({
      ...p.toObject(),
      residentId:    p.residentId,
      maintenanceId: p.maintenanceId,
    }));

    // type filter — this app only issues maintenance receipts today
    if (type && type !== "maintenance") receipts = [];

    if (search) {
      const regex = new RegExp(search, "i");
      receipts = receipts.filter(
        (r) =>
          regex.test(r.resident?.name || "") ||
          regex.test(r.resident?.flatNumber || "") ||
          regex.test(r.resident?.wing || "") ||
          regex.test(r.receiptNo)
      );
    }

    const summary = {
      count:    receipts.length,
      totalAmt: receipts.reduce((s, r) => s + (r.amount || 0), 0),
    };

    res.json({ receipts, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/admin/receipts/:id/download
const downloadReceiptPDF = async (req, res) => {
  try {
    const PDFDocument = require("pdfkit");

    const payment = await Payment.findById(req.params.id)
      .populate("residentId",    "name email phone flatNumber wing floor")
      .populate("maintenanceId", "month year amount dueDate");

    if (!payment || payment.verificationStatus !== "verified") {
      return res.status(404).json({ message: "Receipt not found." });
    }

    const receipt  = toReceipt(payment);
    const resident = payment.residentId || {};

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${receipt.receiptNo}.pdf"`);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).fillColor("#111827").text("SocietyMS", { align: "left" });
    doc.fontSize(10).fillColor("#9ca3af").text("Maintenance Payment Receipt");
    doc.moveDown(1.5);

    doc.fontSize(14).fillColor("#16a34a").text("Payment Receipt", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#6b7280").text(`Receipt No: ${receipt.receiptNo}`);
    doc.text(`Date: ${new Date(receipt.paidDate).toLocaleDateString("en-IN")}`);
    doc.moveDown(1);

    doc.fontSize(11).fillColor("#111827").text(`Resident: ${resident.name || "—"}`);
    doc.text(`Flat: ${resident.wing ? resident.wing + "-" : ""}${resident.flatNumber || "—"}`);
    if (receipt.month) {
      const [y, m] = receipt.month.split("-");
      const monthLabel = new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
      doc.text(`Billing Period: ${monthLabel}`);
    }
    doc.moveDown(1);

    doc.fontSize(13).fillColor("#16a34a").text(`Amount Paid: ₹${receipt.amount}`, { underline: false });
    if (receipt.note) {
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#6b7280").text(`Note: ${receipt.note}`);
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor("#9ca3af").text("This is a system-generated receipt.", { align: "left" });

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ message: "Server error" });
  }
};

// ── Resident-facing receipts ────────────────────────────────────────

// GET /api/user/receipts  (resident's own receipts — verified payments only)
const getMyReceipts = async (req, res) => {
  try {
    const payments = await Payment.find({
      residentId: req.user._id,
      verificationStatus: "verified",
    })
      .populate("maintenanceId", "month year amount dueDate")
      .sort({ paymentDate: -1 });

    const receipts = payments.map((p) => toReceipt({
      ...p.toObject(),
      residentId:    req.user,
      maintenanceId: p.maintenanceId,
    }));

    res.json({
      receipts,
      summary: {
        count:    receipts.length,
        totalAmt: receipts.reduce((s, r) => s + (r.amount || 0), 0),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/user/receipts/:id/download  (resident downloads their own receipt only)
const downloadMyReceiptPDF = async (req, res) => {
  try {
    const PDFDocument = require("pdfkit");

    const payment = await Payment.findOne({
      _id: req.params.id,
      residentId: req.user._id, // ownership check — can't download someone else's receipt
    })
      .populate("residentId",    "name email phone flatNumber wing floor")
      .populate("maintenanceId", "month year amount dueDate");

    if (!payment || payment.verificationStatus !== "verified") {
      return res.status(404).json({ message: "Receipt not found." });
    }

    const receipt  = toReceipt(payment);
    const resident = payment.residentId || {};

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${receipt.receiptNo}.pdf"`);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).fillColor("#111827").text("SocietyMS", { align: "left" });
    doc.fontSize(10).fillColor("#9ca3af").text("Maintenance Payment Receipt");
    doc.moveDown(1.5);

    doc.fontSize(14).fillColor("#16a34a").text("Payment Receipt", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#6b7280").text(`Receipt No: ${receipt.receiptNo}`);
    doc.text(`Date: ${new Date(receipt.paidDate).toLocaleDateString("en-IN")}`);
    doc.moveDown(1);

    doc.fontSize(11).fillColor("#111827").text(`Resident: ${resident.name || "—"}`);
    doc.text(`Flat: ${resident.wing ? resident.wing + "-" : ""}${resident.flatNumber || "—"}`);
    if (receipt.month) {
      const [y, m] = receipt.month.split("-");
      const monthLabel = new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
      doc.text(`Billing Period: ${monthLabel}`);
    }
    doc.moveDown(1);

    doc.fontSize(13).fillColor("#16a34a").text(`Amount Paid: ₹${receipt.amount}`, { underline: false });
    if (receipt.note) {
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#6b7280").text(`Note: ${receipt.note}`);
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor("#9ca3af").text("This is a system-generated receipt.", { align: "left" });

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllPayments, getPayment, addPayment, verifyPayment, rejectPayment, deletePayment,
  getReceipts, downloadReceiptPDF, getMyReceipts, downloadMyReceiptPDF,
};