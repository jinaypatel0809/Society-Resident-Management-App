const router = require("express").Router();
const { unifiedSignin } = require("../controllers/auth.unified.controller");

// Single smart login endpoint — detects role automatically
router.post("/signin", unifiedSignin);

module.exports = router;
