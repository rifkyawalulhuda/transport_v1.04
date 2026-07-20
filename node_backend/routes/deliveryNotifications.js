const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");
const { markRead, markAllRead, dismiss } = require("../services/deliveryNotificationReadService");

const router = express.Router();
router.use(authenticateToken);

// GET /api/delivery-notifications?unread=true
router.get("/", async (req, res) => {
  try {
    const idAdmin = req.user?.id_admin;
    if (!idAdmin) return res.status(400).json({ message: "User tidak ditemukan" });

    const unreadOnly = req.query.unread === "true";

    // Fetch all non-dismissed notifications for this user
    const [[rows], [[countRow]]] = await Promise.all([
      db.query(
        `SELECT
           dn.id,
           dn.id_sales_cost,
           dn.id_sc_stop,
           dn.step_name,
           dn.notification_type,
           dn.truck_plate,
           dn.route_name,
           dn.scheduled_arrival,
           dn.message,
           dn.created_at,
           CASE WHEN dnr.read_at IS NOT NULL THEN 1 ELSE 0 END AS is_read
         FROM delivery_notifications dn
         LEFT JOIN delivery_notification_read dnr
           ON dnr.id_delivery_notification = dn.id AND dnr.id_admin = ?
         WHERE dn.is_dismissed = 0
           AND (dnr.dismissed_at IS NULL OR dnr.id IS NULL)
           ${unreadOnly ? "AND dnr.read_at IS NULL" : ""}
         ORDER BY dn.created_at DESC
         LIMIT 50`,
        [idAdmin]
      ),
      db.query(
        `SELECT COUNT(*) AS cnt
         FROM delivery_notifications dn
         LEFT JOIN delivery_notification_read dnr
           ON dnr.id_delivery_notification = dn.id AND dnr.id_admin = ?
         WHERE dn.is_dismissed = 0
           AND dnr.read_at IS NULL
           AND (dnr.dismissed_at IS NULL OR dnr.id IS NULL)`,
        [idAdmin]
      )
    ]);

    res.json({ notifications: rows, unread_count: Number(countRow?.cnt || 0) });
  } catch (err) {
    console.error("deliveryNotifications GET error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/delivery-notifications/list
// Query: status ("unread"|"read"|"all"), search, page, pageSize
router.get("/list", async (req, res) => {
  try {
    const idAdmin = req.user?.id_admin;
    if (!idAdmin) return res.status(400).json({ message: "User tidak ditemukan" });

    const status = String(req.query.status || "all").trim();
    const search = String(req.query.search || "").trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const offset = (page - 1) * pageSize;

    const conditions = ["dn.is_dismissed = 0"];
    const params = [idAdmin]; // for the LEFT JOIN

    // Status filter based on per-user read state
    if (status === "unread") {
      conditions.push("dnr.read_at IS NULL");
    } else if (status === "read") {
      conditions.push("dnr.read_at IS NOT NULL");
    }

    // Always exclude notifications dismissed by this user
    conditions.push("(dnr.dismissed_at IS NULL OR dnr.id IS NULL)");

    if (search) {
      conditions.push("(dn.truck_plate LIKE ? OR dn.route_name LIKE ? OR dn.step_name LIKE ?)");
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const whereSql = `WHERE ${conditions.join(" AND ")}`;

    // Count total matching items
    const [[countRow]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM delivery_notifications dn
       LEFT JOIN delivery_notification_read dnr
         ON dnr.id_delivery_notification = dn.id AND dnr.id_admin = ?
       ${whereSql}`,
      params
    );

    // Count unread for this user (all non-dismissed unread notifications)
    const [[unreadRow]] = await db.query(
      `SELECT COUNT(*) AS cnt
       FROM delivery_notifications dn
       LEFT JOIN delivery_notification_read dnr
         ON dnr.id_delivery_notification = dn.id AND dnr.id_admin = ?
       WHERE dn.is_dismissed = 0
         AND dnr.read_at IS NULL
         AND (dnr.dismissed_at IS NULL OR dnr.id IS NULL)`,
      [idAdmin]
    );

    const totalItems = Number(countRow?.total || 0);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    const [rows] = await db.query(
      `SELECT
         dn.id,
         dn.id_sales_cost,
         dn.id_sc_stop,
         dn.step_name,
         dn.notification_type,
         dn.truck_plate,
         dn.route_name,
         dn.scheduled_arrival,
         dn.message,
         dn.created_at,
         CASE WHEN dnr.read_at IS NOT NULL THEN 1 ELSE 0 END AS is_read,
         dnr.read_at
       FROM delivery_notifications dn
       LEFT JOIN delivery_notification_read dnr
         ON dnr.id_delivery_notification = dn.id AND dnr.id_admin = ?
       ${whereSql}
       ORDER BY dn.created_at DESC
       LIMIT ? OFFSET ?`,
      [idAdmin, ...params.slice(1), pageSize, offset]
    );

    res.json({
      rows,
      meta: {
        totalItems,
        totalPages,
        page,
        pageSize,
        unread_count: Number(unreadRow?.cnt || 0)
      }
    });
  } catch (err) {
    console.error("deliveryNotifications list error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/delivery-notifications/read-all
router.put("/read-all", async (req, res) => {
  try {
    const idAdmin = req.user?.id_admin;
    if (!idAdmin) return res.status(400).json({ message: "User tidak ditemukan" });

    await markAllRead(idAdmin);
    res.json({ message: "Semua notifikasi ditandai dibaca." });
  } catch (err) {
    console.error("deliveryNotifications read-all error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/delivery-notifications/:id/read
router.put("/:id/read", async (req, res) => {
  try {
    const idAdmin = req.user?.id_admin;
    if (!idAdmin) return res.status(400).json({ message: "User tidak ditemukan" });

    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "ID tidak valid." });

    await markRead(id, idAdmin);
    res.json({ message: "Notifikasi ditandai dibaca." });
  } catch (err) {
    console.error("deliveryNotifications read error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/delivery-notifications/:id
router.delete("/:id", async (req, res) => {
  try {
    const idAdmin = req.user?.id_admin;
    if (!idAdmin) return res.status(400).json({ message: "User tidak ditemukan" });

    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "ID tidak valid." });

    await dismiss(id, idAdmin);
    res.json({ message: "Notifikasi dihapus." });
  } catch (err) {
    console.error("deliveryNotifications delete error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
