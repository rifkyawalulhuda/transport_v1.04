#!/usr/bin/env node
/**
 * backfill-speed-telemetry-storage.js
 *
 * Terapkan aturan penyimpanan Speed yang baru (baris > threshold + maksimal satu
 * sampel per interval sampling, tanpa baris idle) ke data bbs_speed_telemetry
 * yang SUDAH ada, supaya ukuran database langsung mengecil.
 *
 * Sifat:
 *   - Idempotent: dijalankan dua kali, jalan kedua tidak menghapus apa pun.
 *   - TIDAK menyentuh bbs_speed_events / bbs_speed_daily. Agregat harian yang
 *     sudah dihitung dari data penuh tetap dipertahankan.
 *   - Default dry-run. Pakai --confirm untuk benar-benar menulis.
 *
 * Pemakaian:
 *   node scripts/backfill-speed-telemetry-storage.js
 *   node scripts/backfill-speed-telemetry-storage.js --month=2026-09
 *   node scripts/backfill-speed-telemetry-storage.js --threshold=60 --confirm
 *   node scripts/backfill-speed-telemetry-storage.js --device=2590000898 --confirm
 *   node scripts/backfill-speed-telemetry-storage.js --confirm --optimize
 *
 * --threshold=  override ambang batas penyimpanan (default: setting
 *              speed.overspeed_threshold_kmh di bbs_settings).
 * --optimize    rebuild tabel Speed (OPTIMIZE TABLE) setelah selesai supaya
 *              ruang dari baris yang dihapus benar-benar dikembalikan ke disk.
 */

// dotenv WAJIB dimuat sebelum require("../db") karena db.js membaca process.env.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const db = require("../db");
const speed = require("../services/speedService");

const DELETE_BATCH = 1000;

const parseArgs = (argv) => {
  const flags = { dryRun: true, month: null, device: null, verbose: false, threshold: null, optimize: false };
  argv.forEach((arg) => {
    if (arg === "--confirm") flags.dryRun = false;
    else if (arg === "--dry-run") flags.dryRun = true;
    else if (arg === "--verbose") flags.verbose = true;
    else if (arg === "--optimize") flags.optimize = true;
    else if (arg.startsWith("--month=")) flags.month = arg.slice("--month=".length).trim();
    else if (arg.startsWith("--device=")) flags.device = arg.slice("--device=".length).trim();
    else if (arg.startsWith("--threshold=")) flags.threshold = arg.slice("--threshold=".length).trim();
  });
  if (flags.month && !/^\d{4}-\d{2}$/.test(flags.month)) {
    throw new Error(`Format --month harus YYYY-MM (diterima: ${flags.month}).`);
  }
  if (flags.threshold != null) {
    const validation = speed.validateSetting(speed.SETTING_KEYS.threshold, flags.threshold);
    if (!validation.ok) throw new Error(`--threshold: ${validation.message}`);
    flags.threshold = validation.value;
  }
  return flags;
};

