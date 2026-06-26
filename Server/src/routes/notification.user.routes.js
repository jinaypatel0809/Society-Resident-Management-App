const router = require("express").Router();
const {
  getMyNotifications, getMyUnreadCount, markAsRead, markAllAsRead,
} = require("../controllers/notification.controller");
const { protect, authorise } = require("../middleware/auth.middleware");

// All routes → logged-in resident only
router.use(protect, authorise("user"));

router.get("/",                getMyNotifications);
router.get("/unread-count",    getMyUnreadCount);
router.patch("/read-all",      markAllAsRead);
router.patch("/:id/read",      markAsRead);

module.exports = router;