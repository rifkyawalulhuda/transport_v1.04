/**
 * Test: data hasil upload ADAS tidak muncul di Tab Riwayat / Export, dan tidak
 * bisa dibuka/diedit/dihapus lewat endpoint observasi (read-only).
 * Run: node scripts/test-history-exclusion.js
 *
 * Self-contained: router /api/bbs di-mount in-process (tidak butuh server pm2).
 * Test ini hanya MEMBACA data; untuk PUT/DELETE pada baris ADAS dipastikan
 * tetap 404 dan jumlah baris tidak berubah.
 */
// dotenv WAJIB dimuat sebelum require("../db") karena db.js membaca process.env.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const assert = require("assert");
const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");
const bbsRouter = require("../routes/bbs");

const token = jwt.sign(
  { id_admin: 2, level: "admin", nik_admin: "2", nama_admin: "Uji Riwayat" },
  process.env.JWT_SECRET,
  { expiresIn: "10m" }
);

let BASE = "";

const call = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const contentType = res.headers.get("content-type") || "";
  const buffer = Buffer.from(await res.arrayBuffer());
  let json = null;
  try {
    json = JSON.parse(buffer.toString("utf8"));
  } catch {
    json = buffer;
  }
  return { status: res.status, json, contentType };
};

const countObservations = async (where = "", params = []) => {
  const [[row]] = await db.query(`SELECT COUNT(*) AS total FROM bbs_observations ${where}`, params);
  return Number(row.total);
};

// ── tests ──────────────────────────────────────────────────────────────────

async function testHistoryAllExcludesAdas() {
  const { status, json } = await call("GET", "/api/bbs/history?type=all&limit=200");
  assert.strictEqual(status, 200, "history harus 200");

  const adasRows = await countObservations("WHERE source = 'adas'");
  const manualRows = await countObservations("WHERE source <> 'adas' OR source IS NULL");
  const [[chk]] = await db.query("SELECT COUNT(*) AS total FROM bbs_checklists");
  const [[inc]] = await db.query("SELECT COUNT(*) AS total FROM bbs_incidents");
  const expected = manualRows + Number(chk.total) + Number(inc.total);

  assert.strictEqual(
    json.rows.length,
    expected,
    `history harus ${expected} baris (manual+checklist+insiden), bukan termasuk ${adasRows} ADAS`
  );

  // Assertion kuat: tidak ada id milik baris ADAS yang muncul di daftar Riwayat.
  const [adasIdRows] = await db.query(
    "SELECT id_observation FROM bbs_observations WHERE source = 'adas'"
  );
  const adasIds = new Set(adasIdRows.map((r) => Number(r.id_observation)));
  const leaked = json.rows.filter((r) => r.type === "observation" && adasIds.has(Number(r.id)));
  assert.strictEqual(leaked.length, 0, "tidak boleh ada id ADAS di daftar Riwayat");

  console.log(
    `OK /history type=all -> ${json.rows.length} baris (${manualRows} manual + ${chk.total} checklist + ${inc.total} insiden); ${adasRows} ADAS dikecualikan`
  );
}

async function testHistoryObservationFilterExcludesAdas() {
  const { status, json } = await call("GET", "/api/bbs/history?type=observasi&limit=200");
  assert.strictEqual(status, 200);
  const manualRows = await countObservations("WHERE source <> 'adas' OR source IS NULL");
  assert.strictEqual(
    json.rows.length,
    manualRows,
    "filter observasi hanya menampilkan observasi manual"
  );
  console.log(`OK /history type=observasi -> ${json.rows.length} baris (ADAS dikecualikan)`);
}

async function testAdasRowNotReadable() {
  const [adasRows] = await db.query(
    "SELECT id_observation FROM bbs_observations WHERE source = 'adas' LIMIT 1"
  );
  if (!adasRows.length) {
    console.log("SKIP tidak ada baris ADAS untuk diuji");
    return;
  }
  const id = adasRows[0].id_observation;
  const { status } = await call("GET", `/api/bbs/observations/${id}`);
  assert.strictEqual(status, 404, `GET baris ADAS (#${id}) harus 404`);
  console.log(`OK GET /observations/${id} (ADAS) -> 404`);
}

