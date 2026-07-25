#!/usr/bin/env node
/**
 * sync-from-production.js
 *
 * Digunakan setelah drop + import fresh dump dari production.
 * Script ini menganalisis setiap migration file dan menentukan apakah
 * efeknya sudah ada di DB atau belum:
 *
 *   - Jika efek migration sudah ada di DB  → tandai sebagai "applied" (skip SQL)
 *   - Jika efek migration belum ada di DB  → BIARKAN, akan dijalankan oleh `npm run migrate`
 *
 * Setelah script ini selesai, jalankan `npm run migrate` untuk apply
 * migration yang benar-benar baru.
 *
 * Usage:
 *   node scripts/sync-from-production.js
 *   npm run migrate
 *   npm run migrate:status   # verifikasi Pending: 0
 */

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const projectRoot  = path.join(__dirname, "..");
const migrationsDir = path.join(projectRoot, "db", "migrations");
const migrationTable = process.env.DBMATE_MIGRATIONS_TABLE || "schema_migrations";

// ─── DB helpers ──────────────────────────────────────────────────────────────

const connect = async () => {
  const host     = process.env.DB_HOST || "127.0.0.1";
  const port     = Number.parseInt(process.env.DB_PORT || "3306", 10);
  const user     = process.env.DB_USER || "root";
  const password = process.env.DB_PASS || "";
  const database = process.env.DB_NAME || "trucking";
  return mysql.createConnection({ host, port, user, password, database, multipleStatements: false });
};

const hasTable = async (conn, tableName) => {
  const db = process.env.DB_NAME || "trucking";
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = ? AND table_name = ?",
    [db, tableName]
  );
  return Number(rows[0].total) > 0;
};

const hasColumn = async (conn, tableName, columnName) => {
  const db = process.env.DB_NAME || "trucking";
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS total FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?",
    [db, tableName, columnName]
  );
  return Number(rows[0].total) > 0;
};

const hasColumnType = async (conn, tableName, columnName, dataType) => {
  const db = process.env.DB_NAME || "trucking";
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS total FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ? AND DATA_TYPE = ?",
    [db, tableName, columnName, dataType]
  );
  return Number(rows[0].total) > 0;
};

// ─── Migration effect checks ──────────────────────────────────────────────────
// Setiap fungsi mengembalikan true jika efek migration sudah ada di DB
// (sehingga migration bisa di-skip / ditandai sebagai applied).

