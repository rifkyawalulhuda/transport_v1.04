/**
 * Test: breakdown alarm per kendaraan (multi-select) + daftar plat + filter daftar.
 * Run: node scripts/test-alarm-breakdown.js
 *
 * Self-contained: router /api/bbs di-mount in-process (tidak butuh pm2).
 * Menyisipkan baris ADAS sintetis untuk kendaraan KEDUA lalu membersihkannya,
 * supaya skenario multi-kendaraan benar-benar teruji.
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const assert = require("assert");
const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");
const bbsRouter = require("../routes/bbs");
const alarmRouter = require("../routes/bbsAlarm");

const SYNTH_PLATE = "ZZ TEST 1";
const SYNTH_DEVICE = "TEST-DEV-ALARM";
const MAX_PLATES = 6;

const token = jwt.sign(
  { id_admin: 2, level: "admin", nik_admin: "2", nama_admin: "Uji Alarm" },
  process.env.JWT_SECRET,
  { expiresIn: "10m" }
);

let BASE = "";

const call = async (path) => {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return { status: res.status, json: await res.json() };
};

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const cleanupSynthetic = async () => {
  await db.query("DELETE FROM bbs_observations WHERE device_id = ?", [SYNTH_DEVICE]);
};

// ── tests ──────────────────────────────────────────────────────────────────

async function testAlarmPlates() {
  const { status, json } = await call("/api/bbs/alarm-plates");
  assert.strictEqual(status, 200);

  const [sqlRows] = await db.query(
    `SELECT plate_number, COUNT(*) AS total FROM bbs_observations
      WHERE source = 'adas' AND plate_number IS NOT NULL AND TRIM(plate_number) <> ''
      GROUP BY plate_number ORDER BY total DESC, plate_number ASC`
  );
  assert.strictEqual(json.plates.length, sqlRows.length, "jumlah plat harus sama dengan SQL");
  sqlRows.forEach((expected, index) => {
    assert.strictEqual(json.plates[index].plate_number, expected.plate_number);
    assert.strictEqual(json.plates[index].total, Number(expected.total), "total per plat harus sama");
  });
  assert.strictEqual(json.max_selectable, MAX_PLATES, "batas 6 kendaraan harus dilaporkan");
  console.log(`OK /alarm-plates -> ${json.plates.length} plat (maks ${json.max_selectable})`);
}

/** Tanpa filter plat: respons harus IDENTIK dengan perilaku lama (anti-regresi). */
async function testBreakdownWithoutPlatesMatchesSql() {
  const month = currentMonth();
  const { status, json } = await call(`/api/bbs/alarm-breakdown?month=${month}`);
  assert.strictEqual(status, 200);

  const [sqlRows] = await db.query(
    `SELECT alarm_type, COUNT(*) AS total FROM bbs_observations
      WHERE source = 'adas' AND DATE_FORMAT(begin_time, '%Y-%m') = ?
      GROUP BY alarm_type ORDER BY total DESC`,
    [month]
  );
  assert.strictEqual(json.labels.length, sqlRows.length, "jumlah tipe harus sama dengan SQL");
  sqlRows.forEach((expected, index) => {
    assert.strictEqual(json.labels[index], String(expected.alarm_type), "urutan tipe harus total DESC");
    assert.strictEqual(json.data[index], Number(expected.total), "angka per tipe harus sama");
  });
  assert.deepStrictEqual(json.plates_used, [], "tanpa filter -> plates_used kosong");
  assert.strictEqual(json.truncated, false);
  // Total per tipe harus konsisten dengan data agregat.
  assert.strictEqual(
    json.data.reduce((a, b) => a + b, 0),
    sqlRows.reduce((sum, r) => sum + Number(r.total), 0)
  );
  console.log(`OK /alarm-breakdown tanpa filter -> ${json.labels.length} tipe (identik SQL)`);
}

