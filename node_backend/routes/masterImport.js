const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const db = require("../db");
const { resolveConfig } = require("../services/masterImportConfig");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }
});

const MAX_ERRORS = 200;

const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "number") {
    return value.toString();
  }
  return String(value).trim();
};

const normalizeNumeric = (value) =>
  normalizeValue(value).replace(/[\s\-()+]/g, "");

const normalizeHeader = (value) =>
  normalizeValue(value).toLowerCase().replace(/\s+/g, " ");

const isNumericValue = (value) => {
  if (!value) {
    return false;
  }
  const cleaned = normalizeNumeric(value);
  return cleaned !== "" && /^[0-9]+$/.test(cleaned);
};

const isRowEmpty = (row) =>
  row.every((cell) => normalizeValue(cell) === "");

const buildTemplateSheet = (config) => {
  const rows = [];
  rows[0] = [config.templateTitle];
  rows[1] = [];
  rows[2] = config.columns.map((col) => col.header);
  return xlsx.utils.aoa_to_sheet(rows);
};

const buildExportSheet = (config, dataRows) => {
  const rows = [];
  rows[0] = [config.templateTitle];
  rows[1] = [];
  rows[2] = config.columns.map((col) => col.header);
  dataRows.forEach((row) => {
    rows.push(
      config.columns.map((col) =>
        row[col.field] === null || row[col.field] === undefined
          ? ""
          : String(row[col.field])
      )
    );
  });
  return xlsx.utils.aoa_to_sheet(rows);
};

const chunkArray = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (!err) {
      return next();
    }

    const isSizeLimit = err.code === "LIMIT_FILE_SIZE";
    const message = isSizeLimit
      ? "Ukuran file maksimal 2 MB."
      : "Gagal mengunggah file.";
    return res.status(400).json({
      success: false,
      inserted: 0,
      updated: 0,
      failed: 1,
      errors: [{ row: null, field: "file", message }],
      message
    });
  });
};

