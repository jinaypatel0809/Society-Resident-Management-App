const router = require("express").Router();
const { getReceipts, downloadReceiptPDF } = require("../controllers/payment.controller");
const { protect, authorise } = require("../middleware/auth.middleware");

// All routes → admin only
router.use(protect, authorise("admin"));

router.get("/",                getReceipts);
router.get("/:id/download",    downloadReceiptPDF);

module.exports = router;