const router = require("express").Router();
const { signup, signin, getMe } = require("../controllers/auth.user.controller");
const { protect, authorise }    = require("../middleware/auth.middleware");

// Public routes
router.post("/signup", signup);
router.post("/signin", signin);

// Protected routes (only logged-in users)
router.get("/me", protect, authorise("user"), getMe);

module.exports = router;
