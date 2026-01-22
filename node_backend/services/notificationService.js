const jwt = require("jsonwebtoken");
const Notification = require("../models/Notification");

const getActorFromRequest = (req) => {
  if (req?.user?.id_admin) {
    return {
      id_admin: Number(req.user.id_admin),
      nama_admin: req.user.nama_admin || "",
      level: req.user.level || "",
      gambar: req.user.gambar || ""
    };
  }

  const header = req?.headers?.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return null;
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }
  try {
    const payload = jwt.verify(token, secret);
    if (!payload?.id_admin) {
      return null;
    }
    return {
      id_admin: Number(payload.id_admin),
      nama_admin: payload.nama_admin || "",
      level: payload.level || "",
      gambar: payload.gambar || ""
    };
  } catch {
    return null;
  }
};

const createNotification = async (payload) => {
  try {
    if (!payload || !payload.type || !payload.title || !payload.message) {
      return null;
    }
    const doc = {
      type: payload.type,
      title: payload.title,
      message: payload.message,
      actor: payload.actor || undefined,
      entity: payload.entity || "",
      entityId: payload.entityId ? String(payload.entityId) : "",
      meta: payload.meta || {},
      createdAt: payload.createdAt || new Date()
    };
    return await Notification.create(doc);
  } catch (error) {
    console.error("Failed to create notification", error);
    return null;
  }
};

module.exports = {
  createNotification,
  getActorFromRequest
};