async function testBreakdownSinglePlate() {
  const { json: platesJson } = await call("/api/bbs/alarm-plates");
  if (!platesJson.plates.length) {
    console.log("SKIP tidak ada data ADAS");
    return;
  }
  const plate = platesJson.plates[0].plate_number;
  const month = currentMonth();
  const { status, json } = await call(
    `/api/bbs/alarm-breakdown?month=${month}&plates=${encodeURIComponent(plate)}`
  );
  assert.strictEqual(status, 200);
  assert.strictEqual(json.series.length, 1, "satu plat -> satu seri");
  assert.strictEqual(json.series[0].plate, plate);

  const [sqlRows] = await db.query(
    `SELECT alarm_type, COUNT(*) AS total FROM bbs_observations
      WHERE source = 'adas' AND plate_number = ? AND DATE_FORMAT(begin_time, '%Y-%m') = ?
      GROUP BY alarm_type`,
    [plate, month]
  );
  const sqlMap = new Map(sqlRows.map((r) => [String(r.alarm_type), Number(r.total)]));
  json.labels.forEach((type, index) => {
    assert.strictEqual(json.series[0].data[index], sqlMap.get(type) || 0, `angka ${type} harus sama`);
  });
  assert.strictEqual(
    json.series[0].total,
    sqlRows.reduce((sum, r) => sum + Number(r.total), 0),
    "total seri harus sama dengan SQL"
  );
  console.log(`OK /alarm-breakdown plates=${plate} -> 1 seri, ${json.labels.length} tipe`);
}

