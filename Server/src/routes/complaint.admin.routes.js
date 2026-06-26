const router = require("express").Router();
const {
  getAllComplaints, updateComplaintStatus, deleteComplaint,
} = require("../controllers/complaint.controller");
const { protect, authorise } = require("../middleware/auth.middleware");

// All routes → admin only
router.use(protect, authorise("admin"));

router.get("/",                 getAllComplaints);
router.patch("/:id/status",     updateComplaintStatus);
router.delete("/:id",           deleteComplaint);

module.exports = router;