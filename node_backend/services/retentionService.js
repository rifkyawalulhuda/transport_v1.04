/**
 * retentionService.js — kebijakan retensi & penghapusan data BBS (ADAS + Speed).
 *
 * Satu-satunya tempat yang boleh menghapus data secara massal pada modul BBS.
 * Pola pemakaian: pratinjau (read-only) -> konfirmasi 2 langkah -> eksekusi.
 *
 * Semantik nilai retensi (hari):
 *   - hari > 0 : hapus data yang lebih tua dari N hari
 *   - hari <= 0: NONAKTIF — modul dilewati, tidak menghapus apa pun (pengaman)
 *
 * Basis umur per modul:
 *   - ADAS : begin_time (baris alarm di bbs_observations, source = 'adas')
 *   - Speed: creation_time (telemetry) / end_time (events) / day (daily)
 *
 * PERINGATAN: ADAS bercampur dengan observasi manual di bbs_observations.
 * Filter source = 'adas' WAJIB demi melindungi data observasi manual.
 */

const db = require("../db");
const speedService = require("./speedService");
const { logAuditEvent } = require("./auditLogger");

const ADAS_SOURCE = "adas";
const SUPPORTED_MODULES = ["adas", "speed"];

// ---------------------------------------------------------------------------
// Setting / konfigurasi
// ---------------------------------------------------------------------------

const RETENTION_KEYS = {
  adas: "adas.retention_days",
  speed: speedService.SETTING_KEYS.retentionDays
};

const RETENTION_DEFAULTS = {
  adas: 90,
  speed: speedService.SETTING_DEFAULTS[speedService.SETTING_KEYS.retentionDays]
};

const RETENTION_BOUNDS = {
  [RETENTION_KEYS.adas]: { min: 0, max: 3650, integer: true },
  [RETENTION_KEYS.speed]: speedService.SETTING_BOUNDS[speedService.SETTING_KEYS.retentionDays]
};

const RETENTION_LABELS = {
  [RETENTION_KEYS.adas]: "Masa retensi data ADAS",
  [RETENTION_KEYS.speed]: "Masa retensi data Speed"
};

/** 0 (atau negatif) berarti nonaktif — modul tidak akan dihapus. */
const isEnabled = (days) => Number(days) > 0;

/**
 * Tentukan jumlah hari yang dipakai untuk sebuah modul.
 * `overrideDays` (nilai kandidat dari UI) menang atas setting tersimpan supaya
 * admin bisa mengeksplorasi "bagaimana kalau 7 hari?" tanpa menyimpan dulu.
 */
const resolveDays = (savedDays, overrideDays) => {
  if (overrideDays == null || overrideDays === "") return savedDays;
  const num = Number(overrideDays);
  return Number.isFinite(num) ? num : savedDays;
};

/** Simpan nilai retensi sebagai kebijakan baru (dipakai saat purge dengan override). */
const persistRetentionDays = async (modules, days, adminId) => {
  for (const mod of modules) {
    const key = RETENTION_KEYS[mod];
    if (!key) continue;
    await db.query(
      `INSERT INTO bbs_settings (setting_key, setting_value, updated_by)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value),
                               updated_at = CURRENT_TIMESTAMP,
                               updated_by = VALUES(updated_by)`,
      [key, String(days), adminId ?? null]
    );
  }
};

/** Normalisasi input modul menjadi daftar modul yang dikenal. */
const parseModules = (value) => {
  const raw = String(value ?? "adas,speed")
    .toLowerCase()
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return SUPPORTED_MODULES.filter((mod) => raw.includes(mod));
};

/** Validasi nilai setting ADAS (0 diperbolehkan = nonaktif). */
const validateRetentionSetting = (key, value) => {
  if (key !== RETENTION_KEYS.adas) {
    return { ok: false, message: `Key tidak dikenal: ${key}` };
  }
  const num = Number(value);
  if (!Number.isFinite(num)) return { ok: false, message: "Nilai harus berupa angka." };
  const bounds = RETENTION_BOUNDS[key];
  if (num < bounds.min || num > bounds.max) {
    return { ok: false, message: `Nilai harus antara ${bounds.min} dan ${bounds.max}.` };
  }
  if (bounds.integer && !Number.isInteger(num)) {
    return { ok: false, message: "Nilai harus bilangan bulat." };
  }
  return { ok: true, value: num };
};

/** Baca pengaturan retensi aktif untuk kedua modul. */
const getRetentionSettings = async () => {
  const speedSettings = await speedService.getSettings();
  const [adasRows] = await db.query(
    "SELECT setting_value FROM bbs_settings WHERE setting_key = ?",
    [RETENTION_KEYS.adas]
  );
  const rawAdas = adasRows?.length ? Number(adasRows[0].setting_value) : RETENTION_DEFAULTS.adas;
  const adasDays = Number.isFinite(rawAdas) ? rawAdas : RETENTION_DEFAULTS.adas;

  return {
    adas: {
      days: adasDays,
      enabled: isEnabled(adasDays)
    },
    speed: {
      days: speedSettings.retentionDays,
      enabled: isEnabled(speedSettings.retentionDays)
    }
  };
};

// ---------------------------------------------------------------------------
// Pratinjau (READ-ONLY)
// ---------------------------------------------------------------------------

