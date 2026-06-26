const Notification = require("../models/Notification");
const User         = require("../models/User");

// ════════════════════════════════════════════════════════════════
// Resident-facing
// ════════════════════════════════════════════════════════════════

// GET /api/user/notifications
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ audience: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/user/notifications/unread-count
const getMyUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ audience: req.user._id, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/user/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, audience: req.user._id },
      { isRead: true }
    );
    res.json({ message: "Marked as read." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
// Back-compat alias (older route file referenced `markRead`)
const markRead = markAsRead;

// PATCH /api/user/notifications/mark-all-read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ audience: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: "All notifications marked as read." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
// Back-compat alias (older route file referenced `markAllRead`)
const markAllRead = markAllAsRead;

// ════════════════════════════════════════════════════════════════
// Admin-facing
// ════════════════════════════════════════════════════════════════

const ADMIN_CATEGORIES = [
  "announcement", "payment_submitted", "payment_overdue",
  "complaint_raised", "general",
];

// GET /api/admin/notifications
const getAdminNotifications = async (req, res) => {
  try {
    const { search, category } = req.query;

    // Admin alerts = anything with no specific resident audience,
    // OR announcements the admin itself sent (audience set, category announcement).
    const baseOr = { $or: [{ audience: null }, { category: "announcement" }] };
    const filter = category ? { $and: [baseOr, { category }] } : baseOr;

    let notifications = await Notification.find(filter)
      .populate("relatedResident", "name wing flatNumber")
      .sort({ createdAt: -1 })
      .limit(200);

    if (search) {
      const regex = new RegExp(search, "i");
      notifications = notifications.filter(
        (n) =>
          regex.test(n.title) ||
          regex.test(n.message) ||
          regex.test(n.relatedResident?.name || "")
      );
    }

    const all = await Notification.find({ $or: [{ audience: null }, { category: "announcement" }] });
    const summary = {
      total:         all.length,
      unread:        all.filter((n) => !n.seenByAdmin).length,
      announcements: all.filter((n) => n.category === "announcement").length,
      alerts:        all.filter((n) => n.category !== "announcement").length,
    };

    res.json({
      notifications: notifications.map((n) => ({
        ...n.toObject(),
        relatedResident: n.relatedResident
          ? { ...n.relatedResident.toObject() }
          : null,
      })),
      summary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/admin/notifications/unread-count
const getAdminUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      $or: [{ audience: null }, { category: "announcement" }],
      seenByAdmin: false,
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/admin/notifications  (send announcement to residents)
const createAnnouncement = async (req, res) => {
  try {
    const { title, message, audience } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ message: "Title and message are required." });
    }

    if (!audience || audience === "all") {
      // Broadcast to every active resident
      const residents = await User.find({ isActive: true }).select("_id");
      if (residents.length === 0) {
        return res.status(400).json({ message: "No residents to notify." });
      }
      const docs = residents.map((r) => ({
        audience:    r._id,
        title:       title.trim(),
        message:     message.trim(),
        category:    "announcement",
        seenByAdmin: true,
      }));
      await Notification.insertMany(docs);
      return res.status(201).json({ message: `Announcement sent to ${residents.length} resident(s)!` });
    }

    // Targeted to a single resident
    await Notification.create({
      audience:        audience,
      title:           title.trim(),
      message:         message.trim(),
      category:        "announcement",
      relatedResident: audience,
      seenByAdmin:     true,
    });

    res.status(201).json({ message: "Announcement sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/admin/notifications/:id/seen
const markSeenByAdmin = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { seenByAdmin: true });
    res.json({ message: "Marked as seen." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/admin/notifications/mark-all-seen
const markAllSeenByAdmin = async (req, res) => {
  try {
    await Notification.updateMany(
      { $or: [{ audience: null }, { category: "announcement" }], seenByAdmin: false },
      { seenByAdmin: true }
    );
    res.json({ message: "All notifications marked as seen." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/admin/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndDelete(req.params.id);
    if (!notif) return res.status(404).json({ message: "Notification not found." });
    res.json({ message: "Notification deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  // resident
  getMyNotifications, getMyUnreadCount, markAsRead, markAllAsRead,
  markRead, markAllRead, // back-compat aliases
  // admin
  getAdminNotifications, getAdminUnreadCount, createAnnouncement,
  markSeenByAdmin, markAllSeenByAdmin, deleteNotification,
};