const chunk = (items, size) => {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

/** Daftar (device_id, hari) yang perlu diperiksa. */
const listDeviceDays = async (flags) => {
  const conditions = [];
  const params = [];
  if (flags.month) {
    conditions.push("DATE_FORMAT(creation_time, '%Y-%m') = ?");
    params.push(flags.month);
  }
  if (flags.device) {
    conditions.push("device_id = ?");
    params.push(flags.device);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await db.query(
    `SELECT device_id, DATE_FORMAT(creation_time, '%Y-%m-%d') AS day, COUNT(*) AS total
       FROM bbs_speed_telemetry
       ${where}
      GROUP BY device_id, DATE_FORMAT(creation_time, '%Y-%m-%d')
      ORDER BY device_id ASC, day ASC`,
    params
  );
  // Map ke camelCase agar konsisten dengan processDeviceDay.
  return (rows || []).map((row) => ({
    deviceId: row.device_id,
    day: row.day,
    total: Number(row.total || 0)
  }));
};

/**
 * Proses satu device-day: pilih baris yang layak disimpan, update moving_seconds
 * baris terpilih, lalu hapus sisanya.
 */
const processDeviceDay = async ({ deviceId, day }, settings, flags) => {
  const [rows] = await db.query(
    `SELECT id_telemetry, device_id, creation_time, speed_kmh, is_moving, moving_seconds
       FROM bbs_speed_telemetry
      WHERE device_id = ?
        AND creation_time >= ?
        AND creation_time < DATE_ADD(DATE(?), INTERVAL 1 DAY)
      ORDER BY creation_time ASC`,
    [deviceId, day, day]
  );
  if (!rows || !rows.length) return null;

  const candidates = rows.map((row) => ({
    deviceId: row.device_id,
    creationTime: row.creation_time,
    speedKmh: Number(row.speed_kmh),
    isMoving: Number(row.is_moving),
    currentMovingSeconds: Number(row.moving_seconds) || speed.SLOT_SECONDS,
    // Dipakai selectStorageRows sebagai total waktu bucket → idempotent.
    movingSeconds: Number(row.moving_seconds) || speed.SLOT_SECONDS,
    idTelemetry: row.id_telemetry
  }));

  const { rows: kept, stats } = speed.selectStorageRows(candidates, {
    thresholdKmh: settings.thresholdKmh,
    sampleIntervalSeconds: settings.sampleIntervalSeconds
  });

  const keptIds = new Set(kept.map((row) => row.idTelemetry));
  const deleteIds = candidates
    .filter((row) => !keptIds.has(row.idTelemetry))
    .map((row) => row.idTelemetry);

  // Kelompokkan update per nilai moving_seconds supaya jumlah query kecil.
  const updatesBySeconds = new Map();
  kept.forEach((row) => {
    if (row.currentMovingSeconds === row.movingSeconds) return;
    if (!updatesBySeconds.has(row.movingSeconds)) updatesBySeconds.set(row.movingSeconds, []);
    updatesBySeconds.get(row.movingSeconds).push(row.idTelemetry);
  });

  let updated = 0;
  let deleted = 0;

  if (!flags.dryRun) {
    for (const [seconds, ids] of updatesBySeconds) {
      for (const batch of chunk(ids, DELETE_BATCH)) {
        const [result] = await db.query(
          "UPDATE bbs_speed_telemetry SET moving_seconds = ? WHERE id_telemetry IN (?)",
          [seconds, batch]
        );
        updated += result.affectedRows || 0;
      }
    }
    for (const batch of chunk(deleteIds, DELETE_BATCH)) {
      const [result] = await db.query(
        "DELETE FROM bbs_speed_telemetry WHERE id_telemetry IN (?)",
        [batch]
      );
      deleted += result.affectedRows || 0;
    }
  } else {
    updated = [...updatesBySeconds.values()].reduce((sum, ids) => sum + ids.length, 0);
    deleted = deleteIds.length;
  }

  return {
    deviceId,
    day,
    scanned: candidates.length,
    kept: kept.length,
    updated,
    deleted,
    keptOverspeed: stats.keptOverspeed,
    keptSampled: stats.keptSampled,
    droppedIdle: stats.droppedIdle,
    droppedMoving: stats.droppedMoving
  };
};

const main = async () => {
  let flags;
  try {
    flags = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`[ERR] ${error.message}`);
    return;
  }

  const settings = await speed.getSettings();
  // Threshold efektif: flag CLI menang atas setting DB (dipakai untuk
  // menyelaraskan kebijakan penyimpanan historis tanpa mengubah setting global).
  if (flags.threshold != null) settings.thresholdKmh = flags.threshold;
  const targets = await listDeviceDays(flags);

  console.log('\n=== BBS Speed — backfill penyimpanan telemetry ===');
  console.log(`Mode             : ${flags.dryRun ? 'DRY-RUN (tidak menulis)' : 'WRITE (--confirm)'}`);
  console.log(`Threshold        : ${settings.thresholdKmh} km/h${flags.threshold != null ? " (override --threshold)" : ""}`);
  console.log(`Interval sampling: ${settings.sampleIntervalSeconds} detik`);
  console.log(`Filter           : month=${flags.month || 'semua'}, device=${flags.device || 'semua'}`);
  console.log(`Device-day       : ${targets.length}\n`);

  if (!targets.length) {
    console.log('Tidak ada data yang perlu diproses.');
    return;
  }

  const totals = {
    scanned: 0,
    kept: 0,
    updated: 0,
    deleted: 0,
    keptOverspeed: 0,
    keptSampled: 0,
    droppedIdle: 0,
    droppedMoving: 0,
    failed: 0
  };

  let processed = 0;
  for (const target of targets) {
    try {
      const result = await processDeviceDay(target, settings, flags);
      if (!result) continue;
      totals.scanned += result.scanned;
      totals.kept += result.kept;
      totals.updated += result.updated;
      totals.deleted += result.deleted;
      totals.keptOverspeed += result.keptOverspeed;
      totals.keptSampled += result.keptSampled;
      totals.droppedIdle += result.droppedIdle;
      totals.droppedMoving += result.droppedMoving;

      if (flags.verbose) {
        console.log(
          `  ${result.deviceId} ${result.day}: scan=${result.scanned} keep=${result.kept} ` +
          `del=${result.deleted} upd=${result.updated}`
        );
      }
    } catch (error) {
      totals.failed += 1;
      console.error(`[ERR] ${target.deviceId} ${target.day}: ${error.message}`);
    }

    processed += 1;
    if (processed % 25 === 0) {
      console.log(`  ... ${processed}/${targets.length} device-day diproses`);
    }
  }

  const reduction = totals.scanned > 0
    ? Math.round((1 - totals.kept / totals.scanned) * 1000) / 10
    : 0;

  console.log('\n=== Ringkasan ===');
  console.log(`Baris dipindai       : ${totals.scanned}`);
  console.log(`Baris dipertahankan  : ${totals.kept} (${reduction}% lebih sedikit)`);
  console.log(`  - overspeed penuh  : ${totals.keptOverspeed}`);
  console.log(`  - sampel 3 menit   : ${totals.keptSampled}`);
  console.log(`Baris dihapus        : ${totals.deleted}`);
  console.log(`  - idle (ACC off)   : ${totals.droppedIdle}`);
  console.log(`  - bergerak (terpangkas): ${totals.droppedMoving}`);
  console.log(`moving_seconds di-update : ${totals.updated}`);
  if (totals.failed) console.log(`Device-day gagal     : ${totals.failed}`);

  if (flags.dryRun) {
    console.log('\nDRY-RUN: tidak ada perubahan ditulis. Jalankan ulang dengan --confirm untuk menerapkan.');
    if (flags.optimize) {
      console.log('(--optimize diminta; akan dijalankan pada mode WRITE)');
    }
  } else {
    if (flags.optimize) {
      console.log('\nRebuild tabel Speed (OPTIMIZE TABLE)...');
      const results = await speed.optimizeSpeedTables();
      results.forEach((row) => {
        if (row.ok) console.log(`  [OK] ${row.table}: ${row.status}`);
        else console.log(`  [ERR] ${row.table}: ${row.error}`);
      });
    }
    console.log('\nSelesai. Agregat (bbs_speed_events / bbs_speed_daily) tidak diubah.');
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[ERR] Backfill gagal:', error);
    process.exit(1);
  });
