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
      message: `${actorName} ${action} Master Driver (${identifier})`,
      actor,
      entity: "driver",
      entityId,
      meta: { route: "/master/drivers" }
    });
  } catch (error) {
    console.error("Failed to create master driver notification", error);
  }
};

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id_driver, no_polisi, nama_driver, no_telp, no_ktp, alamat FROM driver ORDER BY id_driver ASC"
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
      "SELECT id_driver, no_polisi, nama_driver, no_telp, no_ktp, alamat FROM driver WHERE id_driver = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
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
    const noPolisi = body.no_polisi || "";
    const namaDriver = body.nama_driver || "";
    const noTelp = body.no_telp || "";
    const noKtp = body.no_ktp || "";
    const alamat = body.alamat || "";

    const [result] = await db.query(
      "INSERT INTO driver (no_polisi, nama_driver, no_telp, no_ktp, alamat) VALUES (?, ?, ?, ?, ?)",
      [noPolisi, namaDriver, noTelp, noKtp, alamat]
    );

    const [rows] = await db.query(
      "SELECT id_driver, no_polisi, nama_driver, no_telp, no_ktp, alamat FROM driver WHERE id_driver = ?",
      [result.insertId]
    );

    const identifier = rows[0]?.nama_driver || rows[0]?.no_polisi || `ID ${result.insertId}`;
    await notifyMasterChange({
      req,
      type: "Created-MasterDriver",
      title: "Master Driver ditambahkan",
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
    const noPolisi = body.no_polisi || "";
    const namaDriver = body.nama_driver || "";
    const noTelp = body.no_telp || "";
    const noKtp = body.no_ktp || "";
    const alamat = body.alamat || "";

    const [result] = await db.query(
      "UPDATE driver SET no_polisi = ?, nama_driver = ?, no_telp = ?, no_ktp = ?, alamat = ? WHERE id_driver = ?",
      [noPolisi, namaDriver, noTelp, noKtp, alamat, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const [rows] = await db.query(
      "SELECT id_driver, no_polisi, nama_driver, no_telp, no_ktp, alamat FROM driver WHERE id_driver = ?",
      [id]
    );

    const identifier = rows[0]?.nama_driver || rows[0]?.no_polisi || `ID ${id}`;
    await notifyMasterChange({
      req,
      type: "Updated-MasterDriver",
      title: "Master Driver diperbarui",
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
      "SELECT nama_driver, no_polisi FROM driver WHERE id_driver = ?",
      [id]
    );
    const [result] = await db.query("DELETE FROM driver WHERE id_driver = ?", [
      id
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }
    const identifier =
      existingRows[0]?.nama_driver || existingRows[0]?.no_polisi || `ID ${id}`;
    await notifyMasterChange({
      req,
      type: "Deleted-MasterDriver",
      title: "Master Driver dihapus",
      action: "menghapus",
      identifier,
      entityId: id
    });
    res.json({ message: "Driver deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
