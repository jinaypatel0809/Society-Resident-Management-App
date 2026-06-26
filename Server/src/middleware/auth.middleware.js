const { verifyToken } = require("../config/jwt");
const User  = require("../models/User");
const Admin = require("../models/Admin");

/**
 * Protect routes — verifies Bearer JWT
 * Attaches req.user and req.role
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided. Please sign in." });
    }

    const token   = authHeader.split(" ")[1];
    const decoded = verifyToken(token); // { id, role, iat, exp }

    // Load the real document from DB to ensure account still exists & is active
    if (decoded.role === "admin") {
      const admin = await Admin.findById(decoded.id).select("-password");
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Account not found or deactivated." });
      }
      req.user = admin;
      req.role = "admin";
    } else {
      const user = await User.findById(decoded.id).select("-password");
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Account not found or deactivated." });
      }
      req.user = user;
      req.role = "user";
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token. Please sign in again." });
  }
};

/**
 * Role-based guard — use AFTER protect()
 * Usage: authorise("admin")  or  authorise("user")
 */
const authorise = (...roles) => (req, res, next) => {
  if (!roles.includes(req.role)) {
    return res.status(403).json({ message: "Access denied. Insufficient permissions." });
  }
  next();
};

module.exports = { protect, authorise };
