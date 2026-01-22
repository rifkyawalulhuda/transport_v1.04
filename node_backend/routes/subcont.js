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
      message: `${actorName} ${action} Master Subcont (${identifier})`,
      actor,
      entity: "subcont",
      entityId,
      meta: { route: "/master/subconts" }
    });
  } catch (error) {
    console.error("Failed to create master subcont notification", error);
  }
};

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id_subcont, nama_subcont, pic_subcont, alamat, no_telp FROM subcont ORDER BY id_subcont ASC"
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
      "SELECT id_subcont, nama_subcont, pic_subcont, alamat, no_telp FROM subcont WHERE id_subcont = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Subcont not found" });
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
    const namaSubcont = body.nama_subcont || "";
    const picSubcont = body.pic_subcont || "";
    const alamat = body.alamat || "";
    const noTelp = body.no_telp || "";

    const [result] = await db.query(
      "INSERT INTO subcont (nama_subcont, pic_subcont, alamat, no_telp) VALUES (?, ?, ?, ?)",
      [namaSubcont, picSubcont, alamat, noTelp]
    );

    const [rows] = await db.query(
      "SELECT id_subcont, nama_subcont, pic_subcont, alamat, no_telp FROM subcont WHERE id_subcont = ?",
      [result.insertId]
    );

    const identifier = rows[0]?.nama_subcont || `ID ${result.insertId}`;
    await notifyMasterChange({
      req,
      type: "Created-MasterSubcont",
      title: "Master Subcont ditambahkan",
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
    const namaSubcont = body.nama_subcont || "";
    const picSubcont = body.pic_subcont || "";
    const alamat = body.alamat || "";
    const noTelp = body.no_telp || "";

    const [result] = await db.query(
      "UPDATE subcont SET nama_subcont = ?, pic_subcont = ?, alamat = ?, no_telp = ? WHERE id_subcont = ?",
      [namaSubcont, picSubcont, alamat, noTelp, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Subcont not found" });
    }

    const [rows] = await db.query(
      "SELECT id_subcont, nama_subcont, pic_subcont, alamat, no_telp FROM subcont WHERE id_subcont = ?",
      [id]
    );

    const identifier = rows[0]?.nama_subcont || `ID ${id}`;
    await notifyMasterChange({
      req,
      type: "Updated-MasterSubcont",
      title: "Master Subcont diperbarui",
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
      "SELECT nama_subcont FROM subcont WHERE id_subcont = ?",
      [id]
    );
    const [result] = await db.query(
      "DELETE FROM subcont WHERE id_subcont = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Subcont not found" });
    }
    const identifier = existingRows[0]?.nama_subcont || `ID ${id}`;
    await notifyMasterChange({
      req,
      type: "Deleted-MasterSubcont",
      title: "Master Subcont dihapus",
      action: "menghapus",
      identifier,
      entityId: id
    });
    res.json({ message: "Subcont deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
