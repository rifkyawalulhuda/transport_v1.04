/**
 * Test: filter per kendaraan pada chart Kecepatan (tren, per-kendaraan, daftar).
 * Run: node scripts/test-speed-vehicle-filter.js
 *
 * Self-contained: router /api/bbs/speed di-mount in-process (tidak butuh pm2).
 * Menyisipkan plat sintetis KEDUA di bbs_speed_events + bbs_speed_daily agar
 * skenario multi-kendaraan benar-benar teruji, lalu membersihkannya.
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const assert = require("assert");
const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");
const speedRouter = require("../routes/bbsSpeed");

const SYNTH_PLATE = "ZZ SPEED 1";
const MAX_PLATES = 6;

const token = jwt.sign(
  { id_admin: 2, level: "admin", nik_admin: "2", nama_admin: "Uji Speed Chart" },
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

const cleanup = async () => {
  await db.query("DELETE FROM bbs_speed_events WHERE plate_number = ?", [SYNTH_PLATE]);
  await db.query("DELETE FROM bbs_speed_daily WHERE plate_number = ?", [SYNTH_PLATE]);
};

// ── tests ──────────────────────────────────────────────────────────────────

async function testPlatesEndpoint() {
  const { status, json } = await call("/api/bbs/speed/plates");
  assert.strictEqual(status, 200);

  const [sqlRows] = await db.query(
    `SELECT plate_number, COUNT(*) AS total FROM bbs_speed_events
      WHERE plate_number IS NOT NULL AND TRIM(plate_number) <> ''
      GROUP BY plate_number ORDER BY total DESC, plate_number ASC`
  );
  assert.strictEqual(json.plates.length, sqlRows.length, "jumlah plat harus sama dengan SQL");
  sqlRows.forEach((expected, index) => {
    assert.strictEqual(json.plates[index].plate_number, expected.plate_number);
    assert.strictEqual(json.plates[index].total, Number(expected.total), "total per plat harus sama");
  });
  assert.strictEqual(json.max_selectable, MAX_PLATES);
  console.log(`OK /speed/plates -> ${json.plates.length} plat (maks ${json.max_selectable})`);
}

/** Tanpa filter: respons tren harus IDENTIK dengan perilaku lama (anti-regresi). */
async function testTrendWithoutPlatesMatchesSql() {
  const month = currentMonth();
  const { status, json } = await call(`/api/bbs/speed/daily-trend?month=${month}`);
  assert.strictEqual(status, 200);
  assert.strictEqual(json.labels.length, 30, "September harus 30 hari");

  const [sqlRows] = await db.query(
    `SELECT DATE_FORMAT(begin_time, '%Y-%m-%d') AS day, COUNT(*) AS total
       FROM bbs_speed_events WHERE month_key = ? GROUP BY day`,
    [month]
  );
  const sqlMap = new Map(sqlRows.map((r) => [String(r.day), Number(r.total)]));
  const sumFromApi = json.data.reduce((a, b) => a + b, 0);
  const sumFromSql = sqlRows.reduce((sum, r) => sum + Number(r.total), 0);
  assert.strictEqual(sumFromApi, sumFromSql, "total event harus sama dengan SQL");
  sqlMap.forEach((total, day) => {
    const index = json.labels.indexOf(day);
    assert.ok(index >= 0, `label ${day} harus ada`);
    assert.strictEqual(json.data[index], total, `angka hari ${day} harus sama`);
  });
  assert.deepStrictEqual(json.plates_used, [], "tanpa filter -> plates_used kosong");
  assert.strictEqual(json.truncated, false);
  console.log(`OK /speed/daily-trend tanpa filter -> ${json.labels.length} hari, total ${sumFromApi} (identik SQL)`);
}

async function testByVehicleMatchesSql() {
  const month = currentMonth();
  const { status, json } = await call(`/api/bbs/speed/by-vehicle?month=${month}`);
  assert.strictEqual(status, 200);

  const [sqlRows] = await db.query(
    `SELECT plate_number, SUM(event_count) AS total FROM bbs_speed_daily
      WHERE DATE_FORMAT(day, '%Y-%m') = ? GROUP BY plate_number HAVING SUM(event_count) > 0
      ORDER BY total DESC`,
    [month]
  );
  assert.strictEqual(json.rows.length, sqlRows.length, "jumlah kendaraan harus sama dengan SQL");
  sqlRows.forEach((expected, index) => {
    assert.strictEqual(json.rows[index].plate_number, expected.plate_number);
    assert.strictEqual(json.rows[index].total, Number(expected.total), "total per truk harus sama");
  });
  const sorted = json.rows.map((r) => r.total);
  assert.deepStrictEqual(sorted, [...sorted].sort((a, b) => b - a), "harus urut terbanyak dulu");
  console.log(`OK /speed/by-vehicle -> ${json.rows.length} kendaraan (cocok SUM(event_count))`);
}

