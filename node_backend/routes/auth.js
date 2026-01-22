const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const uploadDir = path.resolve(__dirname, "..", "img");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const idAdmin = req.user?.id_admin || "unknown";
    const timestamp = Date.now();
    cb(null, `user_${idAdmin}_${timestamp}${ext}`);
  }
});

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error("Format file tidak didukung"));
      return;
    }
    cb(null, true);
  }
});

router.post("/login", async (req, res) => {
  const body = req.body || {};
  const nikAdmin = body.nik_admin || "";
  const password = body.password || "";

  if (!nikAdmin || !password) {
    return res
      .status(400)
      .json({ success: false, message: "NIK dan password wajib diisi" });
  }

  try {
    const [rows] = await db.query(
      "SELECT id_admin, nik_admin, nama_admin, level, gambar FROM admin WHERE nik_admin=? AND password=? LIMIT 1",
      [nikAdmin, password]
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "NIK atau password salah" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET belum dikonfigurasi");
      return res
        .status(500)
        .json({ success: false, message: "JWT secret belum dikonfigurasi" });
    }

    const user = rows[0];
    // TODO: migrasi password ke hash (bcrypt) dan lakukan compare hash.
    const token = jwt.sign(
      {
        id_admin: user.id_admin,
        nik_admin: user.nik_admin,
        nama_admin: user.nama_admin,
        level: user.level,
        gambar: user.gambar || ""
      },
      secret,
      { expiresIn: "1d" }
    );

    return res.json({ success: true, token, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const idAdmin = req.user?.id_admin;
    const nikAdmin = req.user?.nik_admin;

    if (!idAdmin && !nikAdmin) {
      return res.status(400).json({ message: "User tidak ditemukan" });
    }

    const query = idAdmin
      ? "SELECT id_admin, nik_admin, nama_admin, level, gambar FROM admin WHERE id_admin = ? LIMIT 1"
      : "SELECT id_admin, nik_admin, nama_admin, level, gambar FROM admin WHERE nik_admin = ? LIMIT 1";
    const [rows] = await db.query(query, [idAdmin || nikAdmin]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    return res.json({ user: rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/me", authenticateToken, (req, res) => {
  upload.single("gambar")(req, res, async (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Ukuran file maksimal 2MB"
          : err.message || "Upload gagal";
      return res.status(400).json({ message });
    }

    try {
      const idAdmin = req.user?.id_admin;
      const nikAdmin = req.user?.nik_admin;
      const namaAdmin =
        typeof req.body.nama_admin === "string"
          ? req.body.nama_admin.trim()
          : "";

      if (!idAdmin && !nikAdmin) {
        return res.status(400).json({ message: "User tidak ditemukan" });
      }

      if (!namaAdmin) {
        return res.status(400).json({ message: "Nama wajib diisi" });
      }

      const lookupQuery = idAdmin
        ? "SELECT id_admin, nik_admin, nama_admin, level, gambar FROM admin WHERE id_admin = ? LIMIT 1"
        : "SELECT id_admin, nik_admin, nama_admin, level, gambar FROM admin WHERE nik_admin = ? LIMIT 1";
      const [rows] = await db.query(lookupQuery, [idAdmin || nikAdmin]);

      if (rows.length === 0) {
        return res.status(404).json({ message: "User tidak ditemukan" });
      }

      const existing = rows[0];
      let updatedImage = existing.gambar || null;

      if (req.file) {
        updatedImage = req.file.filename;
      }

      if (req.file) {
        await db.query(
          "UPDATE admin SET nama_admin = ?, gambar = ? WHERE id_admin = ?",
          [namaAdmin, updatedImage, existing.id_admin]
        );
      } else {
        await db.query("UPDATE admin SET nama_admin = ? WHERE id_admin = ?", [
          namaAdmin,
          existing.id_admin
        ]);
      }

      if (req.file) {
        const oldImage = existing.gambar;
        if (oldImage && oldImage !== "default.jpg" && oldImage !== updatedImage) {
          const oldPath = path.join(uploadDir, oldImage);
          fs.unlink(oldPath, (unlinkErr) => {
            if (unlinkErr && unlinkErr.code !== "ENOENT") {
              console.error("Failed to delete old image", unlinkErr);
            }
          });
        }
      }

      const [updatedRows] = await db.query(
        "SELECT id_admin, nik_admin, nama_admin, level, gambar FROM admin WHERE id_admin = ? LIMIT 1",
        [existing.id_admin]
      );

      return res.json({ user: updatedRows[0] });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
});

module.exports = router;
