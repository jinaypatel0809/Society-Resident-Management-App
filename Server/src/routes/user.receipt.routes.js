const router = require("express").Router();
const { getMyReceipts, downloadMyReceiptPDF } = require("../controllers/payment.controller");
const { protect, authorise } = require("../middleware/auth.middleware");

// All routes → logged-in resident only
router.use(protect, authorise("user"));

router.get("/",             getMyReceipts);
router.get("/:id/download", downloadMyReceiptPDF);

module.exports = router;
