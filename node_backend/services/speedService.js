/**
 * BBS Speed — core domain logic.
 *
 * Mengubah CSV telemetry GPS tracker menjadi:
 *  1. baris telemetry (bbs_speed_telemetry)  — data mentah yang sudah dibersihkan
 *  2. event overspeed (bbs_speed_events)      — burst, bukan per-baris
 *  3. agregat harian (bbs_speed_daily)       — sumber dashboard, hindari scan jutaan baris
 *
 * Semua fungsi di sini murni (pure) terhadap input baris; penulisan DB ada di
 * importSpeedRows / recomputeSpeedAggregates.
 */

const db = require("../db");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SLOT_SECONDS = 30; // interval sampling tracker; 1 baris = 1 slot durasi
const DEFAULT_SAMPLE_INTERVAL_SECONDS = 180; // downsampling: 1 sampel baris bergerak per interval ini
const MOVING_SPEED_EPSILON = 0.5; // km/h; di bawah ini dianggap tidak bergerak
const EARTH_RADIUS_KM = 6371.0088;

const REQUIRED_HEADERS = ["device id", "device name", "creation time", "speed"];

const SETTING_KEYS = {
  threshold: "speed.overspeed_threshold_kmh",
  retentionDays: "speed.retention_days",
  penaltyFactor: "speed.score_penalty_factor",
  weight: "speed.weight",
  burstGapSeconds: "speed.burst_gap_seconds",
  sampleInterval: "speed.sample_interval_seconds"
};

const SETTING_DEFAULTS = {
  [SETTING_KEYS.threshold]: 60,
  [SETTING_KEYS.retentionDays]: 90,
  [SETTING_KEYS.penaltyFactor]: 20,
  [SETTING_KEYS.weight]: 0.3,
  [SETTING_KEYS.burstGapSeconds]: 90,
  [SETTING_KEYS.sampleInterval]: DEFAULT_SAMPLE_INTERVAL_SECONDS
};

const SETTING_BOUNDS = {
  [SETTING_KEYS.threshold]: { min: 20, max: 200, integer: false },
  [SETTING_KEYS.retentionDays]: { min: 1, max: 3650, integer: true },
  [SETTING_KEYS.penaltyFactor]: { min: 1, max: 100, integer: true },
  [SETTING_KEYS.weight]: { min: 0, max: 1, integer: false },
  [SETTING_KEYS.burstGapSeconds]: { min: 30, max: 600, integer: true },
  [SETTING_KEYS.sampleInterval]: { min: 60, max: 3600, integer: true }
};

const MAX_ERRORS = 200;

// ---------------------------------------------------------------------------
// Text / number helpers
// ---------------------------------------------------------------------------

const normalize = (value) => String(value ?? "").trim();
const normalizeHeader = (value) => normalize(value).toLowerCase().replace(/\s+/g, " ");

/**
 * Samakan dengan bbsAlarm.js supaya plat dari file Speed dan file ADAS
 * menghasilkan kunci lookup driver yang identik.
 */
const normalizePlate = (value) => normalize(value).toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Ambil angka pertama dari string seperti "47.37 km/h" atau "25.0". */
const parseDecimal = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const match = normalize(value).replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const pad2 = (value) => String(value).padStart(2, "0");

