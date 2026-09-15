/**
 * BBS Settings — pengaturan global modul BBS.
 *
 * Tabel bbs_settings menyimpan nilai sebagai string. Hanya level 'admin' yang
 * boleh mengubah; semua role BBS boleh membaca (dipakai untuk menampilkan ambang
 * batas aktif di UI).
 */

const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");
const speed = require("../services/speedService");
const retention = require("../services/retentionService");

const router = express.Router();
router.use(authenticateToken);

const isAdmin = (req) => String(req.user?.level || "") === "admin";

/** Label ramah untuk tiap key, dipakai UI dan pesan error. */
const SETTING_LABELS = {
  [speed.SETTING_KEYS.threshold]: "Ambang batas overspeed",
  [speed.SETTING_KEYS.retentionDays]: "Masa retensi",
  [speed.SETTING_KEYS.penaltyFactor]: "Faktor penalti",
  [speed.SETTING_KEYS.weight]: "Bobot kategori kecepatan",
  [speed.SETTING_KEYS.burstGapSeconds]: "Toleransi gabung event",
  [speed.SETTING_KEYS.sampleInterval]: "Interval penyimpanan sampel",
  [retention.RETENTION_KEYS.adas]: "Masa retensi data ADAS"
};

router.get("/", async (req, res) => {
  try {
    const [[rows], [meta]] = await Promise.all([
      db.query(
        `SELECT s.setting_key, s.setting_value, s.updated_at, s.updated_by, a.nama_admin
           FROM bbs_settings s
           LEFT JOIN admin a
             ON CONVERT(a.id_admin USING utf8mb4) = CONVERT(s.updated_by USING utf8mb4)`
      ),
      db.query(
        `SELECT MAX(s.updated_at) AS last_updated, MAX(a.nama_admin) AS last_updated_by
           FROM bbs_settings s
           LEFT JOIN admin a
             ON CONVERT(a.id_admin USING utf8mb4) = CONVERT(s.updated_by USING utf8mb4)
          WHERE s.updated_by IS NOT NULL`
      )
    ]);

    const values = {};
    (rows || []).forEach((row) => {
      values[row.setting_key] = row.setting_value;
    });

    const settings = await speed.getSettings();

    res.json({
      values,
      effective: {
        threshold_kmh: settings.thresholdKmh,
        retention_days: settings.retentionDays,
        penalty_factor: settings.penaltyFactor,
        weight: settings.weight,
        burst_gap_seconds: settings.burstGapSeconds
      },
      bounds: { ...speed.SETTING_BOUNDS, ...retention.RETENTION_BOUNDS },
      labels: SETTING_LABELS,
      defaults: { ...speed.SETTING_DEFAULTS, ...retention.RETENTION_DEFAULTS },
      last_updated: meta?.[0]?.last_updated || null,
      last_updated_by: meta?.[0]?.last_updated_by || null,
      can_edit: isAdmin(req)
    });
  } catch (error) {
    console.error("BBS settings read error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/", async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Hanya admin yang dapat mengubah pengaturan." });
    }

    const payload = req.body || {};
    const entries = Object.entries(payload).filter(([key]) => key in SETTING_LABELS);
    if (!entries.length) {
      return res.status(400).json({ message: "Tidak ada pengaturan yang dikirim." });
    }

    // Validasi seluruh payload DULU supaya tidak ada penulisan sebagian.
    const validated = [];
    for (const [key, value] of entries) {
      const result = key === retention.RETENTION_KEYS.adas
        ? retention.validateRetentionSetting(key, value)
        : speed.validateSetting(key, value);
      if (!result.ok) {
        return res.status(400).json({ message: `${SETTING_LABELS[key]}: ${result.message}` });
      }
      // validateSetting sudah menormalkan bobot persen (30) menjadi fraksi (0.3).
      validated.push([key, String(result.value)]);
    }

    for (const [key, value] of validated) {
      await db.query(
        `INSERT INTO bbs_settings (setting_key, setting_value, updated_by)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value),
                                 updated_at = CURRENT_TIMESTAMP,
                                 updated_by = VALUES(updated_by)`,
        [key, value, req.user?.id_admin ?? null]
      );
    }

    const settings = await speed.getSettings();
    res.json({
      success: true,
      effective: {
        threshold_kmh: settings.thresholdKmh,
        retention_days: settings.retentionDays,
        penalty_factor: settings.penaltyFactor,
        weight: settings.weight,
        burst_gap_seconds: settings.burstGapSeconds
      },
      message: "Pengaturan disimpan."
    });
  } catch (error) {
    console.error("BBS settings write error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
