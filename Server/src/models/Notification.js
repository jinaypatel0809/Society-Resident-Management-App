const mongoose = require("mongoose");

/**
 * Unified Notification model.
 *
 * Two kinds of notifications live in this single collection:
 *
 *  1. Resident notifications  → audience = a User _id (the resident this is for)
 *  2. Admin notifications     → audience = null        (means "for admin")
 *
 * `category` drives admin-side grouping (announcement / payment_submitted /
 * payment_overdue / bill_added / complaint_raised / complaint_update / general).
 * `type` is kept as an alias of `category` so older resident-facing code
 * (which reads `n.type`) keeps working without changes.
 */
const notificationSchema = new mongoose.Schema(
  {
    // Who this notification is for.
    // - Set to a resident's User _id  → shows up on that resident's bell.
    // - Left null                     → shows up on the admin's bell (admin-only alert).
    audience: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    title:   { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },

    category: {
      type: String,
      enum: [
        "announcement",          // admin -> residents broadcast
        "bill_added",            // admin added a new maintenance bill -> resident
        "payment_submitted",     // resident paid -> admin alert
        "payment_verified",      // admin verified payment -> resident
        "payment_rejected",      // admin rejected payment -> resident
        "payment_overdue",       // system alert -> admin
        "complaint_raised",      // resident raised complaint -> admin
        "complaint_update",      // admin updated complaint -> resident
        "general",
      ],
      default: "general",
    },

    // Read/seen flags — resident side uses `isRead`, admin side uses `seenByAdmin`.
    isRead:      { type: Boolean, default: false },
    seenByAdmin: { type: Boolean, default: false },

    // Cross-references, all optional.
    relatedResident:    { type: mongoose.Schema.Types.ObjectId, ref: "User",        default: null },
    relatedComplaint:   { type: mongoose.Schema.Types.ObjectId, ref: "Complaint",   default: null },
    relatedMaintenance: { type: mongoose.Schema.Types.ObjectId, ref: "Maintenance", default: null },
    relatedPayment:     { type: mongoose.Schema.Types.ObjectId, ref: "Payment",     default: null },

    // Legacy field some older code referenced as a generic pointer.
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

// `type` mirrors `category` so existing resident-side code (`n.type`) keeps working.
notificationSchema.virtual("type").get(function () {
  return this.category;
});

// `userId` mirrors `audience` so existing resident-side queries (`{ userId }`) keep working.
notificationSchema.virtual("userId").get(function () {
  return this.audience;
});

notificationSchema.set("toJSON",   { virtuals: true });
notificationSchema.set("toObject", { virtuals: true });

notificationSchema.index({ audience: 1, createdAt: -1 });
notificationSchema.index({ category: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
