const router = require("express").Router();
const { signup, signin, getMe, updateProfile, changePassword } = require("../controllers/auth.admin.controller");
const { protect, authorise }    = require("../middleware/auth.middleware");

// Public routes
router.post("/signup", signup);
router.post("/signin", signin);

// Protected routes (only logged-in admins)
router.get("/me",              protect, authorise("admin"), getMe);
router.put("/profile",         protect, authorise("admin"), updateProfile);
router.put("/change-password", protect, authorise("admin"), changePassword);

module.exports = router;