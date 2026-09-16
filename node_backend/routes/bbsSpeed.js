/**
 * BBS Speed — endpoints untuk import & analisis data kecepatan.
 *
 * Mounted at /api/bbs/speed (sebelum /api/bbs supaya tidak tertelan router utama).
 *
 * Hak akses:
 *   - import / re-import bulan : bukan level 'user'
 *   - list / summary / events  : semua role BBS
 *   - settings / preview / recompute / purge : HANYA 'admin'
 */

const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");
const speed = require("../services/speedService");
const retention = require("../services/retentionService");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;
// Batas kendaraan pada chart (kesepakatan: sama dengan modul ADAS).
const MAX_CHART_PLATES = 6;

/**
 * Normalisasi parameter `plates=A,B,C` menjadi daftar plat unik (maks MAX_CHART_PLATES).
 * Mengembalikan { plates, truncated } — `truncated` true bila permintaan melebihi batas.
 */
const parsePlateFilter = (value) => {
  const all = String(value ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const unique = [...new Set(all)];
  return { plates: unique.slice(0, MAX_CHART_PLATES), truncated: unique.length > MAX_CHART_PLATES };
};

/** Bangun klausa `plate_number IN (?,?,...)` + param-nya (kosong bila tak ada plat). */
const plateInClause = (plates, column) => {
  if (!plates.length) return { clause: "", params: [] };
  return {
    clause: `${column} IN (${plates.map(() => "?").join(",")})`,
    params: [...plates]
  };
};

const isAdmin = (req) => String(req.user?.level || "") === "admin";
const isViewOnly = (req) => String(req.user?.level || "") === "user";

/**
 * Flag opsional: rebuild tabel (OPTIMIZE TABLE) setelah pembersihan besar.
 * DELETE hanya menandai halaman InnoDB sebagai bebas-pakai-ulang; tanpa rebuild,
 * ukuran file tabel tidak menyusut. Mahal, jadi harus diminta secara eksplisit.
 */
const wantsOptimize = (req) =>
  req.body?.optimize === true || req.query?.optimize === "true";

const uploadFile = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) return next();
    const message =
      error.code === "LIMIT_FILE_SIZE" ? "Ukuran file maksimal 10 MB." : "Gagal mengunggah file.";
    return res.status(400).json({ success: false, message, errors: [{ row: null, field: "file", message }] });
  });
};

router.use(authenticateToken);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const parseMonth = (value) => {
  const raw = String(value || "").trim();
  return /^\d{4}-\d{2}$/.test(raw) ? raw : null;
};

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * driver_id Speed disimpan sebagai "ID:<id_driver>" (terverifikasi) atau
 * "SPEED:<plate>" untuk fallback. Ekstrak bagian id-nya untuk JOIN.
 * driver_id di ADAS memakai format lama ("ADAS:<plate>" atau id polos), jadi
 * pemisahan prefix harus tahan terhadap keduanya.
 */
const driverJoinKey = (column) =>
  `CONVERT(SUBSTRING_INDEX(${column}, ':', -1) USING utf8mb4)`;

/**
 * Ambil nama driver dari tabel driver (latin1) tanpa kena
 * "Illegal mix of collations" — SEMUA perbandingan teks di-CONVERT ke utf8mb4.
 */
const DRIVER_JOIN = `
  LEFT JOIN driver d
    ON CONVERT(d.id_driver USING utf8mb4) = ${driverJoinKey("sd.driver_id")}
`;

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

