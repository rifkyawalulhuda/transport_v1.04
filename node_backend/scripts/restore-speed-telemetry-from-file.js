#!/usr/bin/env node
/**
 * restore-speed-telemetry-from-file.js
 *
 * Memasukkan ULANG seluruh baris valid dari file Speed (CSV/XLSX) ke
 * bbs_speed_telemetry TANPA filter penyimpanan.
 *
 * Kapan dipakai:
 *   Setelah backfill downsampling dijalankan dengan threshold yang salah,
 *   baris yang sudah terhapus tidak bisa dikembalikan dari dalam DB. Script ini
 *   memulihkannya dari file sumber, sehingga backfill bisa dijalankan ulang
 *   dengan threshold yang benar tanpa kehilangan akurasi moving_seconds.
 *
 * Sifat:
 *   - INSERT IGNORE (UNIQUE device_id + creation_time) → idempotent, baris yang
 *     sudah ada tidak tertimpa.
 *   - Tidak mengubah bbs_speed_events / bbs_speed_daily.
 *   - Default dry-run. Pakai --confirm untuk menulis.
 *
 * Pemakaian:
 *   node scripts/restore-speed-telemetry-from-file.js ../docs/Speed_2590000898_20260915092300.csv
 *   node scripts/restore-speed-telemetry-from-file.js "D:/file/Speed_x.csv" --confirm
 */

// dotenv WAJIB dimuat sebelum require("../db") karena db.js membaca process.env.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const db = require("../db");
const speed = require("../services/speedService");

const parseArgs = (argv) => {
  const flags = { dryRun: true, file: null };
  argv.forEach((arg) => {
    if (arg === "--confirm") flags.dryRun = false;
    else if (arg === "--dry-run") flags.dryRun = true;
    else if (!arg.startsWith("--")) flags.file = arg;
  });
  if (!flags.file) throw new Error("Path file belum diberikan.");
  return flags;
};

const main = async () => {
  let flags;
  try {
    flags = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`[ERR] ${error.message}`);
    console.log("Pemakaian: node scripts/restore-speed-telemetry-from-file.js <file.csv|xlsx> [--confirm]");
    return;
  }

  const filePath = path.resolve(process.cwd(), flags.file);
  if (!fs.existsSync(filePath)) {
    console.error(`[ERR] File tidak ditemukan: ${filePath}`);
    return;
  }

  const workbook = xlsx.read(fs.readFileSync(filePath), {
    type: "buffer",
    raw: true,
    cellDates: true
  });

  // Driver map sama seperti route import supaya driver_id konsisten.
  const [driverRows] = await db.query(
    "SELECT id_driver, no_polisi, nama_driver, is_active FROM driver WHERE no_polisi IS NOT NULL AND TRIM(no_polisi) <> '' ORDER BY is_active DESC, id_driver ASC"
  );

  const { rows, errors, stats } = speed.parseSpeedWorkbook(workbook, {
    sourceFile: path.basename(filePath),
    driverRows
  });

  const months = [...new Set(rows.map((row) => speed.monthKeyOf(row.creationTime)))].sort();
  const devices = [...new Set(rows.map((row) => row.deviceId))];

  console.log("\n=== Restore telemetry Speed dari file ===");
  console.log(`File          : ${path.basename(filePath)}`);
  console.log(`Mode          : ${flags.dryRun ? "DRY-RUN (tidak menulis)" : "WRITE (--confirm)"}`);
  console.log(`Baris total   : ${stats.total}`);
  console.log(`Baris valid   : ${rows.length} (duplikat ${stats.duplicates}, idle ${stats.skipped_idle}, invalid ${stats.invalid})`);
  console.log(`Device        : ${devices.join(", ")}`);
  console.log(`Bulan         : ${months.join(", ")}`);

  if (errors.length) {
    console.log(`Error parse   : ${errors.length} (contoh: ${errors[0].message})`);
  }

  if (!rows.length) {
    console.log("\nTidak ada baris valid untuk dipulihkan.");
    return;
  }

  if (flags.dryRun) {
    console.log("\nDRY-RUN: tidak ada perubahan ditulis. Jalankan ulang dengan --confirm.");
    return;
  }

  const { inserted } = await speed.insertTelemetryRows(rows, null);
  console.log(`\nBaris dimasukkan: ${inserted} (sisanya sudah ada di DB).`);

  const placeholders = months.map(() => "?").join(",");
  const [[current]] = await db.query(
    `SELECT COUNT(*) AS total FROM bbs_speed_telemetry
      WHERE DATE_FORMAT(creation_time, '%Y-%m') IN (${placeholders})`,
    months
  );
  console.log(`Total baris telemetry untuk bulan ${months.join(", ")}: ${current.total}`);
  console.log("\nCatatan: jalankan backfill lagi untuk menerapkan kebijakan penyimpanan.");
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[ERR] Restore gagal:", error);
    process.exit(1);
  });