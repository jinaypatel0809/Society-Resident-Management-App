const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    maintenanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Maintenance",
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMode: {
      type: String,
      enum: ["cash", "upi", "bank_transfer", "cheque", "online"],
      default: "cash",
    },
    transactionId: {
      type: String,
      trim: true,
      default: "",
    },
    month: { type: Number, min: 1, max: 12, default: null },
    year:  { type: Number, default: null },
    note:  { type: String, trim: true, default: "" },

    // pending_verification = user submitted, admin yet to verify
    // verified             = admin confirmed
    // rejected             = admin rejected
    verificationStatus: {
      type: String,
      enum: ["pending_verification", "verified", "rejected"],
      default: "pending_verification",
    },
    rejectionReason: { type: String, trim: true, default: "" },
    verifiedAt:      { type: Date, default: null },

    // "user" = resident paid from portal | "admin" = admin recorded directly
    submittedBy: {
      type: String,
      enum: ["user", "admin"],
      default: "admin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);