const router = require("express").Router();
const {
  getAdminNotifications, getAdminUnreadCount, createAnnouncement,
  markSeenByAdmin, markAllSeenByAdmin, deleteNotification,
} = require("../controllers/notification.controller");
const { protect, authorise } = require("../middleware/auth.middleware");

// All routes → admin only
router.use(protect, authorise("admin"));

router.get("/",                 getAdminNotifications);
router.get("/unread-count",     getAdminUnreadCount);
router.post("/",                createAnnouncement);
router.patch("/mark-all-seen",  markAllSeenByAdmin);
router.patch("/:id/seen",       markSeenByAdmin);
router.delete("/:id",           deleteNotification);

module.exports = router;