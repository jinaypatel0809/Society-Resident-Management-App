require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const connectDB = require("./config/db");

// ── Admin Routes ───────────────────────────────────────────────────
const authUserRoutes        = require("./routes/auth.user.routes");
const authAdminRoutes       = require("./routes/auth.admin.routes");
const authUnifiedRoutes     = require("./routes/auth.unified.routes");
const residentRoutes        = require("./routes/resident.routes");
const flatRoutes            = require("./routes/flat.routes");
const maintenanceRoutes     = require("./routes/maintenance.routes");
const paymentRoutes         = require("./routes/payment.routes");
const receiptRoutes         = require("./routes/receipt.routes");
const complaintAdminRoutes  = require("./routes/complaint.admin.routes");
const notificationAdminRoutes = require("./routes/notification.admin.routes");
const reportRoutes           = require("./routes/report.routes");
const adminProfileRoutes     = require("./routes/admin.profile.routes");

// ── User Routes ────────────────────────────────────────────────────
const userMaintenanceRoutes  = require("./routes/user.maintenance.routes");
const userPaymentRoutes      = require("./routes/user.payment.routes");
const userReceiptRoutes      = require("./routes/user.receipt.routes");
const complaintUserRoutes    = require("./routes/complaint.user.routes");
const notificationUserRoutes = require("./routes/notification.user.routes");

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// ── Auth ───────────────────────────────────────────────────────────
app.use("/api/auth/user",  authUserRoutes);
app.use("/api/auth/admin", authAdminRoutes);
app.use("/api/auth",       authUnifiedRoutes);

// ── Admin APIs ─────────────────────────────────────────────────────
app.use("/api/admin/residents",     residentRoutes);
app.use("/api/admin/flats",         flatRoutes);
app.use("/api/admin/maintenance",   maintenanceRoutes);
app.use("/api/admin/payments",      paymentRoutes);
app.use("/api/admin/receipts",      receiptRoutes);
app.use("/api/admin/complaints",    complaintAdminRoutes);
app.use("/api/admin/notifications", notificationAdminRoutes);
app.use("/api/admin/reports",       reportRoutes);
app.use("/api/admin/profile",       adminProfileRoutes);

// ── User APIs ──────────────────────────────────────────────────────
app.use("/api/user/maintenance",    userMaintenanceRoutes);
app.use("/api/user/payments",       userPaymentRoutes);
app.use("/api/user/receipts",       userReceiptRoutes);
app.use("/api/user/complaints",     complaintUserRoutes);
app.use("/api/user/notifications",  notificationUserRoutes);

// Health Check
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

// 404
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// Start
const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`)))
  .catch((err) => console.error("❌ DB Connection Failed:", err));