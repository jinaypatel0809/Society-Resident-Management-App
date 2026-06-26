const router = require("express").Router();
const { getMyBills, getMyBill, submitPayment } = require("../controllers/user.maintenance.controller");
const { protect, authorise } = require("../middleware/auth.middleware");

router.use(protect, authorise("user"));

router.get("/",            getMyBills);
router.get("/:id",         getMyBill);
router.post("/:id/pay",    submitPayment);   // ← Pay Now

module.exports = router;