const migrationChecks = {

  // Baseline schema — tabel inti sudah ada jika DB production diimport
  "20260401010000": async (conn) => {
    return await hasTable(conn, "admin") &&
           await hasTable(conn, "truck") &&
           await hasTable(conn, "sales_cost") &&
           await hasTable(conn, "area") &&
           await hasTable(conn, "driver") &&
           await hasTable(conn, "customer");
  },

  // Foreign keys untuk GPS tracking
  "20260401011000": async (conn) => {
    // Cek apakah kolom lat/lon di truck sudah nullable (hasil FK migration)
    return await hasTable(conn, "area_route_step");
  },

  // Tambah finish geofence ke area
  "20260401012000": async (conn) => {
    return await hasColumn(conn, "area", "finish_geofence_resource_id");
  },

  // Tambah is_active ke truck
  "20260424010000": async (conn) => {
    return await hasColumn(conn, "truck", "is_active");
  },

  // Tambah is_active ke driver
  "20260424011000": async (conn) => {
    return await hasColumn(conn, "driver", "is_active");
  },

  // Tambah patcher role
  "20260617000000": async (conn) => {
    // Cek enum di admin.level mengandung 'patcher'
    const db = process.env.DB_NAME || "trucking";
    const [rows] = await conn.query(
      "SELECT COLUMN_TYPE FROM information_schema.columns WHERE table_schema = ? AND table_name = 'admin' AND column_name = 'level'",
      [db]
    );
    if (!rows.length) return false;
    return String(rows[0].COLUMN_TYPE).includes("patcher");
  },

  // Buat tabel BBS
  "20260617010000": async (conn) => {
    return await hasTable(conn, "bbs_observations") &&
           await hasTable(conn, "bbs_incidents");
  },

  // Tambah koordinat ke bbs_incidents
  "20260619120000": async (conn) => {
    return await hasColumn(conn, "bbs_incidents", "lat") &&
           await hasColumn(conn, "bbs_incidents", "lng");
  },

  // Extend location di bbs_incidents
  "20260619130000": async (conn) => {
    // Cek panjang kolom location di bbs_incidents sudah diperlebar
    const db = process.env.DB_NAME || "trucking";
    const [rows] = await conn.query(
      "SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.columns WHERE table_schema = ? AND table_name = 'bbs_incidents' AND column_name = 'location'",
      [db]
    );
    if (!rows.length) return false;
    return Number(rows[0].CHARACTER_MAXIMUM_LENGTH) >= 500;
  },

  // Tambah koordinat ke bbs_observations
  "20260619140000": async (conn) => {
    return await hasColumn(conn, "bbs_observations", "lat") &&
           await hasColumn(conn, "bbs_observations", "lng");
  },

  // Rename delivery_order → departure_datetime (DATE → DATETIME)
  "20260717000000": async (conn) => {
    // Jika production sudah di-rename, kolom departure_datetime ada
    return await hasColumn(conn, "sales_cost", "departure_datetime") &&
           await hasColumnType(conn, "sales_cost", "departure_datetime", "datetime");
  },

  // Buat tabel delivery_notifications
  "20260717000001": async (conn) => {
    return await hasTable(conn, "delivery_notifications");
  },

  // Buat tabel sales_cost_step_schedule
  "20260717000002": async (conn) => {
    return await hasTable(conn, "sales_cost_step_schedule");
  },

  // Tambah step_ref ke delivery_notifications
  "20260717000003": async (conn) => {
    // Tabel delivery_notifications harus ada dulu
    if (!(await hasTable(conn, "delivery_notifications"))) return false;
    return await hasColumn(conn, "delivery_notifications", "id_area_route_step");
  },

  // Restructure sales_cost_step_schedule (tambah stop_order, stop_name, dll)
  "20260717000004": async (conn) => {
    if (!(await hasTable(conn, "sales_cost_step_schedule"))) return false;
    return await hasColumn(conn, "sales_cost_step_schedule", "stop_order") &&
           await hasColumn(conn, "sales_cost_step_schedule", "wialon_zone_id");
  },

  // Tambah id_sc_stop ke route_history
  "20260717000005": async (conn) => {
    return await hasColumn(conn, "sales_cost_route_history", "id_sc_stop");
  },

  // Tambah id_sc_stop ke delivery_notifications
  "20260717000006": async (conn) => {
    if (!(await hasTable(conn, "delivery_notifications"))) return false;
    return await hasColumn(conn, "delivery_notifications", "id_sc_stop");
  },

  // Tambah is_manual ke route_history
  "20260717000007": async (conn) => {
    return await hasColumn(conn, "sales_cost_route_history", "is_manual");
  },

  // Tambah GPS cache columns ke truck
  "20260717000008": async (conn) => {
    return await hasColumn(conn, "truck", "last_lat") &&
           await hasColumn(conn, "truck", "last_lng") &&
           await hasColumn(conn, "truck", "last_address") &&
           await hasColumn(conn, "truck", "last_gps_time");
  },

  // Nullable wialon fields di route_history
  "20260720000009": async (conn) => {
    // Cek apakah wialon_zone_id di route_history sudah nullable
    const db = process.env.DB_NAME || "trucking";
    const [rows] = await conn.query(
      "SELECT IS_NULLABLE FROM information_schema.columns WHERE table_schema = ? AND table_name = 'sales_cost_route_history' AND column_name = 'wialon_zone_id'",
      [db]
    );
    if (!rows.length) return false;
    return rows[0].IS_NULLABLE === "YES";
  },

  // Buat tabel delivery_notification_read
  "20260720000010": async (conn) => {
    return await hasTable(conn, "delivery_notification_read");
  },

  // Extend admin.password ke VARCHAR(255)
  "20260720000011": async (conn) => {
    const db = process.env.DB_NAME || "trucking";
    const [rows] = await conn.query(
      "SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.columns WHERE table_schema = ? AND table_name = 'admin' AND column_name = 'password'",
      [db]
    );
    if (!rows.length) return false;
    return Number(rows[0].CHARACTER_MAXIMUM_LENGTH) >= 255;
  },
};