router.get("/:type/template", (req, res) => {
  try {
    const config = resolveConfig(req.params.type);
    if (!config) {
      return res.status(404).json({ message: "Master type tidak tersedia." });
    }

    const workbook = xlsx.utils.book_new();
    const sheet = buildTemplateSheet(config);
    xlsx.utils.book_append_sheet(workbook, sheet, "Template");

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${config.templateFileName}`
    );
    res.send(buffer);
  } catch (error) {
    console.error("Template master error", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:type/export", async (req, res) => {
  try {
    const config = resolveConfig(req.params.type);
    if (!config) {
      return res.status(404).json({ message: "Master type tidak tersedia." });
    }

    const columns = config.columns.map((column) => column.field);
    const orderBy = config.orderBy || columns[0];
    const [rows] = await db.query(
      `SELECT ${columns.join(", ")} FROM ${config.table} ORDER BY ${orderBy} ASC`
    );

    const workbook = xlsx.utils.book_new();
    const sheet = buildExportSheet(config, rows);
    xlsx.utils.book_append_sheet(workbook, sheet, "Data");

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${config.exportFileName || "Export.xlsx"}`
    );
    res.send(buffer);
  } catch (error) {
    console.error("Export master error", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/:type/import", handleUpload, async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const config = resolveConfig(req.params.type);
  if (!config) {
    return res
      .status(404)
      .json({ success: false, message: "Master type tidak tersedia." });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      inserted: 0,
      updated: 0,
      failed: 1,
      errors: [{ row: null, field: "file", message: "File belum dipilih." }],
      message: "File belum dipilih."
    });
  }

  const fileName = req.file.originalname || "";
  if (!fileName.toLowerCase().endsWith(".xlsx")) {
    return res.status(400).json({
      success: false,
      inserted: 0,
      updated: 0,
      failed: 1,
      errors: [
        {
          row: null,
          field: "file",
          message: "Format file tidak valid. Gunakan template XLSX yang disediakan."
        }
      ],
      message: "Format file tidak valid. Gunakan template XLSX yang disediakan."
    });
  }

  let workbook;
  try {
    workbook = xlsx.read(req.file.buffer, { type: "buffer", raw: false });
  } catch (error) {
    return res.status(400).json({
      success: false,
      inserted: 0,
      updated: 0,
      failed: 1,
      errors: [
        {
          row: null,
          field: "file",
          message: "Format file tidak valid. Gunakan template XLSX yang disediakan."
        }
      ],
      message: "Format file tidak valid. Gunakan template XLSX yang disediakan."
    });
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return res.status(400).json({
      success: false,
      inserted: 0,
      updated: 0,
      failed: 1,
      errors: [
        {
          row: null,
          field: "file",
          message: "Sheet tidak ditemukan."
        }
      ],
      message: "Sheet tidak ditemukan."
    });
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: ""
  });

  const headerIndex = Math.max(config.headerRow - 1, 0);
  const headerRow = rows[headerIndex] || [];
  const expectedHeaders = config.columns.map((column) =>
    normalizeHeader(column.header)
  );
  const actualHeaders = headerRow.map((cell) => normalizeHeader(cell));
  const headerMismatch = expectedHeaders.some(
    (expected, index) => actualHeaders[index] !== expected
  );
  if (headerRow.length === 0 || headerMismatch) {
    const message = `Template tidak sesuai untuk master ${config.label}. Unduh template yang benar.`;
    return res.status(400).json({
      success: false,
      inserted: 0,
      updated: 0,
      failed: 1,
      errors: [{ row: config.headerRow, field: "template", message }],
      message
    });
  }

  const dataStartIndex = Math.max(config.dataStartRow - 1, 0);
  const errors = [];
  const preparedRows = [];
  const seenUnique = new Set();

  for (let index = dataStartIndex; index < rows.length; index += 1) {
    const rowValues = rows[index] || [];
    if (isRowEmpty(rowValues)) {
      continue;
    }
    const rowNumber = index + 1;
    const data = {};
    config.columns.forEach((column, colIndex) => {
      data[column.field] = normalizeValue(rowValues[colIndex]);
    });

    const rowErrors = [];
    config.columns.forEach((column) => {
      if (column.required && !data[column.field]) {
        rowErrors.push({
          row: rowNumber,
          field: column.field,
          message: `${column.header} wajib diisi.`
        });
      }
      if (column.type === "number" && data[column.field]) {
        if (!isNumericValue(data[column.field])) {
          rowErrors.push({
            row: rowNumber,
            field: column.field,
            message: `${column.header} harus berupa angka.`
          });
        }
      }
    });

    const uniqueValue = data[config.uniqueKey];
    if (!uniqueValue) {
      rowErrors.push({
        row: rowNumber,
        field: config.uniqueKey,
        message: `${config.uniqueKey} wajib diisi.`
      });
    } else if (seenUnique.has(uniqueValue)) {
      rowErrors.push({
        row: rowNumber,
        field: config.uniqueKey,
        message: `${config.uniqueKey} duplikat di file.`
      });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      continue;
    }

    seenUnique.add(uniqueValue);
    preparedRows.push({ rowNumber, data, uniqueValue });
  }

  if (errors.length > MAX_ERRORS) {
    errors.splice(MAX_ERRORS);
  }

  let inserted = 0;
  let updated = 0;
  let failed = errors.length;

  if (preparedRows.length === 0) {
    return res.json({
      success: failed === 0,
      inserted,
      updated,
      failed,
      errors,
      message: failed === 0 ? "Import berhasil." : "Import selesai dengan error."
    });
  }

  try {
    const uniqueValues = preparedRows.map((row) => row.uniqueValue);
    const existingMap = new Set();
    const chunks = chunkArray(uniqueValues, 500);
    for (const chunk of chunks) {
      const [existingRows] = await db.query(
        `SELECT ${config.uniqueKey} FROM ${config.table} WHERE ${config.uniqueKey} IN (?)`,
        [chunk]
      );
      existingRows.forEach((row) => {
        existingMap.add(row[config.uniqueKey]);
      });
    }

    const columns = config.columns.map((column) => column.field);
    const insertSql = `INSERT INTO ${config.table} (${columns.join(", ")}) VALUES (${columns
      .map(() => "?")
      .join(", ")})`;
    const updateSql = `UPDATE ${config.table} SET ${columns
      .map((column) => `${column} = ?`)
      .join(", ")} WHERE ${config.uniqueKey} = ?`;

    for (const row of preparedRows) {
      const values = columns.map((column) => row.data[column]);
      try {
        if (existingMap.has(row.uniqueValue)) {
          await db.query(updateSql, [...values, row.uniqueValue]);
          updated += 1;
        } else {
          await db.query(insertSql, values);
          inserted += 1;
        }
      } catch (error) {
        failed += 1;
        if (errors.length < MAX_ERRORS) {
          errors.push({
            row: row.rowNumber,
            field: config.uniqueKey,
            message: "Gagal menyimpan data."
          });
        }
      }
    }
  } catch (error) {
    console.error("Import master error", error);
    return res.status(500).json({
      success: false,
      inserted,
      updated,
      failed: failed + preparedRows.length,
      errors: [
        ...errors,
        { row: null, field: "server", message: "Internal server error." }
      ],
      message: "Internal server error."
    });
  }

  res.json({
    success: failed === 0,
    inserted,
    updated,
    failed,
    errors,
    message: failed === 0 ? "Import berhasil." : "Import selesai dengan error."
  });
});

module.exports = router;
