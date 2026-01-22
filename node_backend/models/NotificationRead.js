const mongoose = require("mongoose");

const notificationReadSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
      required: true
    },
    id_admin: { type: Number, required: true },
    readAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null }
  },
  { collection: "notification_reads" }
);

notificationReadSchema.index({ notificationId: 1, id_admin: 1 }, { unique: true });
notificationReadSchema.index({ id_admin: 1, readAt: -1 });
notificationReadSchema.index({ id_admin: 1, deletedAt: -1 });

module.exports = mongoose.model("NotificationRead", notificationReadSchema);