/** Multi-kendaraan: sisipkan kendaraan sintetis kedua, uji 2 seri, lalu batas 6. */
async function testMultiPlateAndLimit() {
  const month = currentMonth();
  const [adminRows] = await db.query("SELECT id_admin FROM admin ORDER BY id_admin LIMIT 1");
  const adminId = adminRows[0]?.id_admin ?? 0;

  const { json: before } = await call("/api/bbs/alarm-plates");
  if (!before.plates.length) {
    console.log("SKIP tidak ada data ADAS");
    return;
  }
  const realPlate = before.plates[0].plate_number;

  await cleanupSynthetic();
  // 2 alarm jenis berbeda milik kendaraan sintetis.
  const today = new Date();
  const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-15 10:00:00`;
  for (const type of ["Lane Departure Warning", "Yawning"]) {
    await db.query(
      `INSERT INTO bbs_observations
         (id_admin, observer_name, driver_id, date, vehicle_type, scores, source, device_id, alarm_type, begin_time, plate_number)
       VALUES (?, 'Uji Alarm', 'ID:0', CURDATE(), 'Truk', '{}', 'adas', ?, ?, ?, ?)`,
      [adminId, SYNTH_DEVICE, type, stamp, SYNTH_PLATE]
    );
  }

  try {
    const { json: platesAfter } = await call("/api/bbs/alarm-plates");
    const synthEntry = platesAfter.plates.find((p) => p.plate_number === SYNTH_PLATE);
    assert.ok(synthEntry, "plat sintetis harus muncul di daftar");
    assert.strictEqual(synthEntry.total, 2, "plat sintetis harus punya 2 alarm");
    const sorted = platesAfter.plates.map((p) => p.total);
    assert.deepStrictEqual(sorted, [...sorted].sort((a, b) => b - a), "daftar harus urut total DESC");

    // 2 kendaraan -> 2 seri dengan angka masing-masing.
    const two = await call(
      `/api/bbs/alarm-breakdown?month=${month}&plates=${encodeURIComponent(realPlate)},${encodeURIComponent(SYNTH_PLATE)}`
    );
    assert.strictEqual(two.json.series.length, 2, "dua plat -> dua seri");
    const synthSeries = two.json.series.find((s) => s.plate === SYNTH_PLATE);
    const realSeries = two.json.series.find((s) => s.plate === realPlate);
    assert.ok(synthSeries && realSeries, "kedua seri harus ada");
    assert.strictEqual(synthSeries.total, 2, "seri sintetis total 2");
    assert.ok(two.json.series[0].plate === realPlate, "urutan seri mengikuti plates_used");
    synthSeries.data.forEach((v, i) => {
      const type = two.json.labels[i];
      const expected = type === "Lane Departure Warning" || type === "Yawning" ? 1 : 0;
      assert.strictEqual(v, expected, `angka ${type} untuk plat sintetis`);
    });

    // Lebih dari 6 kendaraan -> truncated & hanya 6 seri.
    const manyPlates = [];
    for (let i = 1; i <= 7; i += 1) manyPlates.push(`ZZ MANY ${i}`);
    const limitRes = await call(
      `/api/bbs/alarm-breakdown?month=${month}&plates=${encodeURIComponent([realPlate, ...manyPlates].join(","))}`
    );
    assert.strictEqual(limitRes.json.truncated, true, "7 plat harus menandai truncated");
    assert.strictEqual(limitRes.json.series.length, 1, "hanya 6 plat dihitung; sisanya tak ada data");
    assert.strictEqual(limitRes.json.plates_used.length, MAX_PLATES, "plates_used dibatasi 6");

    // Plat tak dikenal -> hasil kosong, bukan error.
    const unknown = await call(`/api/bbs/alarm-breakdown?month=${month}&plates=ZZ%20TIDAK%20ADA`);
    assert.strictEqual(unknown.status, 200);
    assert.strictEqual(unknown.json.series.length, 0, "plat tak dikenal -> tanpa seri");
    assert.strictEqual(unknown.json.data.length, 0, "plat tak dikenal -> tanpa data");

    console.log(
      `OK multi-plat -> 2 seri (sintetis 2 alarm), limit 6 (truncated=${limitRes.json.truncated}), plat tak dikenal aman`
    );
  } finally {
    await cleanupSynthetic();
  }
}

/** Filter daftar alarm mengikuti plat terpilih (kontrol terpadu). */
async function testAlarmListFilteredByPlates() {
  const { json: platesJson } = await call("/api/bbs/alarm-plates");
  if (!platesJson.plates.length) {
    console.log("SKIP tidak ada data ADAS");
    return;
  }
  const plate = platesJson.plates[0].plate_number;
  const { status, json } = await call(`/api/bbs/alarms?plates=${encodeURIComponent(plate)}&limit=100`);
  assert.strictEqual(status, 200);
  assert.ok(json.rows.length > 0, "harus ada baris untuk plat terpilih");
  const wrong = json.rows.filter((r) => String(r.plate_number) !== String(plate));
  assert.strictEqual(wrong.length, 0, "semua baris harus milik plat terpilih");

  // Plat tak dikenal -> nol baris.
  const none = await call("/api/bbs/alarms?plates=ZZ%20TIDAK%20ADA");
  assert.strictEqual(none.json.rows.length, 0);
  assert.strictEqual(none.json.pagination.total, 0);
  console.log(`OK /alarms?plates=${plate} -> ${json.rows.length} baris (hanya plat tsb)`);
}

async function main() {
  const app = express();
  app.use(express.json());
  app.use("/api/bbs/alarms", alarmRouter);
  app.use("/api/bbs", bbsRouter);
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  BASE = `http://127.0.0.1:${server.address().port}`;

  try {
    await cleanupSynthetic();
    await testAlarmPlates();
    await testBreakdownWithoutPlatesMatchesSql();
    await testBreakdownSinglePlate();
    await testMultiPlateAndLimit();
    await testAlarmListFilteredByPlates();
    console.log("\nAll alarm breakdown tests passed.");
  } finally {
    await cleanupSynthetic();
    server.close();
  }
}

main()
  .then(() => db.end())
  .catch(async (error) => {
    console.error("FAILED:", error.message);
    try {
      await cleanupSynthetic();
      await db.end();
    } catch {
      // abaikan
    }
    process.exit(1);
  });