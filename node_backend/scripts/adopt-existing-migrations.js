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

const quoteIdentifier = (value) => `\`${String(value).replace(/`/g, "``")}\``;

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

const hasTable = async (connection, tableName) => {
  const database = process.env.DB_NAME || "trucking";
  const [rows] = await connection.query(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.tables
      WHERE table_schema = ?
        AND table_name = ?
    `,
    [database, tableName]
  );

  return Number(rows?.[0]?.total || 0) > 0;
};

const hasForeignKey = async (connection, tableName, constraintName) => {
  const database = process.env.DB_NAME || "trucking";
  const [rows] = await connection.query(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.table_constraints
      WHERE table_schema = ?
        AND table_name = ?
        AND constraint_name = ?
        AND constraint_type = 'FOREIGN KEY'
    `,
    [database, tableName, constraintName]
  );

  return Number(rows?.[0]?.total || 0) > 0;
};

const ensureColumn = async (connection, tableName, columnName, alterSql) => {
  if (await hasColumn(connection, tableName, columnName)) {
    return false;
  }

  await connection.query(alterSql);
  return true;
};

const ensureTable = async (connection, tableName, createSql) => {
  if (await hasTable(connection, tableName)) {
    return false;
  }

  await connection.query(createSql);
  return true;
};

const ensureForeignKey = async (connection, tableName, constraintName, alterSql) => {
  if (await hasForeignKey(connection, tableName, constraintName)) {
    return false;
  }

  await connection.query(alterSql);
  return true;
};

