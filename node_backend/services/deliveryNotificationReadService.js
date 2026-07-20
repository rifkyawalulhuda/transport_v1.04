const db = require("../db");

/**
 * Per-user read/dismiss state for delivery notifications.
 * Each row represents one user's view of one notification.
 * read_at NULL = not yet read, dismissed_at NULL = not dismissed.
 */

const getReadStates = async (notificationIds, adminId) => {
  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return new Map();
  }
  const placeholders = notificationIds.map(() => "?").join(",");
  const [rows] = await db.query(
    `SELECT id_delivery_notification, read_at, dismissed_at
     FROM delivery_notification_read
     WHERE id_delivery_notification IN (${placeholders}) AND id_admin = ?`,
    [...notificationIds, adminId]
  );
  const map = new Map();
  rows.forEach((row) => {
    map.set(Number(row.id_delivery_notification), {
      is_read: row.read_at !== null,
      dismissed_at: row.dismissed_at
    });
  });
  return map;
};

const markRead = async (notificationId, adminId) => {
  // INSERT IGNORE: if a record already exists (user already read this), do nothing
  await db.query(
    `INSERT IGNORE INTO delivery_notification_read
       (id_delivery_notification, id_admin, read_at)
     VALUES (?, ?, NOW())`,
    [notificationId, adminId]
  );
};

const markAllRead = async (adminId) => {
  // Insert read records for all notifications that are not yet read by this user
  // and not dismissed by this user
  await db.query(
    `INSERT IGNORE INTO delivery_notification_read
       (id_delivery_notification, id_admin, read_at)
     SELECT dn.id, ?, NOW()
     FROM delivery_notifications dn
     LEFT JOIN delivery_notification_read dnr
       ON dnr.id_delivery_notification = dn.id AND dnr.id_admin = ?
     WHERE dn.is_dismissed = 0
       AND (dnr.read_at IS NULL OR dnr.id IS NULL)`,
    [adminId, adminId]
  );
};

const dismiss = async (notificationId, adminId) => {
  // Upsert: insert if not exists, update dismissed_at if exists
  await db.query(
    `INSERT INTO delivery_notification_read
       (id_delivery_notification, id_admin, dismissed_at)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE dismissed_at = NOW()`,
    [notificationId, adminId]
  );
};

const getDismissedIds = async (adminId) => {
  const [rows] = await db.query(
    `SELECT id_delivery_notification FROM delivery_notification_read
     WHERE id_admin = ? AND dismissed_at IS NOT NULL`,
    [adminId]
  );
  return rows.map((r) => Number(r.id_delivery_notification));
};

module.exports = {
  getReadStates,
  markRead,
  markAllRead,
  dismiss,
  getDismissedIds
};
