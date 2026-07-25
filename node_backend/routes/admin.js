const express = require("express");
const db = require("../db");
const bcrypt = require("bcrypt");
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
      message: `${actorName} ${action} Master Admin (${identifier})`,
      actor,
      entity: "admin",
      entityId,
      meta: { route: "/master/admins" }
    });
  } catch (error) {
    console.error("Failed to create master admin notification", error);
  }
};

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id_admin, nik_admin, nama_admin, level, email, nomor_telp, jabatan, gambar FROM admin ORDER BY id_admin ASC"
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
      "SELECT id_admin, nik_admin, nama_admin, level, email, nomor_telp, jabatan, gambar FROM admin WHERE id_admin = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
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
    const nikAdmin = body.nik_admin || "";
    const namaAdmin = body.nama_admin || "";
    const password = body.password || "";
    const level = body.level || "";
    const email = body.email || "";
    const nomor_telp = body.nomor_telp || "";
    const jabatan = body.jabatan || "";
    const gambar = body.gambar || "";

    // Check if NIK already exists (case-sensitive)
    const [existingAdmin] = await db.query(
      "SELECT id_admin FROM admin WHERE BINARY nik_admin = ?",
      [nikAdmin]
    );

    if (existingAdmin.length > 0) {
      return res.status(400).json({ message: "NIK Admin sudah terdaftar" });
    }

    // Hash password before storing
    const hashedPassword = password ? await bcrypt.hash(password, 12) : "";

    const [result] = await db.query(
      "INSERT INTO admin (nik_admin, nama_admin, password, level, email, nomor_telp, jabatan, gambar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [nikAdmin, namaAdmin, hashedPassword, level, email, nomor_telp, jabatan, gambar]
    );

    const [rows] = await db.query(
      "SELECT id_admin, nik_admin, nama_admin, level, email, nomor_telp, jabatan, gambar FROM admin WHERE id_admin = ?",
      [result.insertId]
    );

    const identifier = rows[0]?.nama_admin || rows[0]?.nik_admin || `ID ${result.insertId}`;
    await notifyMasterChange({
      req,
      type: "Created-MasterAdmin",
      title: "Master Admin ditambahkan",
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
    const nikAdmin = body.nik_admin || "";
    const namaAdmin = body.nama_admin || "";
    const password = body.password || "";
    const level = body.level || "";
    const email = body.email || "";
    const nomor_telp = body.nomor_telp || "";
    const jabatan = body.jabatan || "";
    const gambar = body.gambar || "";

    // Check if NIK already exists (case-insensitive) and is not the current admin
    const [existingAdmin] = await db.query(
      "SELECT id_admin FROM admin WHERE nik_admin = ? AND id_admin != ?",
      [nikAdmin, id]
    );

    if (existingAdmin.length > 0) {
      return res.status(400).json({ message: "Data NIK sudah ada, tolong cek kembali" });
    }

    // Hash password before storing (only if password field provided and non-empty)
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    } else {
      // Preserve existing password — fetch current value
      const [existing] = await db.query("SELECT password FROM admin WHERE id_admin = ?", [id]);
      hashedPassword = existing[0]?.password || "";
    }

    const [result] = await db.query(
      "UPDATE admin SET nik_admin = ?, nama_admin = ?, password = ?, level = ?, email = ?, nomor_telp = ?, jabatan = ?, gambar = ? WHERE id_admin = ?",
      [nikAdmin, namaAdmin, hashedPassword, level, email, nomor_telp, jabatan, gambar, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const [rows] = await db.query(
      "SELECT id_admin, nik_admin, nama_admin, level, email, nomor_telp, jabatan, gambar FROM admin WHERE id_admin = ?",
      [id]
    );

    const identifier = rows[0]?.nama_admin || rows[0]?.nik_admin || `ID ${id}`;
    await notifyMasterChange({
      req,
      type: "Updated-MasterAdmin",
      title: "Master Admin diperbarui",
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
      "SELECT nik_admin, nama_admin FROM admin WHERE id_admin = ?",
      [id]
    );
    const [result] = await db.query(
      "DELETE FROM admin WHERE id_admin = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }
    const identifier = existingRows[0]?.nama_admin || existingRows[0]?.nik_admin || `ID ${id}`;
    await notifyMasterChange({
      req,
      type: "Deleted-MasterAdmin",
      title: "Master Admin dihapus",
      action: "menghapus",
      identifier,
      entityId: id
    });
    res.json({ message: "Admin deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