/** Multi-kendaraan: sisipkan plat sintetis, uji seri tren + by-vehicle + batas. */
async function testMultiVehicleWithSynthetic() {
  const month = currentMonth();
  await cleanup();

  // 3 event pada 3 hari berbeda + 2 hari agregat untuk plat sintetis.
  for (const day of ["03", "07", "12"]) {
    await db.query(
      `INSERT INTO bbs_speed_events
         (device_id, plate_number, driver_id, fleet, begin_time, end_time, duration_seconds,
          max_speed_kmh, avg_speed_kmh, sample_count, distance_km, threshold_kmh, month_key)
       VALUES ('TEST-SPEED-DEV', ?, 'ID:0', 'TEST', ?, ?, 30, 72.00, 68.00, 1, 1.20, 60.00, ?)`,
      [SYNTH_PLATE, `${month}-${day} 09:00:00`, `${month}-${day} 09:00:30`, month]
    );
  }
  for (const day of ["03", "07"]) {
    await db.query(
      `INSERT INTO bbs_speed_daily
         (device_id, plate_number, driver_id, fleet, day, moving_seconds, overspeed_seconds,
          distance_km, max_speed_kmh, avg_moving_speed_kmh, event_count)
       VALUES ('TEST-SPEED-DEV', ?, 'ID:0', 'TEST', ?, 1800, 60, 12.5, 72.00, 45.00, 2)`,
      [SYNTH_PLATE, `${month}-${day}`]
    );
  }

  try {
    // Daftar plat menyertakan kendaraan sintetis.
    const { json: platesJson } = await call("/api/bbs/speed/plates");
    const synth = platesJson.plates.find((p) => p.plate_number === SYNTH_PLATE);
    assert.ok(synth, "plat sintetis harus muncul");
    assert.strictEqual(synth.total, 3, "plat sintetis harus punya 3 event");

    const { json: real } = await call("/api/bbs/speed/plates");
    const realPlate = real.plates.find((p) => p.plate_number !== SYNTH_PLATE)?.plate_number;
    assert.ok(realPlate, "harus ada plat nyata untuk dibandingkan");

    // Tren 2 kendaraan -> 2 seri, angka per kendaraan benar.
    const two = await call(
      `/api/bbs/speed/daily-trend?month=${month}&plates=${encodeURIComponent(realPlate)},${encodeURIComponent(SYNTH_PLATE)}`
    );
    assert.strictEqual(two.json.series.length, 2, "dua plat -> dua seri");
    const synthSeries = two.json.series.find((s) => s.plate === SYNTH_PLATE);
    assert.strictEqual(synthSeries.total, 3, "seri sintetis total 3");
    for (const day of ["03", "07", "12"]) {
      const index = two.json.labels.indexOf(`${month}-${day}`);
      assert.strictEqual(synthSeries.data[index], 1, `hari ${day} harus 1 event`);
    }

    // by-vehicle: total sintetis = 2+2 = 4, urut terbanyak.
    const byVehicle = await call(
      `/api/bbs/speed/by-vehicle?month=${month}&plates=${encodeURIComponent(SYNTH_PLATE)}`
    );
    assert.strictEqual(byVehicle.json.rows.length, 1, "satu plat -> satu baris");
    assert.strictEqual(byVehicle.json.rows[0].total, 4, "total = SUM(event_count) = 4");
    assert.strictEqual(byVehicle.json.rows[0].days, 2, "2 hari agregat");

    // Batas 6 kendaraan.
    const seven = [realPlate, SYNTH_PLATE, "ZZ A", "ZZ B", "ZZ C", "ZZ D", "ZZ E"];
    const limited = await call(
      `/api/bbs/speed/by-vehicle?month=${month}&plates=${encodeURIComponent(seven.join(","))}`
    );
    assert.strictEqual(limited.json.truncated, true, "7 plat -> truncated");
    assert.ok(limited.json.rows.length <= MAX_PLATES, "maksimum 6 kendaraan");

    // Plat tak dikenal -> kosong, bukan error.
    const unknown = await call(
      `/api/bbs/speed/daily-trend?month=${month}&plates=${encodeURIComponent("ZZ TIDAK ADA")}`
    );
    assert.strictEqual(unknown.status, 200);
    assert.strictEqual(unknown.json.series.length, 0, "plat tak dikenal -> tanpa seri");
    assert.strictEqual(unknown.json.data.reduce((a, b) => a + b, 0), 0);

    console.log(
      `OK multi-kendaraan: seri tren 2 plat (sintetis 3 event), by-vehicle sintetis total 4, limit 6 (truncated), plat tak dikenal aman`
    );
  } finally {
    await cleanup();
  }
}

/** Daftar pelanggaran mengikuti plat terpilih (kontrol terpadu). */
async function testEventsFilteredByPlates() {
  const { json: platesJson } = await call("/api/bbs/speed/plates");
  if (!platesJson.plates.length) {
    console.log("SKIP tidak ada data");
    return;
  }
  const plate = platesJson.plates[0].plate_number;
  const { status, json } = await call(
    `/api/bbs/speed/events?plates=${encodeURIComponent(plate)}&limit=100`
  );
  assert.strictEqual(status, 200);
  assert.ok(json.rows.length > 0, "harus ada baris");
  const wrong = json.rows.filter((r) => String(r.plate_number) !== String(plate));
  assert.strictEqual(wrong.length, 0, "semua baris harus milik plat terpilih");

  const none = await call("/api/bbs/speed/events?plates=ZZ%20TIDAK%20ADA");
  assert.strictEqual(none.json.rows.length, 0);
  assert.strictEqual(none.json.pagination.total, 0);
  console.log(`OK /speed/events?plates=${plate} -> ${json.rows.length} baris (hanya plat tsb)`);
}

async function main() {
  const app = express();
  app.use(express.json());
  app.use("/api/bbs/speed", speedRouter);
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  BASE = `http://127.0.0.1:${server.address().port}`;

  try {
    await cleanup();
    await testPlatesEndpoint();
    await testTrendWithoutPlatesMatchesSql();
    await testByVehicleMatchesSql();
    await testMultiVehicleWithSynthetic();
    await testEventsFilteredByPlates();
    console.log("\nAll speed vehicle filter tests passed.");
  } finally {
    await cleanup();
    server.close();
  }
}

main()
  .then(() => db.end())
  .catch(async (error) => {
    console.error("FAILED:", error.message);
    try {
      await cleanup();
      await db.end();
    } catch {
      // abaikan
    }
    process.exit(1);
  });