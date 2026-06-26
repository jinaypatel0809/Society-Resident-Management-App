const router = require("express").Router();
const {
  getAllResidents, getResident, addResident,
  updateResident, toggleStatus, deleteResident,
} = require("../controllers/resident.controller");
const { protect, authorise } = require("../middleware/auth.middleware");

// All routes → admin only
router.use(protect, authorise("admin"));

router.get("/",           getAllResidents);
router.get("/:id",        getResident);
router.post("/",          addResident);
router.put("/:id",        updateResident);
router.patch("/:id/toggle-status", toggleStatus);
router.delete("/:id",     deleteResident);

module.exports = router;