router.post("/import", uploadFile, async (req, res) => {
  try {
    if (isViewOnly(req)) {
      return res.status(403).json({ success: false, message: "Anda tidak memiliki izin untuk mengimpor data Speed." });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File belum dipilih.",
        errors: [{ row: null, field: "file", message: "File belum dipilih." }]
      });
    }

    const filename = speed.normalize(req.file.originalname).toLowerCase();
    if (!filename.endsWith(".csv") && !filename.endsWith(".xlsx")) {
      return res.status(400).json({
        success: false,
        message: "Format file harus CSV atau XLSX.",
        errors: [{ row: null, field: "file", message: "Format file harus CSV atau XLSX." }]
      });
    }

    let workbook;
    try {
      workbook = xlsx.read(req.file.buffer, { type: "buffer", raw: true, cellDates: true });
    } catch {
      return res.status(400).json({
        success: false,
        message: "File tidak dapat dibaca.",
        errors: [{ row: null, field: "file", message: "File tidak dapat dibaca." }]
      });
    }

    const [driverRows] = await db.query(
      "SELECT id_driver, no_polisi, nama_driver, is_active FROM driver WHERE no_polisi IS NOT NULL AND TRIM(no_polisi) <> '' ORDER BY is_active DESC, id_driver ASC"
    );

    let parsed;
    try {
      parsed = speed.parseSpeedWorkbook(workbook, {
        sourceFile: speed.normalize(req.file.originalname),
        driverRows
      });
    } catch (error) {
      const message = error?.code === "MISSING_HEADERS"
        ? "Header file tidak sesuai."
        : "File tidak dapat diproses.";
      return res.status(400).json({
        success: false,
        message,
        errors: [{ row: 1, field: "header", message: error.message }]
      });
    }

    const { rows, errors, stats } = parsed;

    if (!rows.length) {
      return res.json({
        success: errors.length === 0,
        total: stats.total,
        inserted: 0,
        duplicates: stats.duplicates,
        skipped_idle: stats.skipped_idle,
        unmatched_driver: stats.unmatched_driver,
        dedup_burst: 0,
        events_created: 0,
        days_aggregated: 0,
        months: [],
        failed: errors.length,
        errors,
        message: errors.length ? "Import selesai dengan error." : "Tidak ada data untuk diimpor."
      });
    }

    // ── Filter penyimpanan: hanya baris > threshold + satu sampel per 3 menit.
    // Baris idle tidak disimpan. Baris yang dibuang TETAP dipakai menghitung
    // agregat (recompute di bawah membaca isi telemetry), jadi dashboard bulan
    // yang baru diimpor tidak kehilangan makna.
    const settings = await speed.getSettings();
    const selection = speed.selectStorageRows(rows, {
      thresholdKmh: settings.thresholdKmh,
      sampleIntervalSeconds: settings.sampleIntervalSeconds
    });
    const storedRows = selection.rows;

    if (!storedRows.length) {
      return res.json({
        success: errors.length === 0,
        total: stats.total,
        inserted: 0,
        duplicates: stats.duplicates,
        skipped_idle: stats.skipped_idle,
        unmatched_driver: stats.unmatched_driver,
        dedup_burst: 0,
        stored_kept: 0,
        kept_overspeed: 0,
        sampled_moving: 0,
        dropped_idle: selection.stats.droppedIdle,
        dropped_moving: selection.stats.droppedMoving,
        stored_reduction_percent: rows.length > 0 ? 100 : 0,
        events_created: 0,
        days_aggregated: 0,
        months: [],
        failed: errors.length,
        errors,
        message: errors.length
          ? "Import selesai dengan error."
          : "Tidak ada baris bergerak yang perlu disimpan."
      });
    }

    const { inserted } = await speed.insertTelemetryRows(storedRows, req.user?.id_admin);

    // Recompute hanya untuk device+bulan yang disentuh. Agregat dihitung dari
    // isi telemetry (termasuk import bulan sebelumnya) sehingga gabungan
    // beberapa file per bulan tetap benar. moving_seconds per baris tersimpan
    // menjamin hasil recompute konsisten dengan waktu bergerak sebenarnya.
    const deviceIds = [...new Set(rows.map((row) => row.deviceId))];
    const months = [...new Set(rows.map((row) => speed.monthKeyOf(row.creationTime)))];

    let eventsCreated = 0;
    let daysAggregated = 0;
    for (const monthKey of months) {
      for (const deviceId of deviceIds) {
        const result = await speed.recomputeSpeedAggregates({ deviceIds: [deviceId], monthKey });
        eventsCreated += result.events;
        daysAggregated += result.dailyDays;
      }
    }

    const s = selection.stats;
    const reductionPercent = rows.length > 0
      ? Math.round((1 - storedRows.length / rows.length) * 1000) / 10
      : 0;

    // Duplikat akhir = duplikat di dalam file + baris yang sudah ada di DB.
    const duplicatesInDb = Math.max(0, storedRows.length - inserted);
    const failed = errors.length;

    return res.json({
      success: failed === 0,
      total: stats.total,
      inserted,
      duplicates: stats.duplicates + duplicatesInDb,
      dedup_burst: eventsCreated,
      skipped_idle: stats.skipped_idle,
      unmatched_driver: stats.unmatched_driver,
      stored_kept: storedRows.length,
      kept_overspeed: s.keptOverspeed,
      sampled_moving: s.keptSampled,
      dropped_idle: s.droppedIdle,
      dropped_moving: s.droppedMoving,
      stored_reduction_percent: reductionPercent,
      events_created: eventsCreated,
      days_aggregated: daysAggregated,
      months,
      failed,
      errors,
      message: failed === 0 ? "Import data Speed berhasil." : "Import selesai dengan error."
    });
  } catch (error) {
    console.error("BBS speed import error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// Read — list, summary, events
// ---------------------------------------------------------------------------

router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const conditions = ["1 = 1"];
    const params = [];

    const plate = speed.normalize(req.query.plate);
    if (plate) {
      conditions.push("sd.plate_number LIKE ?");
      params.push(`%${plate}%`);
    }
    const monthKey = parseMonth(req.query.month);
    if (monthKey) {
      conditions.push("DATE_FORMAT(sd.day, '%Y-%m') = ?");
      params.push(monthKey);
    }
    const day = speed.normalize(req.query.day);
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      conditions.push("sd.day = ?");
      params.push(day);
    }
    const where = conditions.join(" AND ");

    const [[countRow], [rows]] = await Promise.all([
      db.query(`SELECT COUNT(*) AS total FROM bbs_speed_daily sd WHERE ${where}`, params),
      db.query(
        `SELECT sd.id_daily AS id, sd.plate_number, sd.driver_id, d.nama_driver, sd.fleet, sd.day,
                sd.moving_seconds, sd.overspeed_seconds, sd.distance_km, sd.max_speed_kmh,
                sd.avg_moving_speed_kmh, sd.event_count
           FROM bbs_speed_daily sd
           ${DRIVER_JOIN}
          WHERE ${where}
          ORDER BY sd.day DESC, sd.plate_number ASC
          LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      )
    ]);

    res.json({
      rows,
      pagination: { page, limit, total: Number(countRow[0]?.total || 0) }
    });
  } catch (error) {
    console.error("BBS speed list error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Agregat per plat untuk satu bulan + skor kategori Kecepatan.
 * Semua baris berasal dari bbs_speed_daily sehingga tidak perlu memindai
 * tabel telemetry yang besar.
 */
router.get("/summary", async (req, res) => {
  try {
    const monthKey = parseMonth(req.query.month) || currentMonth();
    const settings = await speed.getSettings();

    const [rows] = await db.query(
      `SELECT sd.plate_number,
              MAX(sd.driver_id) AS driver_id,
              MAX(d.nama_driver) AS nama_driver,
              MAX(sd.fleet) AS fleet,
              SUM(sd.moving_seconds) AS moving_seconds,
              SUM(sd.overspeed_seconds) AS overspeed_seconds,
              SUM(sd.distance_km) AS distance_km,
              MAX(sd.max_speed_kmh) AS max_speed_kmh,
              SUM(sd.avg_moving_speed_kmh * sd.moving_seconds) AS speed_seconds_sum,
              SUM(sd.event_count) AS event_count,
              COUNT(*) AS day_count
         FROM bbs_speed_daily sd
         LEFT JOIN driver d
           ON CONVERT(d.id_driver USING utf8mb4) = ${driverJoinKey("sd.driver_id")}
        WHERE DATE_FORMAT(sd.day, '%Y-%m') = ?
        GROUP BY sd.plate_number
        ORDER BY sd.plate_number ASC`,
      [monthKey]
    );

    const data = (rows || []).map((row) => {
      const movingSeconds = Number(row.moving_seconds || 0);
      const overspeedSeconds = Number(row.overspeed_seconds || 0);
      const scoring = speed.computeSpeedScore(
        { movingSeconds, overspeedSeconds },
        settings.penaltyFactor
      );
      const speedSecondsSum = Number(row.speed_seconds_sum || 0);
      return {
        plate_number: row.plate_number,
        driver_id: row.driver_id,
        nama_driver: row.nama_driver,
        fleet: row.fleet,
        score: scoring.score,
        status: scoring.score == null
          ? "tanpa_data"
          : scoring.score >= 80
            ? "aman"
            : scoring.score >= 60
              ? "perlu_perhatian"
              : "berisiko",
        overspeed_rate: scoring.overspeedRate,
        moving_seconds: movingSeconds,
        overspeed_seconds: overspeedSeconds,
        distance_km: Math.round(Number(row.distance_km || 0) * 100) / 100,
        max_speed_kmh: Number(row.max_speed_kmh || 0),
        avg_moving_speed_kmh: movingSeconds > 0
          ? Math.round((speedSecondsSum / movingSeconds) * 100) / 100
          : 0,
        event_count: Number(row.event_count || 0),
        day_count: Number(row.day_count || 0)
      };
    });

    res.json({
      month: monthKey,
      threshold_kmh: settings.thresholdKmh,
      penalty_factor: settings.penaltyFactor,
      weight: settings.weight,
      rows: data
    });
  } catch (error) {
    console.error("BBS speed summary error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/** Event overspeed (burst) untuk satu bulan, dipaginasi. */
router.get("/events", async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const conditions = ["1 = 1"];
    const params = [];

    const monthKey = parseMonth(req.query.month);
    if (monthKey) {
      conditions.push("e.month_key = ?");
      params.push(monthKey);
    }
    const plate = speed.normalize(req.query.plate);
    if (plate) {
      conditions.push("e.plate_number LIKE ?");
      params.push(`%${plate}%`);
    }
    // Filter kendaraan terpilih (exact, dari kontrol multi-select di UI).
    const { plates: selectedPlates } = parsePlateFilter(req.query.plates);
    const platesClause = plateInClause(selectedPlates, "e.plate_number");
    if (platesClause.clause) {
      conditions.push(platesClause.clause);
      params.push(...platesClause.params);
    }
    const where = conditions.join(" AND ");

    const [[countRow], [rows]] = await Promise.all([
      db.query(`SELECT COUNT(*) AS total FROM bbs_speed_events e WHERE ${where}`, params),
      db.query(
        `SELECT e.id_event AS id, e.plate_number, e.driver_id, d.nama_driver, e.fleet,
                e.begin_time, e.end_time, e.duration_seconds, e.max_speed_kmh, e.avg_speed_kmh,
                e.sample_count, e.distance_km, e.threshold_kmh, e.month_key
           FROM bbs_speed_events e
           LEFT JOIN driver d
             ON CONVERT(d.id_driver USING utf8mb4) = ${driverJoinKey("e.driver_id")}
          WHERE ${where}
          ORDER BY e.begin_time DESC, e.id_event DESC
          LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      )
    ]);

    res.json({
      rows,
      pagination: { page, limit, total: Number(countRow[0]?.total || 0) }
    });
  } catch (error) {
    console.error("BBS speed events error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Daftar kendaraan yang punya data pelanggaran kecepatan + jumlah event.
 * Dipakai mengisi filter chart; kendaraan tanpa data tidak ditampilkan
 * supaya tidak ada opsi yang selalu kosong.
 */
router.get("/plates", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT plate_number, COUNT(*) AS total, MAX(month_key) AS last_month
         FROM bbs_speed_events
        WHERE plate_number IS NOT NULL AND TRIM(plate_number) <> ''
        GROUP BY plate_number
        ORDER BY total DESC, plate_number ASC`
    );
    res.json({
      plates: (rows || []).map((row) => ({
        plate_number: row.plate_number,
        total: Number(row.total || 0),
        last_month: row.last_month || null
      })),
      max_selectable: MAX_CHART_PLATES
    });
  } catch (error) {
    console.error("BBS speed plates error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Total pelanggaran per kendaraan dalam satu bulan (chart "Pelanggaran per
 * Kendaraan"). Sumber bbs_speed_daily (sudah teragregasi) — SUM(event_count).
 * Opsional `plates` untuk membatasi kendaraan tertentu (maks 6).
 */
router.get("/by-vehicle", async (req, res) => {
  try {
    const monthKey = parseMonth(req.query.month) || currentMonth();
    const { plates, truncated } = parsePlateFilter(req.query.plates);

    const conditions = ["DATE_FORMAT(day, '%Y-%m') = ?"];
    const params = [monthKey];
    const inClause = plateInClause(plates, "plate_number");
    if (inClause.clause) {
      conditions.push(inClause.clause);
      params.push(...inClause.params);
    }

    const [rows] = await db.query(
      `SELECT plate_number, SUM(event_count) AS total, COUNT(*) AS days,
              SUM(overspeed_seconds) AS overspeed_seconds, MAX(max_speed_kmh) AS max_speed_kmh
         FROM bbs_speed_daily
        WHERE ${conditions.join(" AND ")}
        GROUP BY plate_number
        HAVING SUM(event_count) > 0
        ORDER BY total DESC, plate_number ASC`,
      params
    );

    const all = (rows || []).map((row) => ({
      plate_number: row.plate_number,
      total: Number(row.total || 0),
      days: Number(row.days || 0),
      overspeed_seconds: Number(row.overspeed_seconds || 0),
      max_speed_kmh: row.max_speed_kmh == null ? null : Number(row.max_speed_kmh)
    }));

    res.json({
      rows: all.slice(0, MAX_CHART_PLATES),
      total_vehicles: all.length,
      truncated: truncated || all.length > MAX_CHART_PLATES,
      month: monthKey
    });
  } catch (error) {
    console.error("BBS speed by-vehicle error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/** Jumlah event per hari untuk chart batang. */
router.get("/daily-trend", async (req, res) => {
  try {
    const monthKey = parseMonth(req.query.month) || currentMonth();
    const { plates, truncated } = parsePlateFilter(req.query.plates);

    const conditions = ["month_key = ?"];
    const params = [monthKey];
    const inClause = plateInClause(plates, "plate_number");
    if (inClause.clause) {
      conditions.push(inClause.clause);
      params.push(...inClause.params);
    }

    // Agregat per (tanggal, plat) lalu deret waktu dirakit di memori.
    const [rows] = await db.query(
      `SELECT DATE_FORMAT(begin_time, '%Y-%m-%d') AS day, plate_number, COUNT(*) AS total
         FROM bbs_speed_events
        WHERE ${conditions.join(" AND ")}
        GROUP BY day, plate_number`,
      params
    );

    const [year, month] = monthKey.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const labels = [];
    for (let d = 1; d <= daysInMonth; d += 1) {
      labels.push(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    const dayIndex = new Map(labels.map((key, index) => [key, index]));

    const perPlate = new Map();
    const totals = new Array(labels.length).fill(0);
    (rows || []).forEach((row) => {
      const index = dayIndex.get(String(row.day));
      if (index == null) return;
      const count = Number(row.total || 0);
      const plate = String(row.plate_number || "");
      if (!perPlate.has(plate)) perPlate.set(plate, new Array(labels.length).fill(0));
      perPlate.get(plate)[index] += count;
      totals[index] += count;
    });

    // Satu seri per kendaraan (grouped bar). Tanpa filter -> urut terbanyak.
    const series = plates.length
      ? plates
          .filter((plate) => perPlate.has(plate))
          .map((plate) => {
            const data = perPlate.get(plate);
            return { plate, data, total: data.reduce((a, b) => a + b, 0) };
          })
      : [...perPlate.entries()]
          .map(([plate, data]) => ({ plate, data, total: data.reduce((a, b) => a + b, 0) }))
          .sort((a, b) => b.total - a.total || a.plate.localeCompare(b.plate));

    res.json({
      labels,
      data: totals,
      series,
      plates_used: plates,
      truncated,
      month: monthKey
    });
  } catch (error) {
    console.error("BBS speed daily-trend error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// Admin — preview, recompute, re-import, purge
// ---------------------------------------------------------------------------

/**
 * Simulasi threshold. READ-ONLY: tidak menulis apa pun, jadi admin bisa
 * bereksperimen dengan angka tanpa mengubah data. Dipicu saat field blur.
 */
router.get("/threshold-preview", async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Hanya admin yang dapat melihat simulasi ambang batas." });
    }
    const thresholdParam = Number(req.query.kmh);
    if (!Number.isFinite(thresholdParam)) {
      return res.status(400).json({ message: "Parameter kmh wajib berupa angka." });
    }
    const validation = speed.validateSetting(speed.SETTING_KEYS.threshold, thresholdParam);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    const monthKey = parseMonth(req.query.month) || currentMonth();
    const settings = await speed.getSettings();
    const preview = await speed.previewThreshold({
      thresholdKmh: validation.value,
      monthKey
    });

    const current = await speed.previewThreshold({
      thresholdKmh: settings.thresholdKmh,
      monthKey
    });

    res.json({
      month: monthKey,
      proposed_threshold_kmh: validation.value,
      current_threshold_kmh: settings.thresholdKmh,
      proposed: preview,
      current
    });
  } catch (error) {
    console.error("BBS speed threshold-preview error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Hitung ulang seluruh agregat memakai setting terbaru.
 * Dipicu tombol Simpan di kartu Pengaturan (Opsi A: perubahan langsung berlaku).
 */
router.post("/recompute", async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Hanya admin yang dapat menghitung ulang data." });
    }
    const monthKey = parseMonth(req.body?.month);
    const result = await speed.recomputeSpeedAggregates(
      monthKey
        ? { monthKey, scope: "month" }
        : { scope: "all" }
    );
    res.json({
      success: true,
      scope: monthKey || "all",
      events: result.events,
      days: result.dailyDays,
      devices: result.devices,
      rows: result.rows,
      message: "Perhitungan ulang selesai."
    });
  } catch (error) {
    console.error("BBS speed recompute error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/** Hapus seluruh data Speed pada satu bulan, supaya file bisa diimpor ulang. */
router.delete("/import/:month", async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Hanya admin yang dapat menghapus data Speed." });
    }
    const monthKey = parseMonth(req.params.month);
    if (!monthKey) {
      return res.status(400).json({ message: "Format bulan harus YYYY-MM." });
    }

    const [[telemetry]] = await db.query(
      "SELECT COUNT(*) AS total FROM bbs_speed_telemetry WHERE DATE_FORMAT(creation_time, '%Y-%m') = ?",
      [monthKey]
    );
    const [[events]] = await db.query(
      "SELECT COUNT(*) AS total FROM bbs_speed_events WHERE month_key = ?",
      [monthKey]
    );
    const [[daily]] = await db.query(
      "SELECT COUNT(*) AS total FROM bbs_speed_daily WHERE DATE_FORMAT(day, '%Y-%m') = ?",
      [monthKey]
    );

    if (telemetry.total === 0 && events.total === 0 && daily.total === 0) {
      return res.json({ success: true, month: monthKey, deleted: { telemetry: 0, events: 0, daily: 0 }, message: "Tidak ada data untuk bulan tersebut." });
    }

    // Konfirmasi dua langkah: tanpa confirm hanya melaporkan dampaknya.
    if (req.body?.confirm !== true && req.query?.confirm !== "true") {
      return res.json({
        success: true,
        requires_confirmation: true,
        month: monthKey,
        would_delete: { telemetry: telemetry.total, events: events.total, daily: daily.total },
        message: `Menghapus data ${monthKey} akan membuang ${telemetry.total} baris telemetry, ${events.total} event, dan ${daily.total} agregat harian.`
      });
    }

    await db.query("DELETE FROM bbs_speed_telemetry WHERE DATE_FORMAT(creation_time, '%Y-%m') = ?", [monthKey]);
    await db.query("DELETE FROM bbs_speed_events WHERE month_key = ?", [monthKey]);
    await db.query("DELETE FROM bbs_speed_daily WHERE DATE_FORMAT(day, '%Y-%m') = ?", [monthKey]);

    const optimized = wantsOptimize(req) ? await speed.optimizeSpeedTables() : null;

    res.json({
      success: true,
      month: monthKey,
      deleted: { telemetry: telemetry.total, events: events.total, daily: daily.total },
      optimized,
      message: `Data Speed ${monthKey} dihapus.${optimized ? " Tabel di-rebuild sehingga ruang disk dikembalikan." : ""}`
    });
  } catch (error) {
    console.error("BBS speed delete-month error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Purge manual berdasarkan retensi (hari, dihitung dari creation_time).
 * Dua langkah: tanpa confirm hanya melaporkan berapa yang akan terhapus.
 *
 * Logika penghapusan didelegasikan ke retentionService supaya kebijakan retensi
 * hanya hidup di satu tempat (dipakai juga oleh /api/bbs/retention/purge).
 */
router.post("/purge", async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "Hanya admin yang dapat menghapus data kedaluwarsa." });
    }

    const settings = await retention.getRetentionSettings();
    const retentionDays = settings.speed.days;

    // Retensi 0 = nonaktif: tidak ada yang dihapus (pengaman).
    if (!settings.speed.enabled) {
      return res.json({
        success: true,
        retention_days: retentionDays,
        enabled: false,
        deleted: { telemetry: 0, events: 0, daily: 0 },
        message: "Retensi Speed nonaktif (0 hari). Tidak ada data yang dihapus."
      });
    }

    const preview = await retention.previewRetention(["speed"]);
    const wouldDelete = preview.speed.would_delete;

    if (req.body?.confirm !== true) {
      return res.json({
        success: true,
        requires_confirmation: true,
        retention_days: retentionDays,
        would_delete: wouldDelete,
        approx_bytes: preview.speed.approx_bytes,
        message: `${wouldDelete.telemetry} baris telemetry lebih lama dari ${retentionDays} hari.`
      });
    }

    const optimize = wantsOptimize(req);
    const results = await retention.purgeRetention(["speed"], {
      optimize,
      adminId: req.user?.id_admin ?? null
    });
    const optimized = results.speed?.optimized || null;

    res.json({
      success: true,
      retention_days: retentionDays,
      deleted: results.speed.deleted,
      optimized,
      message: `Purge selesai: ${results.speed.deleted.telemetry} baris telemetry dihapus.${optimized ? " Tabel di-rebuild sehingga ruang disk dikembalikan." : ""}`
    });
  } catch (error) {
    console.error("BBS speed purge error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
