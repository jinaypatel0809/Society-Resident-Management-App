const router = require("express").Router();
const {
  getAllPayments, getPayment, addPayment,
  verifyPayment, rejectPayment, deletePayment,
} = require("../controllers/payment.controller");
const { protect, authorise } = require("../middleware/auth.middleware");

router.use(protect, authorise("admin"));

router.get("/",                   getAllPayments);
router.get("/:id",                getPayment);
router.post("/",                  addPayment);
router.patch("/:id/verify",       verifyPayment);   // ← Verify
router.patch("/:id/reject",       rejectPayment);   // ← Reject
router.delete("/:id",             deletePayment);

module.exports = router;