#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env")
});

const projectRoot = path.join(__dirname, "..");
const migrationsDir = path.join(projectRoot, "db", "migrations");
const migrationTable = process.env.DBMATE_MIGRATIONS_TABLE || "schema_migrations";

const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Folder migration tidak ditemukan: ${dirPath}`);
  }
};

const getMigrationFiles = () => {
  ensureDirExists(migrationsDir);
  return fs
    .readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();
};

const getMigrationVersion = (fileName) => {
  const match = String(fileName).match(/^(\d+)/);
  if (!match) {
    throw new Error(`Nama migration tidak valid: ${fileName}`);
  }
  return match[1];
};

const connect = async (withoutDatabase = false) => {
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = Number.parseInt(process.env.DB_PORT || "3306", 10);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASS || "";
  const database = process.env.DB_NAME || "trucking";

  return mysql.createConnection({
    host,
    port: Number.isFinite(port) ? port : 3306,
    user,
    password,
    database: withoutDatabase ? undefined : database,
    multipleStatements: false
  });
};

const ensureDatabaseExists = async () => {
  const database = process.env.DB_NAME || "trucking";
  const connection = await connect(true);
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${String(database).replace(/`/g, "``")}\``
    );
  } finally {
    await connection.end();
  }
};

const ensureMigrationTable = async (connection) => {
  await connection.query(
    `
      CREATE TABLE IF NOT EXISTS \`${migrationTable}\` (
        version VARCHAR(255) PRIMARY KEY
      )
    `
  );
};

const loadAppliedVersions = async (connection) => {
  const [rows] = await connection.query(
    `SELECT version FROM \`${migrationTable}\` ORDER BY version ASC`
  );
  return new Set(rows.map((row) => String(row.version)));
};

const hasApplicationTables = async (connection) => {
  const database = process.env.DB_NAME || "trucking";
  const [rows] = await connection.query(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.tables
      WHERE table_schema = ?
        AND table_name IN ('admin', 'area', 'truck', 'sales_cost')
    `,
    [database]
  );

  return Number(rows?.[0]?.total || 0) > 0;
};

const hasColumn = async (connection, tableName, columnName) => {
  const database = process.env.DB_NAME || "trucking";
  const [rows] = await connection.query(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.columns
      WHERE table_schema = ?
        AND table_name = ?
        AND column_name = ?
    `,
    [database, tableName, columnName]
  );

  return Number(rows?.[0]?.total || 0) > 0;
};

const matchesLatestTrackedSchema = async (connection) => {
  const database = process.env.DB_NAME || "trucking";
  const [tableRows] = await connection.query(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = ?
        AND table_name IN (
          'admin',
          'area',
          'truck',
          'sales_cost',
          'area_route_step',
          'sales_cost_route_history'
        )
    `,
    [database]
  );

  const tableNames = new Set(tableRows.map((row) => String(row.table_name)));
  const requiredTables = [
    "admin",
    "area",
    "truck",
    "sales_cost",
    "area_route_step",
    "sales_cost_route_history"
  ];

  if (requiredTables.some((tableName) => !tableNames.has(tableName))) {
    return false;
  }

  const checks = await Promise.all([
    hasColumn(connection, "area", "kode_area"),
    hasColumn(connection, "truck", "wialon_unit_id"),
    hasColumn(connection, "sales_cost_route_history", "step_key"),
    hasColumn(connection, "sales_cost_route_history", "system_step_code")
  ]);

  return checks.every(Boolean);
};

const main = async () => {
  const migrationFiles = getMigrationFiles();
  if (migrationFiles.length === 0) {
    throw new Error("Belum ada file migration di db/migrations.");
  }

  await ensureDatabaseExists();
  const connection = await connect(false);

  try {
    await ensureMigrationTable(connection);
    const appliedVersions = await loadAppliedVersions(connection);
    const databaseLooksInitialized = await hasApplicationTables(connection);
    const latestSchemaReady = await matchesLatestTrackedSchema(connection);

    if (!databaseLooksInitialized && appliedVersions.size === 0) {
      throw new Error(
        "Database target terlihat masih kosong. Gunakan `npm run migrate` untuk bootstrap database baru."
      );
    }

    if (!latestSchemaReady) {
      throw new Error(
        "Database existing belum cocok dengan schema terbaru repo. Jalankan `npm run migrate` atau update schema-nya dulu sebelum adopt."
      );
    }

    const pendingVersions = migrationFiles
      .map((fileName) => ({
        fileName,
        version: getMigrationVersion(fileName)
      }))
      .filter((migration) => !appliedVersions.has(migration.version));

    if (pendingVersions.length === 0) {
      console.log("Semua migration sudah tercatat di schema_migrations.");
      return;
    }

    await connection.beginTransaction();
    for (const migration of pendingVersions) {
      await connection.query(
        `INSERT INTO \`${migrationTable}\` (version) VALUES (?)`,
        [migration.version]
      );
    }
    await connection.commit();

    console.log(
      `Menandai ${pendingVersions.length} migration sebagai applied untuk database existing.`
    );
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_rollbackError) {
      // ignore rollback failure when transaction was not started
    }
    throw error;
  } finally {
    await connection.end();
  }
};

main().catch((error) => {
  console.error("Gagal mengadopsi migration database existing:", error.message);
  process.exit(1);
});
