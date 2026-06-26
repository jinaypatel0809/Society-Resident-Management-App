const router = require("express").Router();
const {
  raiseComplaint, getMyComplaints, withdrawComplaint,
} = require("../controllers/complaint.controller");
const { protect, authorise } = require("../middleware/auth.middleware");

// All routes → logged-in resident only
router.use(protect, authorise("user"));

router.get("/",        getMyComplaints);
router.post("/",       raiseComplaint);
router.delete("/:id",  withdrawComplaint);

module.exports = router;