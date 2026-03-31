#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const sourceDumpPath = path.join(projectRoot, "..", "trucking.sql");
const migrationsDir = path.join(projectRoot, "db", "migrations");
const baselineFileName = "20260401010000_baseline_from_trucking_dump.sql";
const baselinePath = path.join(migrationsDir, baselineFileName);
const includeData = process.argv.includes("--with-data");

const ALLOWED_PREFIXES = [
  "SET SQL_MODE",
  "SET time_zone",
  "/*!40101 SET NAMES",
  "CREATE TABLE",
  "ALTER TABLE"
];

const stripCommentOnlyLines = (statement) =>
  statement
    .split(/\r?\n/g)
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return false;
      }
      return !trimmed.startsWith("--");
    })
    .join("\n")
    .trim();

const keepStatement = (statement) => {
  const normalized = stripCommentOnlyLines(statement);
  if (!normalized) {
    return false;
  }

  if (includeData && normalized.startsWith("INSERT INTO")) {
    return true;
  }

  return ALLOWED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
};

const extractCreateTableNames = (sqlText) => {
  const tableNames = [];
  const regex = /CREATE TABLE `([^`]+)`/g;
  let match = regex.exec(sqlText);
  while (match) {
    tableNames.push(match[1]);
    match = regex.exec(sqlText);
  }
  return tableNames;
};

const main = () => {
  const dumpSql = fs.readFileSync(sourceDumpPath, "utf8");
  const statements = dumpSql
    .split(/;\r?\n/g)
    .map(stripCommentOnlyLines)
    .filter(keepStatement)
    .map((statement) => `${statement};`);

  const tables = extractCreateTableNames(dumpSql).reverse();
  const downStatements = [
    "SET FOREIGN_KEY_CHECKS = 0;",
    ...tables.map((tableName) => `DROP TABLE IF EXISTS \`${tableName}\`;`),
    "SET FOREIGN_KEY_CHECKS = 1;"
  ];

  const contents = [
    "-- migrate:up",
    ...statements,
    "",
    "-- migrate:down",
    ...downStatements,
    ""
  ].join("\n");

  fs.mkdirSync(migrationsDir, { recursive: true });
  fs.writeFileSync(baselinePath, contents, "utf8");
  console.log(
    `Baseline migration generated at ${baselinePath}${includeData ? " (with data)" : " (schema only)"}`
  );
};

main();
