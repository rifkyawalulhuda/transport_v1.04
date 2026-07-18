const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
router.use(authenticateToken);

// GET /api/delivery-notifications?unread=true
router.get("/", async (req, res) => {
  try {
    const unreadOnly = req.query.unread === "true";
    const conditions = ["is_dismissed = 0"];
    if (unreadOnly) conditions.push("is_read = 0");
    const [[rows], [[countRow]]] = await Promise.all([
      db.query(
        `SELECT * FROM delivery_notifications WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC LIMIT 50`
      ),
      db.query(
        'SELECT COUNT(*) AS cnt FROM delivery_notifications WHERE is_read = 0 AND is_dismissed = 0'
      )
    ]);
    const unreadCount = Number(countRow?.cnt || 0);
    res.json({ notifications: rows, unread_count: unreadCount });
  } catch (err) {
    console.error("deliveryNotifications GET error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/delivery-notifications/read-all
router.put("/read-all", async (req, res) => {
  try {
    await db.query(
      "UPDATE delivery_notifications SET is_read = 1, read_at = NOW() WHERE is_read = 0 AND is_dismissed = 0"
    );
    res.json({ message: "Semua notifikasi ditandai dibaca." });
  } catch (err) {
    console.error("deliveryNotifications read-all error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/delivery-notifications/:id/read
router.put("/:id/read", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "ID tidak valid." });
    await db.query(
      "UPDATE delivery_notifications SET is_read = 1, read_at = NOW() WHERE id = ?",
      [id]
    );
    res.json({ message: "Notifikasi ditandai dibaca." });
  } catch (err) {
    console.error("deliveryNotifications read error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/delivery-notifications/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "ID tidak valid." });
    await db.query(
      "UPDATE delivery_notifications SET is_dismissed = 1 WHERE id = ?",
      [id]
    );
    res.json({ message: "Notifikasi dihapus." });
  } catch (err) {
    console.error("deliveryNotifications delete error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
