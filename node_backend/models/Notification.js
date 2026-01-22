const mongoose = require("mongoose");

const actorSchema = new mongoose.Schema(
  {
    id_admin: { type: Number, required: true },
    nama_admin: { type: String, default: "" },
    level: { type: String, default: "" },
    gambar: { type: String, default: "" }
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    actor: { type: actorSchema, required: false },
    entity: { type: String, default: "" },
    entityId: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: "notifications" }
);

notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
