const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    firstName:      { type: String, required: true, trim: true },
    lastName:       { type: String, required: true, trim: true },
    email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:          { type: String, required: true, trim: true },
    societyName:    { type: String, required: true, trim: true },
    societyAddress: { type: String, required: true, trim: true },
    totalFlats:     { type: String, required: true },
    password:       { type: String, required: true, select: false }, // hidden by default
    isActive:       { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Virtual: full name
adminSchema.virtual("name").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
adminSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);
