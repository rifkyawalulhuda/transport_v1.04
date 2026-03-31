#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env")
});

const projectRoot = path.join(__dirname, "..");
const outputPath = path.join(projectRoot, "db", "schema.sql");

const getConnectionConfig = () => ({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number.parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "trucking"
});

const topoSortTables = (tables, dependencies) => {
  const dependantsByTable = new Map();
  const indegree = new Map();

  tables.forEach((tableName) => {
    dependantsByTable.set(tableName, new Set());
    indegree.set(tableName, 0);
  });

  dependencies.forEach(({ tableName, referencedTableName }) => {
    if (!dependantsByTable.has(referencedTableName) || !indegree.has(tableName)) {
      return;
    }
    if (!dependantsByTable.get(referencedTableName).has(tableName)) {
      dependantsByTable.get(referencedTableName).add(tableName);
      indegree.set(tableName, indegree.get(tableName) + 1);
    }
  });

  const ready = Array.from(indegree.entries())
    .filter(([, count]) => count === 0)
    .map(([tableName]) => tableName)
    .sort();

  const ordered = [];
  while (ready.length > 0) {
    const current = ready.shift();
    ordered.push(current);

    const dependants = Array.from(dependantsByTable.get(current) || []).sort();
    dependants.forEach((tableName) => {
      const nextCount = indegree.get(tableName) - 1;
      indegree.set(tableName, nextCount);
      if (nextCount === 0) {
        ready.push(tableName);
        ready.sort();
      }
    });
  }

  if (ordered.length === tables.length) {
    return ordered;
  }

  const unresolved = tables.filter((tableName) => !ordered.includes(tableName)).sort();
  return [...ordered, ...unresolved];
};

const main = async () => {
  const connection = await mysql.createConnection(getConnectionConfig());

  try {
    const database = process.env.DB_NAME || "trucking";
    const [tableRows] = await connection.query(
      `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = ?
          AND table_type = 'BASE TABLE'
        ORDER BY table_name ASC
      `,
      [database]
    );

    const tables = tableRows.map((row) => String(row.table_name));
    if (tables.length === 0) {
      throw new Error("Database tidak memiliki tabel untuk di-dump.");
    }

    const [dependencyRows] = await connection.query(
      `
        SELECT table_name, referenced_table_name
        FROM information_schema.key_column_usage
        WHERE table_schema = ?
          AND referenced_table_name IS NOT NULL
      `,
      [database]
    );

    const orderedTables = topoSortTables(
      tables,
      dependencyRows.map((row) => ({
        tableName: String(row.table_name),
        referencedTableName: String(row.referenced_table_name)
      }))
    );

    const statements = [
      `-- Schema dump for ${database}`,
      `-- Generated at ${new Date().toISOString()}`
    ];

    for (const tableName of orderedTables) {
      const [rows] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createSql = rows?.[0]?.["Create Table"];
      if (!createSql) {
        continue;
      }

      statements.push(`DROP TABLE IF EXISTS \`${tableName}\`;`);
      statements.push(`${createSql};`);
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${statements.join("\n\n")}\n`, "utf8");
    console.log(`Schema written to ${outputPath}`);
  } finally {
    await connection.end();
  }
};

main().catch((error) => {
  console.error("Gagal membuat schema dump:", error.message);
  process.exit(1);
});
