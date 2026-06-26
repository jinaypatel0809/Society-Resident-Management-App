const router = require("express").Router();
const { getProfile, updateProfile, changePassword } = require("../controllers/admin.profile.controller");
const { protect, authorise } = require("../middleware/auth.middleware");

// All routes → admin only
router.use(protect, authorise("admin"));

router.get("/",          getProfile);
router.put("/",          updateProfile);
router.patch("/password", changePassword);

module.exports = router;