/** Normalisasi waktu ke format MySQL DATETIME, tanpa tergantung timezone lokal. */
const toMysqlDateTime = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())} ` +
      `${pad2(value.getHours())}:${pad2(value.getMinutes())}:${pad2(value.getSeconds())}`;
  }
  const raw = normalize(value).replace("T", " ");
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})[\sT](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const [, y, mo, d, h, mi, s] = match;
    return `${y}-${mo}-${d} ${pad2(h)}:${mi}:${s ? pad2(s) : "00"}`;
  }
  return null;
};

/** Ubah "YYYY-MM-DD HH:MM:SS" menjadi epoch ms TANPA terpengaruh timezone server. */
const mysqlToEpochMs = (mysqlDateTime) => {
  const raw = normalize(mysqlDateTime);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!match) return NaN;
  const [, y, mo, d, h, mi, s] = match;
  return Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
};

const monthKeyOf = (mysqlDateTime) => normalize(mysqlDateTime).slice(0, 7);
const dayOf = (mysqlDateTime) => normalize(mysqlDateTime).slice(0, 10);

/**
 * Location tracker berformat "longitude,latitude" (bukan lat,lon).
 * "0.0,0.0" berarti GPS belum fix -> simpan NULL agar tidak jadi titik palsu.
 */
const parseLocation = (value) => {
  const parts = normalize(value).split(",").map((part) => Number(normalize(part)));
  if (parts.length !== 2 || parts.some((part) => !Number.isFinite(part))) {
    return { latitude: null, longitude: null };
  }
  const [longitude, latitude] = parts;
  if (longitude === 0 && latitude === 0) return { latitude: null, longitude: null };
  return { latitude, longitude };
};

const isMovingRow = (speedKmh, accState) =>
  speedKmh != null && speedKmh > MOVING_SPEED_EPSILON && accState !== "off";

/** Jarak great-circle; dipakai hanya antar titik yang koordinatnya valid. */
const haversineKm = (lat1, lon1, lat2, lon2) => {
  if ([lat1, lon1, lat2, lon2].some((v) => v == null || !Number.isFinite(v))) return 0;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const getSettings = async () => {
  const [rows] = await db.query("SELECT setting_key, setting_value FROM bbs_settings");
  const map = { ...SETTING_DEFAULTS };
  (rows || []).forEach((row) => {
    const parsed = Number(row.setting_value);
    if (Number.isFinite(parsed)) map[row.setting_key] = parsed;
  });
  // Path 1: kolom weight disimpan 0-1. Path 2: user mengetik "30" -> diperlakukan 30%.
  const rawWeight = map[SETTING_KEYS.weight];
  const weightFraction = rawWeight > 1 ? rawWeight / 100 : rawWeight;
  return {
    thresholdKmh: map[SETTING_KEYS.threshold],
    retentionDays: map[SETTING_KEYS.retentionDays],
    penaltyFactor: map[SETTING_KEYS.penaltyFactor],
    weight: weightFraction,
    burstGapSeconds: map[SETTING_KEYS.burstGapSeconds],
    sampleIntervalSeconds: map[SETTING_KEYS.sampleInterval],
    raw: map
  };
};

const validateSetting = (key, value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return { ok: false, message: "Nilai harus berupa angka." };

  // Bobot boleh diketik sebagai persen (30) atau fraksi (0.3). UI memakai persen,
  // jadi keduanya diterima dan dinormalisasi ke fraksi sebelum validasi batas.
  if (key === SETTING_KEYS.weight && num > 1) {
    const asFraction = num / 100;
    if (asFraction < 0 || asFraction > 1) {
      return { ok: false, message: "Nilai harus antara 0 dan 100 (persen)." };
    }
    return { ok: true, value: asFraction };
  }

  const bounds = SETTING_BOUNDS[key];
  if (!bounds) return { ok: false, message: `Setting tidak dikenal: ${key}` };
  if (num < bounds.min || num > bounds.max) {
    return { ok: false, message: `Nilai harus antara ${bounds.min} dan ${bounds.max}.` };
  }
  if (bounds.integer && !Number.isInteger(num)) {
    return { ok: false, message: "Nilai harus bilangan bulat." };
  }
  return { ok: true, value: num };
};

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Baca workbook (dari buffer xlsx) menjadi baris siap-insert.
 * Mengembalikan counter + errors, tidak menyentuh DB.
 */
const parseSpeedWorkbook = (workbook, { sourceFile, driverRows } = {}) => {
  const sheetName = workbook?.SheetNames?.[0];
  if (!sheetName) throw new Error("Sheet tidak ditemukan.");
  const rawRows = require("xlsx").utils.sheet_to_json(workbook.Sheets[sheetName], {
    raw: true,
    defval: ""
  });

  const errors = [];
  const stats = {
    total: rawRows.length,
    parsed: 0,
    duplicates: 0,
    skipped_idle: 0,
    unmatched_driver: 0,
    invalid: 0
  };
  if (!rawRows.length) return { rows: [], errors, stats };

  const headerMap = Object.keys(rawRows[0]).reduce((map, key) => {
    map[normalizeHeader(key)] = key;
    return map;
  }, {});
  const missing = REQUIRED_HEADERS.filter((header) => !headerMap[header]);
  if (missing.length) {
    const error = new Error(`Kolom wajib tidak ditemukan: ${missing.join(", ")}.`);
    error.code = "MISSING_HEADERS";
    throw error;
  }

  // Prefix driverMap supaya driver dari ADAS (id numerik) tidak bentrok dengan
  // fallback Speed (string "SPEED:<plate>") saat nilai digabung sebagai string.
  const driverMap = new Map();
  (driverRows || []).forEach((driver) => {
    const plate = normalizePlate(driver.no_polisi);
    if (plate && !driverMap.has(plate)) driverMap.set(plate, driver);
  });

  const get = (row, header) => row[headerMap[header]];
  const seen = new Set();
  const rows = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const deviceId = normalize(get(row, "device id"));
    const plate = normalize(get(row, "device name"));
    const creationTime = toMysqlDateTime(get(row, "creation time"));
    const speedKmh = parseDecimal(get(row, "speed"));

    if (!deviceId || !plate || !creationTime || speedKmh == null) {
      stats.invalid += 1;
      if (errors.length < MAX_ERRORS) {
        errors.push({
          row: rowNumber,
          field: !creationTime ? "Creation Time" : !speedKmh ? "Speed" : "header",
          message: !deviceId
            ? "Device ID wajib diisi."
            : !plate
              ? "Device Name wajib diisi."
              : !creationTime
                ? "Creation Time tidak valid."
                : "Speed tidak valid."
        });
      }
      return;
    }

    // Dedup dalam satu file. Terverifikasi pada data nyata: 13 timestamp kembar
    // dan seluruhnya punya Speed identik, jadi tidak ada data yang hilang.
    const uniqueKey = `${deviceId}|${creationTime}`;
    if (seen.has(uniqueKey)) {
      stats.duplicates += 1;
      return;
    }
    seen.add(uniqueKey);

    const fleet = normalize(get(row, "fleet name")) || null;
    const accStateRaw = normalize(get(row, "acc state")).toLowerCase();
    const accState = accStateRaw === "on" || accStateRaw === "off" ? accStateRaw : null;
    const { latitude, longitude } = parseLocation(get(row, "location"));
    const moving = isMovingRow(speedKmh, accState);

    const plateKey = normalizePlate(plate);
    const driver = driverMap.get(plateKey);
    if (!driver) stats.unmatched_driver += 1;

    if (!moving) stats.skipped_idle += 1;
    stats.parsed += 1;

    rows.push({
      rowNumber,
      uniqueKey,
      deviceId,
      plateNumber: plate.toUpperCase(),
      driverId: driver ? `ID:${driver.id_driver}` : `SPEED:${plateKey}`.slice(0, 30),
      fleet,
      creationTime,
      speedKmh,
      altitude: parseDecimal(get(row, "altitude")),
      latitude,
      longitude,
      accState,
      isMoving: moving ? 1 : 0,
      sourceFile: sourceFile ? String(sourceFile).slice(0, 160) : null
    });
  });

  return { rows, errors, stats };
};

// ---------------------------------------------------------------------------
// Storage filtering (downsampling)
// ---------------------------------------------------------------------------

/**
 * Pilih baris mana yang DISIMPAN ke bbs_speed_telemetry.
 *
 * Penting: baris yang dibuang di sini TETAP dipakai untuk menghitung agregat
 * harian/event pada saat import (perhitungan itu butuh baris penuh), jadi
 * memangkas di sini tidak menghilangkan makna data — hanya detail mentahnya.
 *
 * Aturan per bucket interval sampling (anchor epoch UTC → deterministik):
 *   1. Baris idle (is_moving=0) tidak pernah disimpan.
 *   2. Semua baris bergerak dengan speedKmh > threshold disimpan penuh;
 *      durasi overspeed tiap baris tetap SLOT_SECONDS (30 detik).
 *   3. Maksimal SATU sampel baris bergerak per bucket, diambil baris pertama
 *      (representasi kecepatan rendah yang tidak bias). Bucket yang baris
 *      pertamanya sudah overspeed tidak menambah sampel.
 *   4. `movingSeconds` per baris diatur agar total per bucket = jumlah baris
 *      bergerak sebenarnya x 30 detik. Dengan begitu recompute dari data yang
 *      sudah tersampel menghasilkan moving_seconds yang SAMA PERSIS.
 */
const selectStorageRows = (rows, { thresholdKmh, sampleIntervalSeconds } = {}) => {
  const intervalMs =
    Math.max(60, Number(sampleIntervalSeconds) || DEFAULT_SAMPLE_INTERVAL_SECONDS) * 1000;
  const threshold = Number(thresholdKmh);
  const stats = { keptOverspeed: 0, keptSampled: 0, droppedIdle: 0, droppedMoving: 0 };

  if (!rows || !rows.length) return { rows: [], stats };

  // Urutan kanonik: "baris pertama bucket" harus deterministik walau urutan
  // file diacak atau beberapa file saling tumpang tindih.
  const movingRows = rows
    .filter((row) => row.isMoving === 1)
    .sort((a, b) => {
      const diff = mysqlToEpochMs(a.creationTime) - mysqlToEpochMs(b.creationTime);
      return diff || String(a.deviceId).localeCompare(String(b.deviceId));
    });

  const byBucket = new Map();
  movingRows.forEach((row) => {
    const bucketId = Math.floor(mysqlToEpochMs(row.creationTime) / intervalMs);
    const key = `${row.deviceId}|${bucketId}`;
    if (!byBucket.has(key)) byBucket.set(key, []);
    byBucket.get(key).push(row);
  });

  const kept = [];
  byBucket.forEach((bucketRows) => {
    const movingCount = bucketRows.length;
    const overRows = bucketRows.filter((row) => row.speedKmh > threshold);
    const overCount = overRows.length;
    const firstRow = bucketRows[0];
    const hasLowSample = firstRow.speedKmh <= threshold;
    // Total waktu bergerak bucket diambil dari nilai movingSeconds yang SUDAH
    // ada di baris (fallback 30 detik untuk data penuh/import). Ini membuat
    // fungsi IDEMPOTENT: dijalankan ulang di atas data yang sudah tersampel
    // menghasilkan nilai yang sama, bukan menyusutkan moving_seconds.
    const bucketMovingSeconds = bucketRows.reduce(
      (sum, row) => sum + (row.movingSeconds ?? SLOT_SECONDS),
      0
    );

    if (overCount === 0) {
      // Satu sampel mewakili seluruh bucket → membawa seluruh waktu bergerak.
      kept.push({ ...firstRow, movingSeconds: bucketMovingSeconds });
      stats.keptSampled += 1;
      stats.droppedMoving += movingCount - 1;
      return;
    }

    const nonOverSeconds = Math.max(0, bucketMovingSeconds - overCount * SLOT_SECONDS);
    overRows.forEach((row, index) => {
      // Tanpa sampel kecepatan rendah, baris over pertama menampung sisa waktu
      // non-over supaya total moving_seconds bucket tetap utuh.
      const movingSeconds = hasLowSample
        ? SLOT_SECONDS
        : index === 0
          ? nonOverSeconds + SLOT_SECONDS
          : SLOT_SECONDS;
      kept.push({ ...row, movingSeconds });
      stats.keptOverspeed += 1;
    });

    if (hasLowSample) {
      kept.push({ ...firstRow, movingSeconds: nonOverSeconds });
      stats.keptSampled += 1;
      stats.droppedMoving += movingCount - overCount - 1;
    } else {
      stats.droppedMoving += movingCount - overCount;
    }
  });

  stats.droppedIdle = rows.length - movingRows.length;

  return { rows: kept, stats };
};

// ---------------------------------------------------------------------------
// Burst detection
// ---------------------------------------------------------------------------

/**
 * Gabungkan baris bergerak yang berurutan di atas threshold menjadi satu event.
 * Gap antar baris <= burstGapSeconds dianggap masih satu kejadian.
 *
 * Event yang melintasi batas bulan DIPOTONG di tanggal 1 agar month_key tunggal.
 */
const detectOverspeedEvents = (movingRows, thresholdKmh, burstGapSeconds) => {
  const sorted = [...movingRows].sort(
    (a, b) => mysqlToEpochMs(a.creationTime) - mysqlToEpochMs(b.creationTime)
  );
  const gapMs = Number(burstGapSeconds) * 1000;
  const over = sorted.filter((row) => row.speedKmh > thresholdKmh);
  if (!over.length) return [];

  const events = [];
  let bucket = [over[0]];

  const flush = () => {
    if (!bucket.length) return;
    const first = bucket[0];
    const last = bucket[bucket.length - 1];
    const speeds = bucket.map((row) => row.speedKmh);
    let distance = 0;
    for (let i = 1; i < bucket.length; i += 1) {
      const prev = bucket[i - 1];
      const curr = bucket[i];
      distance += haversineKm(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    }
    events.push({
      deviceId: first.deviceId,
      plateNumber: first.plateNumber,
      driverId: first.driverId,
      fleet: first.fleet,
      beginTime: first.creationTime,
      endTime: last.creationTime,
      durationSeconds: Math.max(SLOT_SECONDS, bucket.length * SLOT_SECONDS),
      maxSpeedKmh: Math.max(...speeds),
      avgSpeedKmh: speeds.reduce((sum, v) => sum + v, 0) / speeds.length,
      sampleCount: bucket.length,
      distanceKm: Math.round(distance * 1000) / 1000,
      thresholdKmh,
      monthKey: monthKeyOf(first.creationTime)
    });
    bucket = [];
  };

  for (let i = 1; i < over.length; i += 1) {
    const prevMs = mysqlToEpochMs(over[i - 1].creationTime);
    const currMs = mysqlToEpochMs(over[i].creationTime);
    if (!Number.isFinite(prevMs) || !Number.isFinite(currMs)) continue;
    if (currMs - prevMs > gapMs) {
      // Gap terlalu jauh -> kejadian berbeda.
      flush();
    } else if (monthKeyOf(over[i].creationTime) !== monthKeyOf(bucket[0].creationTime)) {
      // Lintas bulan -> potong supaya agregat per bulan tetap benar.
      flush();
    }
    bucket.push(over[i]);
  }
  flush();

  return events;
};

/**
 * Agregat harian per device. Hanya baris bergerak yang dihitung untuk
 * moving_seconds / avg_moving_speed; overspeed memakai durasi slot.
 */
const buildDailyAggregates = (rows, thresholdKmh, burstGapSeconds) => {
  const byDeviceDay = new Map();
  rows.forEach((row) => {
    const key = `${row.deviceId}|${dayOf(row.creationTime)}`;
    if (!byDeviceDay.has(key)) byDeviceDay.set(key, []);
    byDeviceDay.get(key).push(row);
  });

  const out = [];
  byDeviceDay.forEach((bucket) => {
    const sorted = [...bucket].sort(
      (a, b) => mysqlToEpochMs(a.creationTime) - mysqlToEpochMs(b.creationTime)
    );
    const moving = sorted.filter((row) => row.isMoving === 1);
    const over = moving.filter((row) => row.speedKmh > thresholdKmh);

    let distance = 0;
    for (let i = 1; i < moving.length; i += 1) {
      const prev = moving[i - 1];
      const curr = moving[i];
      distance += haversineKm(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    }

    // Rata-rata kecepatan berbobot moving_seconds, supaya baris overspeed yang
    // "menampung" durasi bucket (lihat selectStorageRows) tidak mendistorsi
    // rata-rata. Untuk data resolusi penuh (semua moving_seconds = 30) hasilnya
    // identik dengan rata-rata biasa.
    const movingSecondsTotal = moving.reduce((sum, row) => sum + (row.movingSeconds ?? SLOT_SECONDS), 0);
    const speedWeighted = moving.reduce(
      (sum, row) => sum + row.speedKmh * (row.movingSeconds ?? SLOT_SECONDS),
      0
    );
    const first = sorted[0];
    out.push({
      deviceId: first.deviceId,
      plateNumber: first.plateNumber,
      driverId: first.driverId,
      fleet: first.fleet,
      day: dayOf(first.creationTime),
      // moving_seconds per baris (bukan jumlah baris x slot) supaya data yang
      // sudah di-downsample tetap menghasilkan waktu bergerak yang benar.
      movingSeconds: movingSecondsTotal,
      overspeedSeconds: over.length * SLOT_SECONDS,
      distanceKm: Math.round(distance * 1000) / 1000,
      maxSpeedKmh: sorted.length ? Math.max(...sorted.map((row) => row.speedKmh)) : 0,
      avgMovingSpeedKmh: movingSecondsTotal > 0 ? speedWeighted / movingSecondsTotal : 0,
      eventCount: detectOverspeedEvents(moving, thresholdKmh, burstGapSeconds).length
    });
  });

  return out;
};

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Skor kategori Kecepatan, bentuknya konsisten dengan kategori ADAS:
 *   skor = max(0, 100 - persenWaktuOverspeed * penalty)
 *
 * Rate berbasis DURASI (bukan jumlah event) supaya adil antar unit yang
 * jam kerjanya berbeda.
 */
const computeSpeedScore = ({ movingSeconds, overspeedSeconds }, penaltyFactor) => {
  if (!movingSeconds || movingSeconds <= 0) {
    return { score: null, overspeedRate: null, hasData: false };
  }
  const overspeedRate = (overspeedSeconds / movingSeconds) * 100;
  const score = Math.max(0, Math.round(100 - (overspeedRate / 100) * penaltyFactor * 100));
  return { score, overspeedRate: Math.round(overspeedRate * 100) / 100, hasData: true };
};

/**
 * Gabungkan skor kategori dengan bobot, lalu normalisasi terhadap kategori yang
 * PUNYA data. Unit tanpa data Speed otomatis di-reweight dari kategori lain.
 */
const computeOverallScore = (categoryScores, weights) => {
  let weightedSum = 0;
  let weightTotal = 0;
  Object.entries(categoryScores).forEach(([category, score]) => {
    if (score == null) return;
    const weight = Number(weights[category] || 0);
    if (weight <= 0) return;
    weightedSum += score * weight;
    weightTotal += weight;
  });
  if (weightTotal <= 0) return { score: null, weighted: 0 };
  return { score: Math.round(weightedSum / weightTotal), weighted: Math.round(weightTotal * 100) / 100 };
};

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const chunk = (items, size) => {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

/**
 * Tulis baris telemetry hasil parse. Idempotent lewat UNIQUE (device_id, creation_time)
 * + INSERT IGNORE, jadi re-import file yang sama tidak menggandakan data.
 */
const insertTelemetryRows = async (rows, idAdmin) => {
  if (!rows.length) return { inserted: 0 };
  let inserted = 0;
  for (const batch of chunk(rows, 500)) {
    const values = batch.map((row) => [
      row.deviceId,
      row.plateNumber,
      row.driverId,
      row.fleet,
      row.creationTime,
      row.speedKmh,
      row.altitude,
      row.latitude,
      row.longitude,
      row.accState,
      row.isMoving,
      row.movingSeconds ?? SLOT_SECONDS,
      row.sourceFile,
      idAdmin ?? null
    ]);
    const [result] = await db.query(
      `INSERT IGNORE INTO bbs_speed_telemetry
         (device_id, plate_number, driver_id, fleet, creation_time, speed_kmh, altitude,
          latitude, longitude, acc_state, is_moving, moving_seconds, source_file, id_admin)
       VALUES ?`,
      [values]
    );
    inserted += result.affectedRows || 0;
  }
  return { inserted };
};

// Tabel Speed; dipakai sebagai whitelist saat rebuild (OPTIMIZE TABLE tidak
// menerima placeholder, jadi nama tabel tidak boleh berasal dari input mentah).
const SPEED_TABLES = ["bbs_speed_telemetry", "bbs_speed_events", "bbs_speed_daily"];

/**
 * Rebuild tabel Speed supaya ruang yang dibebaskan DELETE benar-benar kembali ke
 * disk. InnoDB hanya menandai halaman sebagai bebas-pakai-ulang saat DELETE,
 * sehingga ukuran file tabel tidak menyusut sampai tabel di-rebuild.
 *
 * Operasi ini mahal (recreate + analyze) — panggil HANYA setelah pembersihan
 * besar (purge retensi / hapus per bulan / backfill), bukan setiap import.
 */
const optimizeSpeedTables = async (tables = SPEED_TABLES) => {
  const requested = Array.isArray(tables) && tables.length ? tables : SPEED_TABLES;
  const targets = requested.filter((name) => SPEED_TABLES.includes(name));
  const results = [];
  for (const table of targets) {
    try {
      const [rows] = await db.query(`OPTIMIZE TABLE \`${table}\``);
      const status = (rows || []).find((row) => row.Msg_type === "status");
      results.push({ table, ok: true, status: status?.Msg_text || "OK" });
    } catch (error) {
      // Satu tabel gagal tidak boleh menggagalkan keseluruhan pembersihan.
      results.push({ table, ok: false, error: error.message });
    }
  }
  return results;
};

