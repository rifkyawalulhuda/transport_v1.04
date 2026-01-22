const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");
const { createNotification, getActorFromRequest } = require("../services/notificationService");

const router = express.Router();

const notifyMasterChange = async ({ req, type, title, action, identifier, entityId }) => {
  const actor = getActorFromRequest(req);
  if (!actor) {
    return;
  }
  try {
    const actorName = actor.nama_admin || "Admin";
    await createNotification({
      type,
      title,
      message: `${actorName} ${action} Master Area (${identifier})`,
      actor,
      entity: "area",
      entityId,
      meta: { route: "/master/areas" }
    });
  } catch (error) {
    console.error("Failed to create master area notification", error);
  }
};

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id_area, nama_area FROM area ORDER BY id_area ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query(
      "SELECT id_area, nama_area FROM area WHERE id_area = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Area not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const body = req.body || {};
    const namaArea = body.nama_area || "";

    const [result] = await db.query(
      "INSERT INTO area (nama_area) VALUES (?)",
      [namaArea]
    );

    const [rows] = await db.query(
      "SELECT id_area, nama_area FROM area WHERE id_area = ?",
      [result.insertId]
    );

    const identifier = rows[0]?.nama_area || `ID ${result.insertId}`;
    await notifyMasterChange({
      req,
      type: "Created-MasterArea",
      title: "Master Area ditambahkan",
      action: "menambahkan",
      identifier,
      entityId: result.insertId
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};
    const namaArea = body.nama_area || "";

    const [result] = await db.query(
      "UPDATE area SET nama_area = ? WHERE id_area = ?",
      [namaArea, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Area not found" });
    }

    const [rows] = await db.query(
      "SELECT id_area, nama_area FROM area WHERE id_area = ?",
      [id]
    );

    const identifier = rows[0]?.nama_area || `ID ${id}`;
    await notifyMasterChange({
      req,
      type: "Updated-MasterArea",
      title: "Master Area diperbarui",
      action: "memperbarui",
      identifier,
      entityId: id
    });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const [existingRows] = await db.query(
      "SELECT nama_area FROM area WHERE id_area = ?",
      [id]
    );
    const [result] = await db.query("DELETE FROM area WHERE id_area = ?", [
      id
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Area not found" });
    }
    const identifier = existingRows[0]?.nama_area || `ID ${id}`;
    await notifyMasterChange({
      req,
      type: "Deleted-MasterArea",
      title: "Master Area dihapus",
      action: "menghapus",
      identifier,
      entityId: id
    });
    res.json({ message: "Area deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
