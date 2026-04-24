const express = require("express");
const DataTruck = require("../models/DataTruck");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");
const { createNotification, getActorFromRequest } = require("../services/notificationService");

const router = express.Router();

const normalizeWialonUnitId = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return String(parsed);
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
    const status = String(req.query.status || "").trim().toLowerCase();
    const includeInactive = String(req.query.include_inactive || "").trim() === "1";
    const conditions = [];
    if (status === "active" || (!includeInactive && status !== "all")) {
      conditions.push("is_active = 1");
    } else if (status === "inactive") {
      conditions.push("is_active = 0");
    }
    const whereClause = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await db.query(
      `SELECT id_truck, jenis_kendaraan, no_police, merk_mobil, model, type_truck, wialon_unit_id, is_active FROM truck${whereClause} ORDER BY id_truck ASC`
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
      "SELECT id_truck, jenis_kendaraan, no_police, merk_mobil, model, type_truck, wialon_unit_id, is_active FROM truck WHERE id_truck = ?",
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
    const wialonUnitId = normalizeWialonUnitId(body.wialon_unit_id);

    const [result] = await db.query(
      "INSERT INTO truck (jenis_kendaraan, no_police, merk_mobil, model, type_truck, wialon_unit_id) VALUES (?, ?, ?, ?, ?, ?)",
      [jenisKendaraan, noPolice, merkMobil, model, typeTruck, wialonUnitId]
    );

    const [rows] = await db.query(
      "SELECT id_truck, jenis_kendaraan, no_police, merk_mobil, model, type_truck, wialon_unit_id, is_active FROM truck WHERE id_truck = ?",
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
    const wialonUnitId = normalizeWialonUnitId(body.wialon_unit_id);

    const [result] = await db.query(
      "UPDATE truck SET jenis_kendaraan = ?, no_police = ?, merk_mobil = ?, model = ?, type_truck = ?, wialon_unit_id = ? WHERE id_truck = ?",
      [jenisKendaraan, noPolice, merkMobil, model, typeTruck, wialonUnitId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Truck not found" });
    }

    const [rows] = await db.query(
      "SELECT id_truck, jenis_kendaraan, no_police, merk_mobil, model, type_truck, wialon_unit_id, is_active FROM truck WHERE id_truck = ?",
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

router.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const isActive = req.body?.is_active ? 1 : 0;

    const [result] = await db.query(
      "UPDATE truck SET is_active = ? WHERE id_truck = ?",
      [isActive, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Truck not found" });
    }

    const [rows] = await db.query(
      "SELECT id_truck, jenis_kendaraan, no_police, merk_mobil, model, type_truck, wialon_unit_id, is_active FROM truck WHERE id_truck = ?",
      [id]
    );

    const identifier = rows[0]?.no_police || `ID ${id}`;
    await notifyMasterChange({
      req,
      type: isActive ? "Activated-MasterTruck" : "Deactivated-MasterTruck",
      title: isActive ? "Master Truck diaktifkan" : "Master Truck dinonaktifkan",
      action: isActive ? "mengaktifkan" : "menonaktifkan",
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

    // Sync with MongoDB DataTruck: Remove operational data if it exists
    const noPolice = existingRows[0]?.no_police;
    if (noPolice) {
      try {
        await DataTruck.findOneAndDelete({ truck_no: noPolice });
      } catch (mongoErr) {
        console.error("Failed to delete MongoDB DataTruck entry", mongoErr);
      }
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