/**
 * Hitung ulang event + agregat harian dari data mentah.
 * Dipakai setelah import DAN setelah threshold diubah (Opsi A).
 *
 * Cakupan: deviceIds (opsional) dan/atau monthKey (opsional).
 * Kalau keduanya kosong, wajib lewatkan scope='all' secara eksplisit supaya
 * penghapusan menyeluruh tidak pernah terjadi karena kelalaian argumen.
 */
const recomputeSpeedAggregates = async ({
  deviceIds = null,
  monthKey = null,
  scope = null,
  thresholdKmh,
  burstGapSeconds
} = {}) => {
  const hasDeviceFilter = Boolean(deviceIds && deviceIds.length);
  const hasMonthFilter = Boolean(monthKey && /^\d{4}-\d{2}$/.test(monthKey));
  if (!hasDeviceFilter && !hasMonthFilter && scope !== "all") {
    throw new Error("recomputeSpeedAggregates: tentukan deviceIds/monthKey, atau scope='all'.");
  }

  const settings = await getSettings();
  const threshold = thresholdKmh ?? settings.thresholdKmh;
  const gap = burstGapSeconds ?? settings.burstGapSeconds;

  // Kondisi yang sama dipakai untuk SELECT (sumber) dan DELETE (target),
  // supaya keduanya selalu sinkron.
  const selectConds = [];
  const selectParams = [];
  if (hasDeviceFilter) {
    selectConds.push(`device_id IN (${deviceIds.map(() => "?").join(",")})`);
    selectParams.push(...deviceIds);
  }
  if (hasMonthFilter) {
    selectConds.push("DATE_FORMAT(creation_time, '%Y-%m') = ?");
    selectParams.push(monthKey);
  }
  const selectWhere = selectConds.length ? `WHERE ${selectConds.join(" AND ")}` : "";

  const [rows] = await db.query(
    `SELECT device_id, plate_number, driver_id, fleet, creation_time, speed_kmh,
            latitude, longitude, acc_state, is_moving, moving_seconds
       FROM bbs_speed_telemetry ${selectWhere}
       ORDER BY device_id ASC, creation_time ASC`,
    selectParams
  );

  // Event & daily dihapus dengan kondisi yang sama, tapi kolom waktunya berbeda
  // (events.month_key / daily.day) sehingga dibangun terpisah.
  const eventConds = [];
  const eventParams = [];
  const dailyConds = [];
  const dailyParams = [];
  if (hasDeviceFilter) {
    const placeholders = deviceIds.map(() => "?").join(",");
    eventConds.push(`device_id IN (${placeholders})`);
    eventParams.push(...deviceIds);
    dailyConds.push(`device_id IN (${placeholders})`);
    dailyParams.push(...deviceIds);
  }
  if (hasMonthFilter) {
    eventConds.push("month_key = ?");
    eventParams.push(monthKey);
    dailyConds.push("DATE_FORMAT(day, '%Y-%m') = ?");
    dailyParams.push(monthKey);
  }
  await db.query(
    `DELETE FROM bbs_speed_events ${eventConds.length ? `WHERE ${eventConds.join(" AND ")}` : ""}`,
    eventParams
  );
  await db.query(
    `DELETE FROM bbs_speed_daily ${dailyConds.length ? `WHERE ${dailyConds.join(" AND ")}` : ""}`,
    dailyParams
  );

  if (!rows || !rows.length) return { events: 0, dailyDays: 0, devices: 0, rows: 0 };

  const normalized = rows.map((row) => ({
    deviceId: row.device_id,
    plateNumber: row.plate_number,
    driverId: row.driver_id,
    fleet: row.fleet,
    creationTime: row.creation_time,
    speedKmh: Number(row.speed_kmh),
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    accState: row.acc_state,
    isMoving: Number(row.is_moving) === 1 ? 1 : 0,
    movingSeconds: Number(row.moving_seconds) || SLOT_SECONDS
  }));

  // Kelompokkan per device supaya deteksi burst tidak tercampur antar kendaraan.
  const byDevice = new Map();
  normalized.forEach((row) => {
    if (!byDevice.has(row.deviceId)) byDevice.set(row.deviceId, []);
    byDevice.get(row.deviceId).push(row);
  });

  const allEvents = [];
  const allDaily = [];
  byDevice.forEach((deviceRows) => {
    const moving = deviceRows.filter((row) => row.isMoving === 1);
    allEvents.push(...detectOverspeedEvents(moving, threshold, gap));
    allDaily.push(...buildDailyAggregates(deviceRows, threshold, gap));
  });

  if (allEvents.length) {
    for (const batch of chunk(allEvents, 500)) {
      const values = batch.map((event) => [
        event.deviceId,
        event.plateNumber,
        event.driverId,
        event.fleet,
        event.beginTime,
        event.endTime,
        event.durationSeconds,
        Math.round(event.maxSpeedKmh * 100) / 100,
        Math.round(event.avgSpeedKmh * 100) / 100,
        event.sampleCount,
        event.distanceKm,
        event.thresholdKmh,
        event.monthKey
      ]);
      await db.query(
        `INSERT INTO bbs_speed_events
           (device_id, plate_number, driver_id, fleet, begin_time, end_time, duration_seconds,
            max_speed_kmh, avg_speed_kmh, sample_count, distance_km, threshold_kmh, month_key)
         VALUES ?`,
        [values]
      );
    }
  }

  if (allDaily.length) {
    for (const batch of chunk(allDaily, 500)) {
      const values = batch.map((row) => [
        row.deviceId,
        row.plateNumber,
        row.driverId,
        row.fleet,
        row.day,
        row.movingSeconds,
        row.overspeedSeconds,
        row.distanceKm,
        Math.round(row.maxSpeedKmh * 100) / 100,
        Math.round(row.avgMovingSpeedKmh * 100) / 100,
        row.eventCount
      ]);
      await db.query(
        `INSERT INTO bbs_speed_daily
           (device_id, plate_number, driver_id, fleet, day, moving_seconds, overspeed_seconds,
            distance_km, max_speed_kmh, avg_moving_speed_kmh, event_count)
         VALUES ?`,
        [values]
      );
    }
  }

  return { events: allEvents.length, dailyDays: allDaily.length, devices: byDevice.size, rows: normalized.length };
};

