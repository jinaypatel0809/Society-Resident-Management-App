const mongoose = require("mongoose");

const flatSchema = new mongoose.Schema(
  {
    wing:       { type: String, trim: true, default: "" },
    flatNumber: { type: String, required: true, trim: true },
    floor:      { type: String, trim: true, default: "" },
    flatType:   { type: String, enum: ["1BHK","2BHK","3BHK","4BHK","Studio","Duplex","Penthouse"], default: "2BHK" },
    area:       { type: Number, default: 0 },
    status:     { type: String, enum: ["occupied","vacant","maintenance"], default: "vacant" },
    resident:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    notes:      { type: String, default: "" },
  },
  { timestamps: true }
);

flatSchema.index({ wing: 1, flatNumber: 1 }, { unique: true });

module.exports = mongoose.model("Flat", flatSchema);