/** Hitung berapa data yang akan dihapus bila purge dijalankan sekarang. */
const previewRetention = async (modules, options = {}) => {
  const settings = await getRetentionSettings();
  const want = (mod) => modules.includes(mod);
  const daysFor = (mod) => resolveDays(settings[mod].days, options.days);
  const enabledFor = (mod) => isEnabled(daysFor(mod));
  const preview = {};

  if (want("adas")) {
    const days = daysFor("adas");
    preview.adas = {
      days,
      enabled: enabledFor("adas"),
      would_delete: 0,
      total_rows: 0,
      oldest_days: 0
    };
    const [[stats]] = await db.query(
      "SELECT COUNT(*) AS total, IFNULL(DATEDIFF(NOW(), MIN(begin_time)), 0) AS oldest_days FROM bbs_observations WHERE source = ?",
      [ADAS_SOURCE]
    );
    preview.adas.total_rows = Number(stats.total || 0);
    preview.adas.oldest_days = Number(stats.oldest_days || 0);
    if (enabledFor("adas")) {
      const [[row]] = await db.query(
        "SELECT COUNT(*) AS total FROM bbs_observations WHERE source = ? AND begin_time < (NOW() - INTERVAL ? DAY)",
        [ADAS_SOURCE, days]
      );
      preview.adas.would_delete = Number(row.total || 0);
    }
  }

  if (want("speed")) {
    const days = daysFor("speed");
    preview.speed = {
      days,
      enabled: enabledFor("speed"),
      would_delete: { telemetry: 0, events: 0, daily: 0 },
      approx_bytes: 0,
      total_rows: 0,
      oldest_days: 0
    };
    const [[telStat]] = await db.query(
      "SELECT COUNT(*) AS total, IFNULL(DATEDIFF(NOW(), MIN(creation_time)), 0) AS oldest_days FROM bbs_speed_telemetry"
    );
    preview.speed.total_rows = Number(telStat.total || 0);
    preview.speed.oldest_days = Number(telStat.oldest_days || 0);
    if (enabledFor("speed")) {
      const [[telemetry]] = await db.query(
        "SELECT COUNT(*) AS total, IFNULL(SUM(LENGTH(device_id) + 40), 0) AS approx_bytes FROM bbs_speed_telemetry WHERE creation_time < (NOW() - INTERVAL ? DAY)",
        [days]
      );
      const [[events]] = await db.query(
        "SELECT COUNT(*) AS total FROM bbs_speed_events WHERE end_time < (NOW() - INTERVAL ? DAY)",
        [days]
      );
      const [[daily]] = await db.query(
        "SELECT COUNT(*) AS total FROM bbs_speed_daily WHERE day < (NOW() - INTERVAL ? DAY)",
        [days]
      );
      preview.speed.would_delete = {
        telemetry: Number(telemetry.total || 0),
        events: Number(events.total || 0),
        daily: Number(daily.total || 0)
      };
      preview.speed.approx_bytes = Number(telemetry.approx_bytes || 0);
    }
  }

  return preview;
};

// ---------------------------------------------------------------------------
// Eksekusi purge
// ---------------------------------------------------------------------------

/**
 * Hapus data kedaluwarsa untuk modul terpilih berdasarkan setting retensi.
 * Modul dengan retensi <= 0 (nonaktif) dilewati.
 */
const purgeRetention = async (modules, options = {}) => {
  const settings = await getRetentionSettings();
  const want = (mod) => modules.includes(mod);
  const daysFor = (mod) => resolveDays(settings[mod].days, options.days);
  const enabledFor = (mod) => isEnabled(daysFor(mod));
  const results = {};
  const daysUsed = {};

  // Nilai kandidat (override) dipakai untuk eksekusi DAN disimpan sebagai
  // kebijakan baru, sehingga "angka yang dilihat = angka yang dieksekusi".
  if (options.days != null && options.days !== "") {
    const num = Number(options.days);
    if (Number.isFinite(num)) {
      await persistRetentionDays(modules, num, options.adminId);
    }
  }

  if (want("adas")) {
    const days = daysFor("adas");
    daysUsed.adas = days;
    if (!enabledFor("adas")) {
      results.adas = { days, enabled: false, deleted: 0, skipped: "nonaktif" };
    } else {
      const [result] = await db.query(
        "DELETE FROM bbs_observations WHERE source = ? AND begin_time < (NOW() - INTERVAL ? DAY)",
        [ADAS_SOURCE, days]
      );
      results.adas = {
        days,
        enabled: true,
        deleted: result.affectedRows || 0
      };
    }
  }

  if (want("speed")) {
    const days = daysFor("speed");
    daysUsed.speed = days;
    if (!enabledFor("speed")) {
      results.speed = {
        days,
        enabled: false,
        deleted: { telemetry: 0, events: 0, daily: 0 },
        skipped: "nonaktif"
      };
    } else {
      const [telemetry] = await db.query(
        "DELETE FROM bbs_speed_telemetry WHERE creation_time < (NOW() - INTERVAL ? DAY)",
        [days]
      );
      const [events] = await db.query(
        "DELETE FROM bbs_speed_events WHERE end_time < (NOW() - INTERVAL ? DAY)",
        [days]
      );
      const [daily] = await db.query(
        "DELETE FROM bbs_speed_daily WHERE day < (NOW() - INTERVAL ? DAY)",
        [days]
      );
      results.speed = {
        days,
        enabled: true,
        deleted: {
          telemetry: telemetry.affectedRows || 0,
          events: events.affectedRows || 0,
          daily: daily.affectedRows || 0
        }
      };
      if (options.optimize) {
        results.speed.optimized = await speedService.optimizeSpeedTables();
      }
    }
  }

  logAuditEvent("bbs_retention_purge", {
    by_admin: options.adminId ?? null,
    modules,
    days_used: daysUsed,
    results
  });

  return results;
};

module.exports = {
  ADAS_SOURCE,
  SUPPORTED_MODULES,
  RETENTION_KEYS,
  RETENTION_DEFAULTS,
  RETENTION_BOUNDS,
  RETENTION_LABELS,
  isEnabled,
  parseModules,
  validateRetentionSetting,
  getRetentionSettings,
  previewRetention,
  purgeRetention
};