const router = require("express").Router();
const { getMyPayments } = require("../controllers/user.maintenance.controller");
const { protect, authorise } = require("../middleware/auth.middleware");

// All routes → logged-in resident only
router.use(protect, authorise("user"));

router.get("/", getMyPayments);

module.exports = router;