/**
 * Simulasi threshold tanpa menulis apa pun — dipakai live preview di UI.
 */
const previewThreshold = async ({ thresholdKmh, monthKey }) => {
  const settings = await getSettings();
  const conditions = ["is_moving = 1"];
  const params = [];
  if (monthKey && /^\d{4}-\d{2}$/.test(monthKey)) {
    conditions.push("DATE_FORMAT(creation_time, '%Y-%m') = ?");
    params.push(monthKey);
  }
  const [rows] = await db.query(
    `SELECT device_id, creation_time, speed_kmh, latitude, longitude
       FROM bbs_speed_telemetry
      WHERE ${conditions.join(" AND ")}
      ORDER BY device_id ASC, creation_time ASC`,
    params
  );

  const byDevice = new Map();
  (rows || []).forEach((row) => {
    if (!byDevice.has(row.device_id)) byDevice.set(row.device_id, []);
    byDevice.get(row.device_id).push({
      deviceId: row.device_id,
      creationTime: row.creation_time,
      speedKmh: Number(row.speed_kmh),
      latitude: row.latitude == null ? null : Number(row.latitude),
      longitude: row.longitude == null ? null : Number(row.longitude)
    });
  });

  let eventCount = 0;
  let overspeedSeconds = 0;
  byDevice.forEach((deviceRows) => {
    const events = detectOverspeedEvents(deviceRows, thresholdKmh, settings.burstGapSeconds);
    eventCount += events.length;
    overspeedSeconds += events.reduce((sum, event) => sum + event.durationSeconds, 0);
  });

  return {
    eventCount,
    overspeedSeconds,
    movingRows: (rows || []).length,
    devices: byDevice.size,
    // Preview dihitung dari data yang sudah tersampel, jadi hasilnya estimasi.
    resolution_seconds: settings.sampleIntervalSeconds,
    sampled: true
  };
};

module.exports = {
  SLOT_SECONDS,
  DEFAULT_SAMPLE_INTERVAL_SECONDS,
  SPEED_TABLES,
  REQUIRED_HEADERS,
  SETTING_KEYS,
  SETTING_DEFAULTS,
  SETTING_BOUNDS,
  MAX_ERRORS,
  normalize,
  normalizeHeader,
  normalizePlate,
  parseDecimal,
  toMysqlDateTime,
  mysqlToEpochMs,
  monthKeyOf,
  dayOf,
  parseLocation,
  isMovingRow,
  haversineKm,
  getSettings,
  validateSetting,
  parseSpeedWorkbook,
  selectStorageRows,
  detectOverspeedEvents,
  buildDailyAggregates,
  computeSpeedScore,
  computeOverallScore,
  insertTelemetryRows,
  optimizeSpeedTables,
  recomputeSpeedAggregates,
  previewThreshold
};
