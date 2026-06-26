const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema(
  {
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "pending_verification", "paid", "overdue"],
      default: "pending",
    },
    paidOn: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// One bill per resident per month+year
maintenanceSchema.index({ residentId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Maintenance", maintenanceSchema);