const jwt = require("jsonwebtoken");

const SECRET  = process.env.JWT_SECRET  || "change_this_secret_in_production";
const EXPIRES = process.env.JWT_EXPIRES || "7d";

/**
 * Generate a signed JWT
 * @param {Object} payload  – { id, role }
 */
const generateToken = (payload) =>
  jwt.sign(payload, SECRET, { expiresIn: EXPIRES });

/**
 * Verify & decode a JWT
 * Returns decoded payload or throws
 */
const verifyToken = (token) => jwt.verify(token, SECRET);

module.exports = { generateToken, verifyToken };
