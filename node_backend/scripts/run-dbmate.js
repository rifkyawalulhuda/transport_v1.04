#!/usr/bin/env node

const path = require("path");
const { spawnSync } = require("child_process");
const mysql = require("mysql2/promise");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env")
});

const projectRoot = path.join(__dirname, "..");
const migrationsDir = path.join(projectRoot, "db", "migrations");
const dbmateBinary =
  process.platform === "win32"
    ? path.join(projectRoot, "node_modules", ".bin", "dbmate.cmd")
    : path.join(projectRoot, "node_modules", ".bin", "dbmate");

const encodeSegment = (value) => encodeURIComponent(String(value || ""));

const resolveDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST || "127.0.0.1";
  const port = process.env.DB_PORT || "3306";
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASS || "";
  const database = process.env.DB_NAME || "trucking";

  return `mysql://${encodeSegment(user)}:${encodeSegment(password)}@${host}:${port}/${encodeSegment(database)}`;
};

const ensureDatabaseExists = async () => {
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = Number.parseInt(process.env.DB_PORT || "3306", 10);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASS || "";
  const database = process.env.DB_NAME || "trucking";

  const connection = await mysql.createConnection({
    host,
    port: Number.isFinite(port) ? port : 3306,
    user,
    password,
    multipleStatements: false
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${String(database).replace(/`/g, "``")}\``
    );
  } finally {
    await connection.end();
  }
};

const shouldEnsureDatabase = (command) =>
  ["up", "migrate", "rollback", "dump", "schema"].includes(command);

const main = async () => {
  const args = process.argv.slice(2);
  const dbmateCommand = args[0] || "up";

  if (shouldEnsureDatabase(dbmateCommand)) {
    await ensureDatabaseExists();
  }

  const env = {
    ...process.env,
    DATABASE_URL: resolveDatabaseUrl(),
    DBMATE_MIGRATIONS_DIR: migrationsDir,
    DBMATE_NO_DUMP_SCHEMA:
      process.env.DBMATE_NO_DUMP_SCHEMA ||
      (dbmateCommand === "dump" ? "false" : "true")
  };

  const processCommand = process.platform === "win32" ? "cmd.exe" : dbmateBinary;
  const processArgs =
    process.platform === "win32"
      ? ["/d", "/s", "/c", dbmateBinary, ...args]
      : args;

  const result = spawnSync(processCommand, processArgs, {
    cwd: projectRoot,
    env,
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    console.error("Gagal menjalankan dbmate:", result.error.message);
    process.exit(1);
  }

  process.exit(result.status === null ? 1 : result.status);
};

main().catch((error) => {
  console.error("Gagal menyiapkan koneksi dbmate:", error.message);
  process.exit(1);
});
