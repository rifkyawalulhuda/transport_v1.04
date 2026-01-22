const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");
const { createNotification, getActorFromRequest } = require("../services/notificationService");

const router = express.Router();

const buildWarehouseIdentifier = (row, fallbackId) => {
  if (!row) {
    return `ID ${fallbackId}`;
  }
  if (row.kode_warehouse && row.nm_warehouse) {
    return `${row.kode_warehouse} - ${row.nm_warehouse}`;
  }
  return row.nm_warehouse || row.kode_warehouse || `ID ${fallbackId}`;
};

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
      message: `${actorName} ${action} Master Warehouse (${identifier})`,
      actor,
      entity: "warehouse",
      entityId,
      meta: { route: "/master/warehouses" }
    });
  } catch (error) {
    console.error("Failed to create master warehouse notification", error);
  }
};

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id_warehouse, kode_warehouse, nm_warehouse, pic_warehouse, alamat, kontak FROM warehouse ORDER BY id_warehouse ASC"
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
      "SELECT id_warehouse, kode_warehouse, nm_warehouse, pic_warehouse, alamat, kontak FROM warehouse WHERE id_warehouse = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Warehouse not found" });
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
    const kodeWarehouse = body.kode_warehouse || "";
    const namaWarehouse = body.nm_warehouse || "";
    const picWarehouse = body.pic_warehouse || "";
    const alamat = body.alamat || "";
    const kontak = body.kontak || "";

    const [result] = await db.query(
      "INSERT INTO warehouse (kode_warehouse, nm_warehouse, pic_warehouse, alamat, kontak) VALUES (?, ?, ?, ?, ?)",
      [kodeWarehouse, namaWarehouse, picWarehouse, alamat, kontak]
    );

    const [rows] = await db.query(
      "SELECT id_warehouse, kode_warehouse, nm_warehouse, pic_warehouse, alamat, kontak FROM warehouse WHERE id_warehouse = ?",
      [result.insertId]
    );

    const identifier = buildWarehouseIdentifier(rows[0], result.insertId);
    await notifyMasterChange({
      req,
      type: "Created-MasterWarehouse",
      title: "Master Warehouse ditambahkan",
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
    const kodeWarehouse = body.kode_warehouse || "";
    const namaWarehouse = body.nm_warehouse || "";
    const picWarehouse = body.pic_warehouse || "";
    const alamat = body.alamat || "";
    const kontak = body.kontak || "";

    const [result] = await db.query(
      "UPDATE warehouse SET kode_warehouse = ?, nm_warehouse = ?, pic_warehouse = ?, alamat = ?, kontak = ? WHERE id_warehouse = ?",
      [kodeWarehouse, namaWarehouse, picWarehouse, alamat, kontak, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    const [rows] = await db.query(
      "SELECT id_warehouse, kode_warehouse, nm_warehouse, pic_warehouse, alamat, kontak FROM warehouse WHERE id_warehouse = ?",
      [id]
    );

    const identifier = buildWarehouseIdentifier(rows[0], id);
    await notifyMasterChange({
      req,
      type: "Updated-MasterWarehouse",
      title: "Master Warehouse diperbarui",
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
      "SELECT kode_warehouse, nm_warehouse FROM warehouse WHERE id_warehouse = ?",
      [id]
    );
    const [result] = await db.query(
      "DELETE FROM warehouse WHERE id_warehouse = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    const identifier = buildWarehouseIdentifier(existingRows[0], id);
    await notifyMasterChange({
      req,
      type: "Deleted-MasterWarehouse",
      title: "Master Warehouse dihapus",
      action: "menghapus",
      identifier,
      entityId: id
    });
    res.json({ message: "Warehouse deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
