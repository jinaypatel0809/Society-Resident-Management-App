const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    resident:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject:     { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category:    {
      type: String,
      enum: ["plumbing", "electrical", "cleaning", "security", "parking", "lift", "other"],
      default: "other",
    },
    priority:    { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status:      { type: String, enum: ["open", "in-progress", "resolved"], default: "open" },
    adminNote:   { type: String, trim: true, default: "" },
    resolvedAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);