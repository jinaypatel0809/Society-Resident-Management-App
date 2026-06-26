const router = require("express").Router();
const {
  getAllBills, getBill, addBill, updateBill, markPaid, deleteBill,
} = require("../controllers/maintenance.controller");
const { protect, authorise } = require("../middleware/auth.middleware");

// All routes → admin only
router.use(protect, authorise("admin"));

router.get("/",                    getAllBills);
router.get("/:id",                 getBill);
router.post("/",                   addBill);
router.put("/:id",                 updateBill);
router.patch("/:id/mark-paid",     markPaid);
router.delete("/:id",              deleteBill);

module.exports = router;