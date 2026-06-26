const router = require("express").Router();
const {
  getCollectionReport, getResidentReport, getComplaintReport, getOccupancyReport,
} = require("../controllers/report.controller");
const { protect, authorise } = require("../middleware/auth.middleware");

// All routes → admin only
router.use(protect, authorise("admin"));

router.get("/collection",  getCollectionReport);
router.get("/residents",   getResidentReport);
router.get("/complaints",  getComplaintReport);
router.get("/occupancy",   getOccupancyReport);

module.exports = router;
