const router = require("express").Router();
const {
  getAllFlats, getFlat, addFlat, updateFlat, deleteFlat, getResidentsList,
} = require("../controllers/flat.controller");
const { protect, authorise } = require("../middleware/auth.middleware");

router.use(protect, authorise("admin"));

router.get("/residents-list", getResidentsList);
router.get("/",    getAllFlats);
router.get("/:id", getFlat);
router.post("/",   addFlat);
router.put("/:id", updateFlat);
router.delete("/:id", deleteFlat);

module.exports = router;