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
      message: `${actorName} ${action} Master Truck (${identifier})`,
      actor,
      entity: "truck",
      entityId,
      meta: { route: "/master/trucks" }
    });
  } catch (error) {
    console.error("Failed to create master truck notification", error);
  }
};

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id_truck, jenis_kendaraan, no_police, merk_mobil, model, type_truck FROM truck ORDER BY id_truck ASC"
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
      "SELECT id_truck, jenis_kendaraan, no_police, merk_mobil, model, type_truck FROM truck WHERE id_truck = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Truck not found" });
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
    const jenisKendaraan = body.jenis_kendaraan || "";
    const noPolice = body.no_police || "";
    const merkMobil = body.merk_mobil || "";
    const model = body.model || "";
    const typeTruck = body.type_truck || "";

    const [result] = await db.query(
      "INSERT INTO truck (jenis_kendaraan, no_police, merk_mobil, model, type_truck) VALUES (?, ?, ?, ?, ?)",
      [jenisKendaraan, noPolice, merkMobil, model, typeTruck]
    );

    const [rows] = await db.query(
      "SELECT id_truck, jenis_kendaraan, no_police, merk_mobil, model, type_truck FROM truck WHERE id_truck = ?",
      [result.insertId]
    );

    const identifier = rows[0]?.no_police || `ID ${result.insertId}`;
    await notifyMasterChange({
      req,
      type: "Created-MasterTruck",
      title: "Master Truck ditambahkan",
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
    const jenisKendaraan = body.jenis_kendaraan || "";
    const noPolice = body.no_police || "";
    const merkMobil = body.merk_mobil || "";
    const model = body.model || "";
    const typeTruck = body.type_truck || "";

    const [result] = await db.query(
      "UPDATE truck SET jenis_kendaraan = ?, no_police = ?, merk_mobil = ?, model = ?, type_truck = ? WHERE id_truck = ?",
      [jenisKendaraan, noPolice, merkMobil, model, typeTruck, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Truck not found" });
    }

    const [rows] = await db.query(
      "SELECT id_truck, jenis_kendaraan, no_police, merk_mobil, model, type_truck FROM truck WHERE id_truck = ?",
      [id]
    );

    const identifier = rows[0]?.no_police || `ID ${id}`;
    await notifyMasterChange({
      req,
      type: "Updated-MasterTruck",
      title: "Master Truck diperbarui",
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
      "SELECT no_police FROM truck WHERE id_truck = ?",
      [id]
    );
    const [result] = await db.query("DELETE FROM truck WHERE id_truck = ?", [
      id
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Truck not found" });
    }
    const identifier = existingRows[0]?.no_police || `ID ${id}`;
    await notifyMasterChange({
      req,
      type: "Deleted-MasterTruck",
      title: "Master Truck dihapus",
      action: "menghapus",
      identifier,
      entityId: id
    });
    res.json({ message: "Truck deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