const upgradeLegacyTrackedSchema = async (connection) => {
  const changes = [];

  if (
    await ensureColumn(
      connection,
      "area",
      "kode_area",
      `
        ALTER TABLE ${quoteIdentifier("area")}
        ADD COLUMN ${quoteIdentifier("kode_area")} varchar(50) DEFAULT NULL
        AFTER ${quoteIdentifier("id_area")}
      `
    )
  ) {
    changes.push("Menambahkan kolom area.kode_area.");
  }

  if (
    await ensureColumn(
      connection,
      "area",
      "finish_geofence_resource_id",
      `
        ALTER TABLE ${quoteIdentifier("area")}
        ADD COLUMN ${quoteIdentifier("finish_geofence_resource_id")} bigint(20) DEFAULT NULL
        AFTER ${quoteIdentifier("nama_area")}
      `
    )
  ) {
    changes.push("Menambahkan kolom area.finish_geofence_resource_id.");
  }

  if (
    await ensureColumn(
      connection,
      "area",
      "finish_geofence_zone_id",
      `
        ALTER TABLE ${quoteIdentifier("area")}
        ADD COLUMN ${quoteIdentifier("finish_geofence_zone_id")} bigint(20) DEFAULT NULL
        AFTER ${quoteIdentifier("finish_geofence_resource_id")}
      `
    )
  ) {
    changes.push("Menambahkan kolom area.finish_geofence_zone_id.");
  }

  if (
    await ensureColumn(
      connection,
      "area",
      "finish_geofence_zone_name",
      `
        ALTER TABLE ${quoteIdentifier("area")}
        ADD COLUMN ${quoteIdentifier("finish_geofence_zone_name")} varchar(255) DEFAULT NULL
        AFTER ${quoteIdentifier("finish_geofence_zone_id")}
      `
    )
  ) {
    changes.push("Menambahkan kolom area.finish_geofence_zone_name.");
  }

  if (
    await ensureTable(
      connection,
      "area_route_step",
      `
        CREATE TABLE ${quoteIdentifier("area_route_step")} (
          ${quoteIdentifier("id_area_route_step")} int(13) NOT NULL AUTO_INCREMENT,
          ${quoteIdentifier("id_area")} int(13) NOT NULL,
          ${quoteIdentifier("step_order")} int(11) NOT NULL,
          ${quoteIdentifier("step_name")} varchar(100) NOT NULL,
          ${quoteIdentifier("wialon_resource_id")} bigint(20) NOT NULL,
          ${quoteIdentifier("wialon_zone_id")} bigint(20) NOT NULL,
          ${quoteIdentifier("wialon_zone_name")} varchar(255) NOT NULL,
          PRIMARY KEY (${quoteIdentifier("id_area_route_step")}),
          UNIQUE KEY ${quoteIdentifier("uniq_area_route_step_order")} (${quoteIdentifier("id_area")}, ${quoteIdentifier("step_order")}),
          UNIQUE KEY ${quoteIdentifier("uniq_area_route_step_zone")} (${quoteIdentifier("id_area")}, ${quoteIdentifier("wialon_resource_id")}, ${quoteIdentifier("wialon_zone_id")}),
          KEY ${quoteIdentifier("idx_area_route_step_area")} (${quoteIdentifier("id_area")})
        ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci
      `
    )
  ) {
    changes.push("Membuat tabel area_route_step.");
  }

  if (
    await ensureTable(
      connection,
      "sales_cost_route_history",
      `
        CREATE TABLE ${quoteIdentifier("sales_cost_route_history")} (
          ${quoteIdentifier("id_sales_cost_route_history")} int(13) NOT NULL AUTO_INCREMENT,
          ${quoteIdentifier("id_sales_cost")} int(30) NOT NULL,
          ${quoteIdentifier("id_area")} int(13) NOT NULL,
          ${quoteIdentifier("id_area_route_step")} int(13) DEFAULT NULL,
          ${quoteIdentifier("step_key")} varchar(100) NOT NULL DEFAULT '',
          ${quoteIdentifier("system_step_code")} varchar(50) DEFAULT NULL,
          ${quoteIdentifier("id_truck")} int(30) NOT NULL,
          ${quoteIdentifier("step_order_snapshot")} int(11) NOT NULL,
          ${quoteIdentifier("step_name_snapshot")} varchar(100) NOT NULL,
          ${quoteIdentifier("wialon_resource_id")} bigint(20) NOT NULL,
          ${quoteIdentifier("wialon_zone_id")} bigint(20) NOT NULL,
          ${quoteIdentifier("wialon_zone_name")} varchar(255) NOT NULL,
          ${quoteIdentifier("gps_time")} datetime NOT NULL,
          ${quoteIdentifier("recorded_at")} datetime NOT NULL DEFAULT current_timestamp(),
          ${quoteIdentifier("lat")} decimal(10,6) DEFAULT NULL,
          ${quoteIdentifier("lon")} decimal(10,6) DEFAULT NULL,
          PRIMARY KEY (${quoteIdentifier("id_sales_cost_route_history")}),
          UNIQUE KEY ${quoteIdentifier("uniq_sales_cost_step_key")} (${quoteIdentifier("id_sales_cost")}, ${quoteIdentifier("step_key")}),
          UNIQUE KEY ${quoteIdentifier("uniq_sales_cost_route_step")} (${quoteIdentifier("id_sales_cost")}, ${quoteIdentifier("id_area_route_step")}),
          KEY ${quoteIdentifier("idx_sales_cost_route_history_sales_cost")} (${quoteIdentifier("id_sales_cost")}),
          KEY ${quoteIdentifier("idx_sales_cost_route_history_area")} (${quoteIdentifier("id_area")}),
          KEY ${quoteIdentifier("idx_sales_cost_route_history_truck")} (${quoteIdentifier("id_truck")}),
          KEY ${quoteIdentifier("idx_sales_cost_route_history_step")} (${quoteIdentifier("id_area_route_step")})
        ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci
      `
    )
  ) {
    changes.push("Membuat tabel sales_cost_route_history.");
  }

  if (
    await ensureForeignKey(
      connection,
      "area_route_step",
      "fk_area_route_step_area",
      `
        ALTER TABLE ${quoteIdentifier("area_route_step")}
        ADD CONSTRAINT ${quoteIdentifier("fk_area_route_step_area")}
        FOREIGN KEY (${quoteIdentifier("id_area")}) REFERENCES ${quoteIdentifier("area")} (${quoteIdentifier("id_area")})
        ON DELETE CASCADE
      `
    )
  ) {
    changes.push("Menambahkan foreign key area_route_step -> area.");
  }

  if (
    await ensureForeignKey(
      connection,
      "sales_cost_route_history",
      "fk_sales_cost_route_history_sales_cost",
      `
        ALTER TABLE ${quoteIdentifier("sales_cost_route_history")}
        ADD CONSTRAINT ${quoteIdentifier("fk_sales_cost_route_history_sales_cost")}
        FOREIGN KEY (${quoteIdentifier("id_sales_cost")}) REFERENCES ${quoteIdentifier("sales_cost")} (${quoteIdentifier("id_sales_cost")})
        ON DELETE CASCADE
      `
    )
  ) {
    changes.push("Menambahkan foreign key sales_cost_route_history -> sales_cost.");
  }

  if (
    await ensureForeignKey(
      connection,
      "sales_cost_route_history",
      "fk_sales_cost_route_history_area",
      `
        ALTER TABLE ${quoteIdentifier("sales_cost_route_history")}
        ADD CONSTRAINT ${quoteIdentifier("fk_sales_cost_route_history_area")}
        FOREIGN KEY (${quoteIdentifier("id_area")}) REFERENCES ${quoteIdentifier("area")} (${quoteIdentifier("id_area")})
        ON DELETE CASCADE
      `
    )
  ) {
    changes.push("Menambahkan foreign key sales_cost_route_history -> area.");
  }

  if (
    await ensureForeignKey(
      connection,
      "sales_cost_route_history",
      "fk_sales_cost_route_history_step",
      `
        ALTER TABLE ${quoteIdentifier("sales_cost_route_history")}
        ADD CONSTRAINT ${quoteIdentifier("fk_sales_cost_route_history_step")}
        FOREIGN KEY (${quoteIdentifier("id_area_route_step")}) REFERENCES ${quoteIdentifier("area_route_step")} (${quoteIdentifier("id_area_route_step")})
        ON DELETE CASCADE
      `
    )
  ) {
    changes.push("Menambahkan foreign key sales_cost_route_history -> area_route_step.");
  }

  return changes;
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
    hasColumn(connection, "area", "finish_geofence_resource_id"),
    hasColumn(connection, "area", "finish_geofence_zone_id"),
    hasColumn(connection, "area", "finish_geofence_zone_name"),
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
      const changes = await upgradeLegacyTrackedSchema(connection);
      const upgradedSchemaReady = await matchesLatestTrackedSchema(connection);

      if (!upgradedSchemaReady) {
        throw new Error(
          "Database existing belum cocok dengan schema terbaru repo. Upgrade schema otomatis gagal, cek struktur tabel legacy terlebih dahulu."
        );
      }

      if (changes.length > 0) {
        console.log(changes.join("\n"));
      }
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
