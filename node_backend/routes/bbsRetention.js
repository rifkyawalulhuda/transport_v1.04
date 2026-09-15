/**
 * BBS Retention — endpoint admin untuk pratinjau & penghapusan data kedaluwarsa
 * (ADAS & Speed) berdasarkan pengaturan retensi di bbs_settings.
 *
 * HAK AKSES: seluruh endpoint di router ini HANYA untuk level 'admin'.
 * Semua operasi destruktif memakai konfirmasi 2 langkah
 * (tanpa `confirm=true` hanya melaporkan dampak, tidak menulis apa pun).
 */

const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const retention = require("../services/retentionService");

const router = express.Router();
router.use(authenticateToken);

const isAdmin = (req) => String(req.user?.level || "") === "admin";

/** Baca daftar modul terpilih (default keduanya). */
const parseModules = (req) =>
  retention.parseModules(req.body?.modules ?? req.query?.modules);

router.get("/", async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Hanya admin yang dapat melihat pengaturan retensi." });
    }
    const settings = await retention.getRetentionSettings();
    res.json({
      settings,
      defaults: retention.RETENTION_DEFAULTS,
      bounds: retention.RETENTION_BOUNDS,
      labels: retention.RETENTION_LABELS,
      can_edit: true
    });
  } catch (error) {
    console.error("BBS retention read error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/** Pratinjau (READ-ONLY): berapa data yang akan dihapus bila purge dijalankan.
 *  Opsional `days` = nilai kandidat dari UI (tidak menyimpan apa pun). */
router.get("/preview", async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Hanya admin yang dapat melihat pratinjau retensi." });
    }
    const modules = parseModules(req);
    const preview = await retention.previewRetention(modules, { days: req.query.days });
    res.json({ success: true, modules, preview });
  } catch (error) {
    console.error("BBS retention preview error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/** Jalankan penghapusan retensi. Dua langkah: tanpa confirm hanya lapor. */
router.post("/purge", async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Hanya admin yang dapat menghapus data kedaluwarsa." });
    }
    const modules = parseModules(req);
    if (!modules.length) {
      return res.status(400).json({ message: "Parameter modules tidak dikenal (pilih adas/speed)." });
    }
    const confirm = req.body?.confirm === true;
    const optimize = req.body?.optimize === true || req.query?.optimize === "true";
    const days = req.body?.days ?? req.query?.days;

    if (!confirm) {
      const preview = await retention.previewRetention(modules, { days });
      return res.json({
        success: true,
        requires_confirmation: true,
        modules,
        preview,
        message: "Kirim ulang dengan confirm=true untuk menjalankan penghapusan."
      });
    }

    const results = await retention.purgeRetention(modules, {
      optimize,
      days,
      adminId: req.user?.id_admin ?? null
    });

    res.json({
      success: true,
      modules,
      results,
      message: "Penghapusan data kedaluwarsa selesai."
    });
  } catch (error) {
    console.error("BBS retention purge error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;