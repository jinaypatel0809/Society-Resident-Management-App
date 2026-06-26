const Maintenance = require("../models/Maintenance");
const Payment      = require("../models/Payment");
const Complaint    = require("../models/Complaint");
const Flat         = require("../models/Flat");
const User         = require("../models/User");

const MONTHS = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

// ════════════════════════════════════════════════════════════════
// 1. Maintenance Collection Report — month-wise collected vs pending
// ════════════════════════════════════════════════════════════════
// GET /api/admin/reports/collection?year=2026
const getCollectionReport = async (req, res) => {
  try {
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

    const bills = await Maintenance.find({ year });

    // Build a row per month (Jan..Dec) for the requested year
    const monthly = MONTHS.map((name, idx) => {
      const monthNum   = idx + 1;
      const monthBills = bills.filter(b => b.month === monthNum);

      const billed    = monthBills.reduce((s, b) => s + (b.amount || 0), 0);
      const collected = monthBills.filter(b => b.status === "paid").reduce((s, b) => s + (b.amount || 0), 0);
      const pending   = monthBills.filter(b => b.status === "pending" || b.status === "pending_verification")
        .reduce((s, b) => s + (b.amount || 0), 0);
      const overdue   = monthBills.filter(b => b.status === "overdue").reduce((s, b) => s + (b.amount || 0), 0);

      return {
        month: name,
        monthNum,
        totalBills: monthBills.length,
        billed,
        collected,
        pending,
        overdue,
        collectionRate: billed > 0 ? Math.round((collected / billed) * 100) : 0,
      };
    });

    const summary = {
      year,
      totalBilled:    monthly.reduce((s, m) => s + m.billed, 0),
      totalCollected: monthly.reduce((s, m) => s + m.collected, 0),
      totalPending:   monthly.reduce((s, m) => s + m.pending, 0),
      totalOverdue:   monthly.reduce((s, m) => s + m.overdue, 0),
      totalBills:     bills.length,
    };
    summary.collectionRate = summary.totalBilled > 0
      ? Math.round((summary.totalCollected / summary.totalBilled) * 100)
      : 0;

    // Available years for the filter dropdown (years that actually have bills)
    const allYears = await Maintenance.distinct("year");
    allYears.sort((a, b) => b - a);

    res.json({ monthly, summary, availableYears: allYears.length ? allYears : [year] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ════════════════════════════════════════════════════════════════
// 2. Resident-wise Payment Report — who paid, who didn't
// ════════════════════════════════════════════════════════════════
// GET /api/admin/reports/residents?month=6&year=2026
const getResidentReport = async (req, res) => {
  try {
    const now   = new Date();
    const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
    const year  = req.query.year  ? Number(req.query.year)  : now.getFullYear();

    const residents = await User.find({ isActive: true })
      .select("name email phone flatNumber wing floor")
      .sort({ wing: 1, flatNumber: 1 });

    const bills = await Maintenance.find({ month, year });
    const billByResident = {};
    bills.forEach(b => { billByResident[b.residentId.toString()] = b; });

    const rows = residents.map(r => {
      const bill = billByResident[r._id.toString()];
      return {
        residentId: r._id,
        name:       r.name,
        flat:       `${r.wing ? r.wing + "-" : ""}${r.flatNumber}`,
        phone:      r.phone,
        email:      r.email,
        billAmount: bill?.amount || 0,
        status:     bill ? bill.status : "no_bill",
        paidOn:     bill?.paidOn || null,
        dueDate:    bill?.dueDate || null,
      };
    });

    const summary = {
      month, year,
      totalResidents: rows.length,
      paid:    rows.filter(r => r.status === "paid").length,
      pending: rows.filter(r => r.status === "pending" || r.status === "pending_verification").length,
      overdue: rows.filter(r => r.status === "overdue").length,
      noBill:  rows.filter(r => r.status === "no_bill").length,
      totalCollected: rows.filter(r => r.status === "paid").reduce((s, r) => s + r.billAmount, 0),
      totalPending:   rows.filter(r => r.status !== "paid" && r.status !== "no_bill").reduce((s, r) => s + r.billAmount, 0),
    };

    res.json({ rows, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ════════════════════════════════════════════════════════════════
// 3. Complaints Report — category/status/priority breakdown
// ════════════════════════════════════════════════════════════════
// GET /api/admin/reports/complaints?from=2026-01-01&to=2026-06-30
const getComplaintReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }

    const complaints = await Complaint.find(filter)
      .populate("resident", "name flatNumber wing")
      .sort({ createdAt: -1 });

    const byCategory = {};
    const byStatus   = { open: 0, "in-progress": 0, resolved: 0 };
    const byPriority = { low: 0, medium: 0, high: 0 };

    complaints.forEach(c => {
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
      byStatus[c.status]     = (byStatus[c.status] || 0) + 1;
      byPriority[c.priority] = (byPriority[c.priority] || 0) + 1;
    });

    // Average resolution time (in days) for resolved complaints
    const resolved = complaints.filter(c => c.status === "resolved" && c.resolvedAt);
    const avgResolutionDays = resolved.length
      ? Math.round(
          resolved.reduce((s, c) => s + (new Date(c.resolvedAt) - new Date(c.createdAt)), 0)
          / resolved.length / (1000 * 60 * 60 * 24) * 10
        ) / 10
      : null;

    const summary = {
      total:       complaints.length,
      open:        byStatus.open || 0,
      inProgress:  byStatus["in-progress"] || 0,
      resolved:    byStatus.resolved || 0,
      highPriority: byPriority.high || 0,
      avgResolutionDays,
    };

    res.json({
      complaints: complaints.map(c => ({
        _id:         c._id,
        subject:     c.subject,
        category:    c.category,
        priority:    c.priority,
        status:      c.status,
        resident:    c.resident ? { name: c.resident.name, flat: `${c.resident.wing ? c.resident.wing + "-" : ""}${c.resident.flatNumber}` } : null,
        createdAt:   c.createdAt,
        resolvedAt:  c.resolvedAt,
      })),
      byCategory, byStatus, byPriority,
      summary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ════════════════════════════════════════════════════════════════
// 4. Flat Occupancy Report
// ════════════════════════════════════════════════════════════════
// GET /api/admin/reports/occupancy
const getOccupancyReport = async (req, res) => {
  try {
    const flats = await Flat.find()
      .populate("resident", "name email phone")
      .sort({ wing: 1, flatNumber: 1 });

    const byStatus = { occupied: 0, vacant: 0, maintenance: 0 };
    const byType   = {};
    const byWing   = {};

    flats.forEach(f => {
      byStatus[f.status] = (byStatus[f.status] || 0) + 1;
      byType[f.flatType]  = (byType[f.flatType] || 0) + 1;

      const wingKey = f.wing || "—";
      if (!byWing[wingKey]) byWing[wingKey] = { total: 0, occupied: 0, vacant: 0, maintenance: 0 };
      byWing[wingKey].total += 1;
      byWing[wingKey][f.status] = (byWing[wingKey][f.status] || 0) + 1;
    });

    const summary = {
      totalFlats:  flats.length,
      occupied:    byStatus.occupied || 0,
      vacant:      byStatus.vacant || 0,
      maintenance: byStatus.maintenance || 0,
      occupancyRate: flats.length > 0 ? Math.round(((byStatus.occupied || 0) / flats.length) * 100) : 0,
    };

    res.json({
      flats: flats.map(f => ({
        _id:        f._id,
        wing:       f.wing,
        flatNumber: f.flatNumber,
        floor:      f.floor,
        flatType:   f.flatType,
        area:       f.area,
        status:     f.status,
        resident:   f.resident ? { name: f.resident.name, email: f.resident.email, phone: f.resident.phone } : null,
      })),
      byStatus, byType, byWing,
      summary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getCollectionReport, getResidentReport, getComplaintReport, getOccupancyReport,
};