// ─── Migration file helpers ───────────────────────────────────────────────────

const getMigrationFiles = () => {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Folder migration tidak ditemukan: ${migrationsDir}`);
  }
  return fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();
};

const getVersion = (fileName) => {
  const match = String(fileName).match(/^(\d+)/);
  if (!match) throw new Error(`Nama migration tidak valid: ${fileName}`);
  return match[1];
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const main = async () => {
  const migrationFiles = getMigrationFiles();
  if (migrationFiles.length === 0) throw new Error("Tidak ada file migration di db/migrations.");

  const conn = await connect();

  try {
    // Pastikan tabel schema_migrations ada
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`${migrationTable}\` (
        version VARCHAR(255) PRIMARY KEY
      )
    `);

    // Load versi yang sudah ter-apply
    const [appliedRows] = await conn.query(`SELECT version FROM \`${migrationTable}\` ORDER BY version ASC`);
    const appliedVersions = new Set(appliedRows.map(r => String(r.version)));

    console.log(`\nAnalisis ${migrationFiles.length} migration files...\n`);

    const toMark   = []; // migration yang efeknya sudah ada → tandai sebagai done
    const toApply  = []; // migration yang efeknya belum ada → biarkan untuk `npm run migrate`
    const noCheck  = []; // migration yang tidak ada check function-nya → biarkan

    for (const fileName of migrationFiles) {
      const version = getVersion(fileName);

      // Skip yang sudah ter-apply
      if (appliedVersions.has(version)) {
        console.log(`[X] ${fileName} (sudah applied)`);
        continue;
      }

      const checkFn = migrationChecks[version];
      if (!checkFn) {
        // Tidak ada check function → biarkan dbmate yang handle
        noCheck.push({ version, fileName });
        console.log(`[ ] ${fileName} (tidak ada check, akan dijalankan oleh migrate)`);
        continue;
      }

      const effectExists = await checkFn(conn);
      if (effectExists) {
        toMark.push({ version, fileName });
        console.log(`[~] ${fileName} (efek sudah ada di DB → akan ditandai sebagai applied)`);
      } else {
        toApply.push({ version, fileName });
        console.log(`[ ] ${fileName} (belum ada di DB → akan dijalankan oleh migrate)`);
      }
    }

    console.log("\n─────────────────────────────────────────────");
    console.log(`Akan ditandai sebagai applied : ${toMark.length}`);
    console.log(`Akan dijalankan oleh migrate  : ${toApply.length + noCheck.length}`);
    console.log("─────────────────────────────────────────────\n");

    if (toMark.length === 0) {
      console.log("Tidak ada migration yang perlu ditandai. Langsung jalankan: npm run migrate");
      return;
    }

    // Tandai migration yang efeknya sudah ada sebagai applied
    await conn.beginTransaction();
    for (const { version } of toMark) {
      await conn.query(`INSERT IGNORE INTO \`${migrationTable}\` (version) VALUES (?)`, [version]);
    }
    await conn.commit();

    console.log(`Berhasil menandai ${toMark.length} migration sebagai applied.`);
    console.log("\nLangkah berikutnya:");
    console.log("  npm run migrate        → apply migration yang belum ada");
    console.log("  npm run migrate:status → verifikasi Pending: 0\n");

  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    throw err;
  } finally {
    await conn.end();
  }
};

main().catch(err => {
  console.error("\nGagal sync from production:", err.message);
  process.exit(1);
});
