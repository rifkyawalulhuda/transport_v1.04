const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const MAX_ERRORS = 200;
const REQUIRED_HEADERS = ["device id", "device name", "alarm type", "begin time", "start position"];

const normalize = (value) => String(value ?? "").trim();
const normalizeHeader = (value) => normalize(value).toLowerCase().replace(/\s+/g, " ");
const normalizePlate = (value) => normalize(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
const parseNumber = (value) => {
  const match = normalize(value).replace(/,/g, ".").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const toMysqlDateTime = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const pad = (part) => String(part).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }
  const raw = normalize(value).replace("T", " ");
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})[\sT](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const [, y, mo, d, h, mi, s] = match;
    return `${y}-${mo}-${d} ${String(h).padStart(2, "0")}:${mi}:${s ? String(s).padStart(2, "0") : "00"}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const pad = (part) => String(part).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`;
};

const mapAlarm = (alarmType, geofenceName) => {
  const type = normalize(alarmType).toLowerCase();
  const geofence = normalize(geofenceName).toLowerCase();
  if (type.includes("eyes closed")) return { key: "o6", value: "berbahaya" };
  if (type.includes("yawn")) return { key: "o6", value: "berisiko" };
  if (type.includes("distract")) return { key: "o4", value: "berisiko" };
  if (type.includes("lane departure")) return { key: "o5", value: "berisiko" };
  if (type.includes("pedestrian collision") || type.includes("forward collision") || type.includes("headway monitoring")) {
    return { key: "o3", value: "berisiko" };
  }
  if (type.includes("speed") || type.includes("overspeed") || type.includes("over speed") || geofence.includes("kph")) {
    return { key: "o2", value: "berisiko" };
  }
  return { key: "o8", value: "berisiko" };
};

const parsePosition = (value) => {
  const parts = normalize(value).split(",").map(Number);
  if (parts.length !== 2 || parts.some((part) => !Number.isFinite(part))) return { latitude: null, longitude: null };
  return { longitude: parts[0], latitude: parts[1] };
};

const uploadFile = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) return next();
    const message = error.code === "LIMIT_FILE_SIZE" ? "Ukuran file maksimal 10 MB." : "Gagal mengunggah file.";
    return res.status(400).json({ success: false, message, errors: [{ row: null, field: "file", message }] });
  });
};

router.use(authenticateToken);