async function testAdasRowNotUpdatableNorDeletable() {
  const [adasRows] = await db.query(
    "SELECT id_observation, driver_id, date, scores FROM bbs_observations WHERE source = 'adas' LIMIT 1"
  );
  if (!adasRows.length) {
    console.log("SKIP tidak ada baris ADAS untuk diuji");
    return;
  }
  const row = adasRows[0];
  const id = row.id_observation;

  const [[before]] = await db.query(
    "SELECT COUNT(*) AS total FROM bbs_observations WHERE source = 'adas'"
  );

  const put = await call("PUT", `/api/bbs/observations/${id}`, {
    driver_id: row.driver_id,
    date: row.date,
    scores: typeof row.scores === "string" ? JSON.parse(row.scores) : row.scores,
    location: "HARUSNYA TIDAK TERSIMPAN"
  });
  assert.strictEqual(put.status, 404, "PUT baris ADAS harus 404");

  const del = await call("DELETE", `/api/bbs/observations/${id}`);
  assert.strictEqual(del.status, 404, "DELETE baris ADAS harus 404");

  const [[after]] = await db.query(
    "SELECT COUNT(*) AS total FROM bbs_observations WHERE source = 'adas'"
  );
  assert.strictEqual(after.total, before.total, "jumlah ADAS tidak boleh berubah");

  const [[stillThere]] = await db.query(
    "SELECT COUNT(*) AS total FROM bbs_observations WHERE id_observation = ?",
    [id]
  );
  assert.strictEqual(Number(stillThere.total), 1, "baris ADAS harus masih ada");

  console.log(`OK PUT/DELETE /observations/${id} (ADAS) -> 404 & data utuh (${before.total} baris)`);
}

async function testManualObservationStillWorks() {
  const [manualRows] = await db.query(
    "SELECT id_observation FROM bbs_observations WHERE source <> 'adas' OR source IS NULL LIMIT 1"
  );
  if (!manualRows.length) {
    console.log("SKIP tidak ada observasi manual untuk diuji");
    return;
  }
  const id = manualRows[0].id_observation;
  const { status } = await call("GET", `/api/bbs/observations/${id}`);
  assert.strictEqual(status, 200, "observasi manual harus tetap bisa dibuka (200)");
  console.log(`OK GET /observations/${id} (manual) -> 200`);
}

async function testExportStillReturnsSpreadsheet() {
  const { status, contentType, json } = await call("GET", "/api/bbs/export?range=all");
  assert.strictEqual(status, 200, "export harus 200");
  const isSpreadsheet =
    contentType.includes("spreadsheet") || contentType.includes("octet-stream");
  assert.ok(isSpreadsheet, `export harus mengembalikan spreadsheet (dapat: ${contentType})`);
  assert.ok(Buffer.isBuffer(json) && json.length > 0, "export harus mengembalikan buffer berisi");
  console.log(`OK /export range=all -> 200 (${json.length} byte spreadsheet)`);
}

async function main() {
  const app = express();
  app.use(express.json());
  app.use("/api/bbs", bbsRouter);
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  BASE = `http://127.0.0.1:${server.address().port}`;

  try {
    await testHistoryAllExcludesAdas();
    await testHistoryObservationFilterExcludesAdas();
    await testAdasRowNotReadable();
    await testAdasRowNotUpdatableNorDeletable();
    await testManualObservationStillWorks();
    await testExportStillReturnsSpreadsheet();
    console.log("\nAll history exclusion tests passed.");
  } finally {
    server.close();
  }
}

main()
  .then(() => db.end())
  .catch(async (error) => {
    console.error("FAILED:", error.message);
    try {
      await db.end();
    } catch {
      // abaikan
    }
    process.exit(1);
  });