const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:      { type: String, required: true, trim: true },
    flatNumber: { type: String, required: true, trim: true },
    wing:       { type: String, trim: true, default: "" },
    floor:      { type: String, trim: true, default: "" },
    ownerType:  { type: String, enum: ["owner", "tenant"], default: "owner" },
    password:   { type: String, required: true, select: false }, // hidden by default
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