router.post("/import", uploadFile, async (req, res) => {
  if (String(req.user?.level || "") === "user") {
    return res.status(403).json({ success: false, message: "Anda tidak memiliki izin untuk mengimpor alarm ADAS." });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: "File belum dipilih.", errors: [{ row: null, field: "file", message: "File belum dipilih." }] });
  }

  const filename = normalize(req.file.originalname).toLowerCase();
  if (!filename.endsWith(".csv") && !filename.endsWith(".xlsx")) {
    return res.status(400).json({ success: false, message: "Format file harus CSV atau XLSX.", errors: [{ row: null, field: "file", message: "Format file harus CSV atau XLSX." }] });
  }

  let rows;
  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer", raw: true, cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("Sheet tidak ditemukan.");
    rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: true, defval: "" });
  } catch (error) {
    return res.status(400).json({ success: false, message: "File tidak dapat dibaca.", errors: [{ row: null, field: "file", message: "File tidak dapat dibaca." }] });
  }

  if (!rows.length) {
    return res.json({ success: true, total: 0, inserted: 0, duplicates: 0, dedup_burst: 0, skipped_no_driver: 0, failed: 0, errors: [], message: "Tidak ada data untuk diimpor." });
  }

  const firstRow = rows[0];
  const headerMap = Object.keys(firstRow).reduce((map, key) => {
    map[normalizeHeader(key)] = key;
    return map;
  }, {});
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headerMap[header]);
  if (missingHeaders.length) {
    return res.status(400).json({ success: false, message: "Header file tidak sesuai.", errors: [{ row: 1, field: "header", message: `Kolom wajib tidak ditemukan: ${missingHeaders.join(", ")}.` }] });
  }

  const [driverRows] = await db.query("SELECT id_driver, no_polisi, nama_driver, is_active FROM driver WHERE no_polisi IS NOT NULL AND TRIM(no_polisi) <> '' ORDER BY is_active DESC, id_driver ASC");
  const driverMap = new Map();
  driverRows.forEach((driver) => {
    const plate = normalizePlate(driver.no_polisi);
    if (plate && !driverMap.has(plate)) driverMap.set(plate, driver);
  });

  const errors = [];
  const prepared = [];
  const seen = new Set();
  const lastBurstByType = new Map();
  let skippedNoDriver = 0;
  let unmatchedDriver = 0;
  let duplicates = 0;
  let dedupBurst = 0;
  const get = (row, header) => row[headerMap[header]];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const deviceId = normalize(get(row, "device id"));
    const plate = normalize(get(row, "device name"));
    const alarmType = normalize(get(row, "alarm type"));
    const beginTime = toMysqlDateTime(get(row, "begin time"));
    const position = parsePosition(get(row, "start position"));
    const driver = driverMap.get(normalizePlate(plate));
    const rowErrors = [];

    if (!deviceId) rowErrors.push({ row: rowNumber, field: "device id", message: "Device ID wajib diisi." });
    if (!plate) rowErrors.push({ row: rowNumber, field: "device name", message: "Device Name/plat wajib diisi." });
    if (!alarmType) rowErrors.push({ row: rowNumber, field: "alarm type", message: "Alarm Type wajib diisi." });
    if (!beginTime) rowErrors.push({ row: rowNumber, field: "begin time", message: "Begin Time tidak valid." });

    if (rowErrors.length) {
      errors.push(...rowErrors);
      return;
    }

    if (!driver) unmatchedDriver += 1;
    const uniqueKey = `${deviceId}|${beginTime}|${alarmType.toLowerCase()}`;
    if (seen.has(uniqueKey)) {
      duplicates += 1;
      return;
    }

    const burstKey = `${deviceId}|${alarmType.toLowerCase()}`;
    const lastBurstTime = lastBurstByType.get(burstKey);
    const currentMs = new Date(beginTime.replace(" ", "T")).getTime();
    if (lastBurstTime != null && Math.abs(currentMs - lastBurstTime) <= 60 * 1000) {
      dedupBurst += 1;
      return;
    }
    lastBurstByType.set(burstKey, currentMs);
    seen.add(uniqueKey);
    const mapping = mapAlarm(alarmType, get(row, "geofence name"));
    const scores = { o1: "aman", o2: "aman", o3: "aman", o4: "aman", o5: "aman", o6: "aman", o7: "aman", o8: "aman" };
    scores[mapping.key] = mapping.value;
    const date = beginTime.slice(0, 10);
    prepared.push({
      rowNumber,
      uniqueKey,
      idAdmin: req.user?.id_admin,
      driverId: driver ? String(driver.id_driver) : `ADAS:${normalizePlate(plate)}`.slice(0, 30),
      observerName: "ADAS",
      date,
      location: normalize(get(row, "geofence name")) || normalize(get(row, "start position")) || null,
      latitude: position.latitude,
      longitude: position.longitude,
      vehicleType: null,
      scores: JSON.stringify(scores),
      feedback: `${alarmType} | ${normalize(get(row, "start details"))}`.slice(0, 1000),
      deviceId,
      alarmType,
      beginTime,
      fleet: normalize(get(row, "fleet")) || null,
      plateNumber: plate.toUpperCase()
    });
  });

  if (errors.length > MAX_ERRORS) errors.splice(MAX_ERRORS);
  if (!prepared.length) {
    return res.json({ success: errors.length === 0, total: rows.length, inserted: 0, duplicates, dedup_burst: dedupBurst, skipped_no_driver: skippedNoDriver, unmatched_driver: unmatchedDriver, failed: errors.length, errors, message: errors.length ? "Import selesai dengan error." : "Tidak ada data baru." });
  }

  const existing = new Set();
  const [existingRows] = await db.query("SELECT device_id, begin_time, alarm_type FROM bbs_observations WHERE source = 'adas' AND device_id IS NOT NULL AND begin_time IS NOT NULL AND alarm_type IS NOT NULL");
  existingRows.forEach((row) => existing.add(`${row.device_id}|${toMysqlDateTime(row.begin_time)}|${String(row.alarm_type).toLowerCase()}`));

  let inserted = 0;
  for (const item of prepared) {
    if (existing.has(item.uniqueKey)) {
      duplicates += 1;
      continue;
    }
    try {
      await db.query(
        `INSERT INTO bbs_observations (id_admin, observer_name, driver_id, date, location, latitude, longitude, vehicle_type, scores, feedback, follow_up, source, device_id, alarm_type, begin_time, fleet, plate_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.idAdmin, item.observerName, item.driverId, item.date, item.location, item.latitude, item.longitude, item.vehicleType, item.scores, item.feedback, null, "adas", item.deviceId, item.alarmType, item.beginTime, item.fleet, item.plateNumber]
      );
      inserted += 1;
      existing.add(item.uniqueKey);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") duplicates += 1;
      else if (errors.length < MAX_ERRORS) errors.push({ row: item.rowNumber, field: "database", message: "Gagal menyimpan data alarm." });
    }
  }

  const failed = errors.length;
  return res.json({ success: failed === 0, total: rows.length, inserted, duplicates, dedup_burst: dedupBurst, skipped_no_driver: skippedNoDriver, unmatched_driver: unmatchedDriver, failed, errors, message: failed === 0 ? "Import alarm ADAS berhasil." : "Import selesai dengan error." });
});

router.get("", async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const offset = (page - 1) * limit;
  const conditions = ["o.source = 'adas'"];
  const params = [];
  const plate = normalize(req.query.plate);
  const alarmType = normalize(req.query.alarm_type);
  const dateFrom = normalize(req.query.date_from);
  const dateTo = normalize(req.query.date_to);
  if (plate) { conditions.push("o.plate_number LIKE ?"); params.push(`%${plate}%`); }
  if (alarmType) { conditions.push("o.alarm_type = ?"); params.push(alarmType); }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) { conditions.push("o.date >= ?"); params.push(dateFrom); }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) { conditions.push("o.date <= ?"); params.push(dateTo); }
  const where = conditions.join(" AND ");
  const [[countRow], [rows]] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total FROM bbs_observations o WHERE ${where}`, params),
    db.query(`SELECT o.id_observation AS id, o.driver_id, d.nama_driver, o.date, o.location, o.latitude, o.longitude, o.scores, o.device_id, o.alarm_type, o.begin_time, o.fleet, o.plate_number, o.feedback, o.created_at FROM bbs_observations o LEFT JOIN driver d ON o.driver_id = d.id_driver WHERE ${where} ORDER BY o.begin_time DESC, o.id_observation DESC LIMIT ? OFFSET ?`, [...params, limit, offset])
  ]);
  res.json({ rows, pagination: { page, limit, total: Number(countRow[0]?.total || 0) } });
});

module.exports = router;
