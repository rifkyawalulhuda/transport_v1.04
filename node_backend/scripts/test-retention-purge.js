/**
 * Unit + integration test untuk retentionService (retensi ADAS & Speed).
 * Run: node scripts/test-retention-purge.js
 *
 * Aman dijalankan: seluruh tes bersifat READ-ONLY kecuali satu tes yang
 * menulis sementara nilai retensi ADAS = 0 (nonaktif) lalu mengembalikannya,
 * untuk membuktikan modul nonaktif benar-benar tidak menghapus apa pun.
 */
// dotenv WAJIB dimuat sebelum require("../db") karena db.js membaca process.env.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const assert = require("assert");
const db = require("../db");
const retention = require("../services/retentionService");

const ADAS_KEY = retention.RETENTION_KEYS.adas;
const SPEED_KEY = retention.RETENTION_KEYS.speed;

// ── pure helpers ───────────────────────────────────────────────────────────

function testIsEnabledSemantics() {
  assert.strictEqual(retention.isEnabled(0), false, "0 harus nonaktif");
  assert.strictEqual(retention.isEnabled(-5), false, "negatif harus nonaktif");
  assert.strictEqual(retention.isEnabled(1), true);
  assert.strictEqual(retention.isEnabled(90), true);
  assert.strictEqual(retention.isEnabled("0"), false, "string '0' harus nonaktif");
  console.log("OK 0 = nonaktif (pengaman)");
}

function testParseModules() {
  assert.deepStrictEqual(retention.parseModules("adas,speed"), ["adas", "speed"]);
  assert.deepStrictEqual(retention.parseModules("adas"), ["adas"]);
  assert.deepStrictEqual(retention.parseModules("speed"), ["speed"]);
  assert.deepStrictEqual(retention.parseModules("ADAS"), ["adas"], "harus case-insensitive");
  assert.deepStrictEqual(retention.parseModules("speed,adas"), ["adas", "speed"], "urutan stabil");
  assert.deepStrictEqual(retention.parseModules("foo,bar"), [], "modul tak dikenal dibuang");
  assert.deepStrictEqual(retention.parseModules(undefined), ["adas", "speed"], "default keduanya");
  console.log("OK parseModules");
}

function testValidateRetentionSetting() {
  assert.strictEqual(retention.validateRetentionSetting(ADAS_KEY, 0).ok, true, "0 valid (nonaktif)");
  assert.strictEqual(retention.validateRetentionSetting(ADAS_KEY, 90).ok, true);
  assert.strictEqual(retention.validateRetentionSetting(ADAS_KEY, 3650).ok, true, "batas atas inklusif");
  assert.strictEqual(retention.validateRetentionSetting(ADAS_KEY, 3651).ok, false);
  assert.strictEqual(retention.validateRetentionSetting(ADAS_KEY, -1).ok, false);
  assert.strictEqual(retention.validateRetentionSetting(ADAS_KEY, "abc").ok, false);
  assert.strictEqual(retention.validateRetentionSetting(ADAS_KEY, 45.5).ok, false, "harus bilangan bulat");
  assert.strictEqual(retention.validateRetentionSetting("key.lain", 10).ok, false, "key tak dikenal ditolak");
  console.log("OK validasi setting ADAS (0-3650, integer)");
}

function testKeysBoundsDefaults() {
  assert.strictEqual(ADAS_KEY, "adas.retention_days");
  assert.strictEqual(SPEED_KEY, "speed.retention_days");
  assert.strictEqual(retention.RETENTION_DEFAULTS.adas, 90);
  assert.strictEqual(retention.RETENTION_BOUNDS[ADAS_KEY].min, 0, "min 0 agar nonaktif bisa disimpan");
  assert.strictEqual(retention.RETENTION_BOUNDS[ADAS_KEY].max, 3650);
  assert.strictEqual(retention.RETENTION_BOUNDS[ADAS_KEY].integer, true);
  console.log("OK keys, bounds, defaults");
}

// ── integration (butuh koneksi DB) ─────────────────────────────────────────

async function testSettingsShape() {
  const settings = await retention.getRetentionSettings();
  assert.strictEqual(typeof settings.adas.days, "number");
  assert.strictEqual(typeof settings.adas.enabled, "boolean");
  assert.strictEqual(typeof settings.speed.days, "number");
  assert.strictEqual(typeof settings.speed.enabled, "boolean");
  assert.ok(settings.speed.days >= 0);
  console.log(`OK getRetentionSettings (adas=${settings.adas.days}, speed=${settings.speed.days})`);
}

/** Pratinjau harus sama dengan hitungan SQL langsung (tidak ada perbedaan filter). */
async function testPreviewMatchesDirectSql() {
  const settings = await retention.getRetentionSettings();
  const preview = await retention.previewRetention(["adas", "speed"]);

  const [[adasSql]] = await db.query(
    "SELECT COUNT(*) AS total FROM bbs_observations WHERE source = 'adas' AND begin_time < (NOW() - INTERVAL ? DAY)",
    [settings.adas.days]
  );
  const expectedAdas = settings.adas.enabled ? Number(adasSql.total || 0) : 0;
  assert.strictEqual(preview.adas.would_delete, expectedAdas, "pratinjau ADAS harus sama dengan SQL");

  const [[telemetrySql]] = await db.query(
    "SELECT COUNT(*) AS total FROM bbs_speed_telemetry WHERE creation_time < (NOW() - INTERVAL ? DAY)",
    [settings.speed.days]
  );
  const [[eventsSql]] = await db.query(
    "SELECT COUNT(*) AS total FROM bbs_speed_events WHERE end_time < (NOW() - INTERVAL ? DAY)",
    [settings.speed.days]
  );
  const [[dailySql]] = await db.query(
    "SELECT COUNT(*) AS total FROM bbs_speed_daily WHERE day < (NOW() - INTERVAL ? DAY)",
    [settings.speed.days]
  );
  const expectedSpeed = settings.speed.enabled
    ? {
        telemetry: Number(telemetrySql.total || 0),
        events: Number(eventsSql.total || 0),
        daily: Number(dailySql.total || 0)
      }
    : { telemetry: 0, events: 0, daily: 0 };
  assert.deepStrictEqual(preview.speed.would_delete, expectedSpeed, "pratinjau Speed harus sama dengan SQL");
  console.log("OK pratinjau = hitungan SQL langsung");
}

/** Filter source='adas' wajib: observasi manual tidak boleh ikut terhitung. */
async function testAdasFilterScopedToAdasSource() {
  const [[all]] = await db.query("SELECT COUNT(*) AS total FROM bbs_observations");
  const [[adas]] = await db.query("SELECT COUNT(*) AS total FROM bbs_observations WHERE source = 'adas'");
  const [[manual]] = await db.query("SELECT COUNT(*) AS total FROM bbs_observations WHERE source = 'manual'");

  assert.ok(Number(all.total) >= Number(adas.total), "total harus >= jumlah ADAS");
  if (Number(manual.total) > 0) {
    assert.ok(
      Number(all.total) > Number(adas.total),
      "ada observasi manual -> filter source wajib dan harus terbukti memisahkan"
    );
  }

  const preview = await retention.previewRetention(["adas"]);
  assert.ok(
    preview.adas.would_delete <= Number(adas.total),
    "pratinjau ADAS tidak boleh melebihi jumlah baris ADAS"
  );
  console.log(
    `OK filter ADAS ter-scope (total=${all.total}, adas=${adas.total}, manual=${manual.total}, akan dihapus=${preview.adas.would_delete})`
  );
}

/**
 * Modul dengan retensi 0 (nonaktif) harus dilewati total.
 * Menulis sementara nilai 0 lalu MENGEMBALIKAN nilai asli di finally.
 */
async function testDisabledModuleDeletesNothing() {
  const [existing] = await db.query(
    "SELECT setting_value FROM bbs_settings WHERE setting_key = ?",
    [ADAS_KEY]
  );
  const hadRow = existing.length > 0;
  const original = hadRow ? existing[0].setting_value : null;

  try {
    await db.query(
      `INSERT INTO bbs_settings (setting_key, setting_value) VALUES (?, '0')
       ON DUPLICATE KEY UPDATE setting_value = '0'`,
      [ADAS_KEY]
    );

    const settings = await retention.getRetentionSettings();
    assert.strictEqual(settings.adas.enabled, false, "retensi 0 harus dianggap nonaktif");

    const preview = await retention.previewRetention(["adas"]);
    assert.strictEqual(preview.adas.would_delete, 0, "pratinjau harus 0 saat nonaktif");

    const [[beforeAdas]] = await db.query(
      "SELECT COUNT(*) AS total FROM bbs_observations WHERE source = 'adas'"
    );
    const [[beforeManual]] = await db.query(
      "SELECT COUNT(*) AS total FROM bbs_observations WHERE source = 'manual'"
    );

    const result = await retention.purgeRetention(["adas"], { adminId: null });
    assert.strictEqual(result.adas.deleted, 0, "tidak boleh ada baris terhapus saat nonaktif");
    assert.strictEqual(result.adas.skipped, "nonaktif");

    const [[afterAdas]] = await db.query(
      "SELECT COUNT(*) AS total FROM bbs_observations WHERE source = 'adas'"
    );
    const [[afterManual]] = await db.query(
      "SELECT COUNT(*) AS total FROM bbs_observations WHERE source = 'manual'"
    );
    assert.strictEqual(Number(afterAdas.total), Number(beforeAdas.total), "jumlah ADAS harus tetap");
    assert.strictEqual(Number(afterManual.total), Number(beforeManual.total), "observasi manual harus tetap");
    console.log("OK modul nonaktif (0 hari) tidak menghapus apa pun");
  } finally {
    if (hadRow) {
      await db.query("UPDATE bbs_settings SET setting_value = ? WHERE setting_key = ?", [original, ADAS_KEY]);
    } else {
      await db.query("DELETE FROM bbs_settings WHERE setting_key = ?", [ADAS_KEY]);
    }
  }
}

/** Pratinjau harus menyertakan konteks (total baris & umur tertua) agar UI bisa menjelaskan hasil 0. */
async function testPreviewIncludesAgeContext() {
  const preview = await retention.previewRetention(["adas", "speed"]);

  assert.strictEqual(typeof preview.adas.total_rows, "number", "ADAS total_rows harus ada");
  assert.strictEqual(typeof preview.adas.oldest_days, "number", "ADAS oldest_days harus ada");
  assert.strictEqual(typeof preview.speed.total_rows, "number", "Speed total_rows harus ada");
  assert.strictEqual(typeof preview.speed.oldest_days, "number", "Speed oldest_days harus ada");

  const [[adasSql]] = await db.query(
    "SELECT COUNT(*) AS total, IFNULL(DATEDIFF(NOW(), MIN(begin_time)), 0) AS oldest FROM bbs_observations WHERE source = 'adas'"
  );
  assert.strictEqual(preview.adas.total_rows, Number(adasSql.total), "total_rows ADAS harus sama dengan SQL");
  assert.strictEqual(preview.adas.oldest_days, Number(adasSql.oldest), "oldest_days ADAS harus sama dengan SQL");

  // Konsistensi logika: bila data tertua belum melewati retensi, tidak ada yang dihapus.
  if (preview.adas.oldest_days <= preview.adas.days) {
    assert.strictEqual(
      preview.adas.would_delete,
      0,
      "data tertua belum melewati retensi -> pratinjau harus 0"
    );
  }
  console.log(
    `OK konteks umur data (ADAS total=${preview.adas.total_rows}, tertua=${preview.adas.oldest_days} hari, retensi=${preview.adas.days} hari, akan dihapus=${preview.adas.would_delete})`
  );
}

/** Override `days` (nilai kandidat) harus dipakai untuk pratinjau tanpa menyimpan apa pun. */
async function testPreviewDaysOverride() {
  const [[before]] = await db.query(
    "SELECT setting_value FROM bbs_settings WHERE setting_key = ?",
    [SPEED_KEY]
  );
  const savedBefore = before?.setting_value;

  // Kandidat 7 hari: harus menghitung data > 7 hari, bukan memakai setting tersimpan.
  const candidate = await retention.previewRetention(["speed"], { days: 7 });
  assert.strictEqual(candidate.speed.days, 7, "days kandidat harus dipakai");

  const [[sql7]] = await db.query(
    "SELECT COUNT(*) AS total FROM bbs_speed_telemetry WHERE creation_time < (NOW() - INTERVAL 7 DAY)"
  );
  assert.strictEqual(
    candidate.speed.would_delete.telemetry,
    Number(sql7.total),
    "hitungan harus memakai 7 hari"
  );

  // Pratinjau TIDAK boleh mengubah setting tersimpan (read-only).
  const [[after]] = await db.query(
    "SELECT setting_value FROM bbs_settings WHERE setting_key = ?",
    [SPEED_KEY]
  );
  assert.strictEqual(after?.setting_value, savedBefore, "pratinjau tidak boleh menyimpan setting");

  // Tanpa override -> kembali ke setting tersimpan.
  const noOverride = await retention.previewRetention(["speed"]);
  assert.strictEqual(noOverride.speed.days, Number(savedBefore), "tanpa override pakai setting tersimpan");

  // Kandidat 0 -> nonaktif.
  const zero = await retention.previewRetention(["speed"], { days: 0 });
  assert.strictEqual(zero.speed.enabled, false, "kandidat 0 harus nonaktif");
  assert.deepStrictEqual(zero.speed.would_delete, { telemetry: 0, events: 0, daily: 0 });
  console.log(
    `OK override days (kandidat 7 hari -> ${candidate.speed.would_delete.telemetry} baris; setting tetap ${savedBefore})`
  );
}

/**
 * Bukti penghapusan benar-benar bekerja: sisipkan baris sintetis berumur tua,
 * jalankan purge, pastikan baris itu TERHAPUS dan data asli TIDAK tersentuh.
 * Seluruh baris sintetis dibersihkan di finally.
 */
async function testPurgeActuallyDeletes() {
  const DEVICE = "TEST-RETENTION-DEL";
  const OLD_DAYS = 400;
  const RETENTION = 365;

  const counts = async () => {
    const [[t]] = await db.query("SELECT COUNT(*) AS total FROM bbs_speed_telemetry");
    const [[e]] = await db.query("SELECT COUNT(*) AS total FROM bbs_speed_events");
    const [[d]] = await db.query("SELECT COUNT(*) AS total FROM bbs_speed_daily");
    return { t: Number(t.total), e: Number(e.total), d: Number(d.total) };
  };

  const cleanup = async () => {
    await db.query("DELETE FROM bbs_speed_telemetry WHERE device_id = ?", [DEVICE]);
    await db.query("DELETE FROM bbs_speed_events WHERE device_id = ?", [DEVICE]);
    await db.query("DELETE FROM bbs_speed_daily WHERE device_id = ?", [DEVICE]);
  };

  await cleanup();
  const before = await counts();

  try {
    // 3 baris sintetis berumur 400 hari (> retensi 365 hari).
    await db.query(
      `INSERT INTO bbs_speed_telemetry
         (device_id, plate_number, creation_time, speed_kmh, is_moving, moving_seconds)
       VALUES (?, 'TEST PLATE', NOW() - INTERVAL ? DAY, 55.00, 1, 30)`,
      [DEVICE, OLD_DAYS]
    );
    await db.query(
      `INSERT INTO bbs_speed_events
         (device_id, plate_number, begin_time, end_time, threshold_kmh, month_key)
       VALUES (?, 'TEST PLATE', NOW() - INTERVAL ? DAY, NOW() - INTERVAL ? DAY, 60.00, '2025-08')`,
      [DEVICE, OLD_DAYS, OLD_DAYS]
    );
    await db.query(
      `INSERT INTO bbs_speed_daily (device_id, plate_number, day)
       VALUES (?, 'TEST PLATE', CURDATE() - INTERVAL ? DAY)`,
      [DEVICE, OLD_DAYS]
    );

    const withSynthetic = await counts();
    assert.strictEqual(withSynthetic.t, before.t + 1, "baris telemetry sintetis harus tersisip");
    assert.strictEqual(withSynthetic.e, before.e + 1, "baris event sintetis harus tersisip");
    assert.strictEqual(withSynthetic.d, before.d + 1, "baris daily sintetis harus tersisip");

    const preview = await retention.previewRetention(["speed"], { days: RETENTION });
    assert.ok(
      preview.speed.would_delete.telemetry >= 1,
      "pratinjau harus menghitung baris sintetis berumur 400 hari"
    );

    const result = await retention.purgeRetention(["speed"], { days: RETENTION, adminId: null });
    assert.ok(result.speed.deleted.telemetry >= 1, "minimal 1 baris telemetry harus terhapus");
    assert.ok(result.speed.deleted.events >= 1, "minimal 1 event harus terhapus");
    assert.ok(result.speed.deleted.daily >= 1, "minimal 1 daily harus terhapus");

    const after = await counts();
    assert.strictEqual(after.t, before.t, "jumlah telemetry harus kembali ke semula");
    assert.strictEqual(after.e, before.e, "jumlah events harus kembali ke semula");
    assert.strictEqual(after.d, before.d, "jumlah daily harus kembali ke semula");

    console.log(
      `OK purge benar-benar menghapus (telemetry ${result.speed.deleted.telemetry}, events ${result.speed.deleted.events}, daily ${result.speed.deleted.daily}; data asli ${before.t} tetap)`
    );
  } finally {
    await cleanup();
  }
}

/** Hal yang sama untuk ADAS: baris sintetis source='adas' harus terhapus, manual tetap. */
async function testAdasPurgeActuallyDeletes() {
  const DEVICE = "TEST-RETENTION-ADAS";
  const OLD_DAYS = 400;

  const cleanup = async () => {
    await db.query("DELETE FROM bbs_observations WHERE device_id = ?", [DEVICE]);
  };

  await cleanup();

  const [[manualBefore]] = await db.query(
    "SELECT COUNT(*) AS total FROM bbs_observations WHERE source = 'manual'"
  );
  const [[adasBefore]] = await db.query(
    "SELECT COUNT(*) AS total FROM bbs_observations WHERE source = 'adas'"
  );

  try {
    const [admins] = await db.query("SELECT id_admin FROM admin ORDER BY id_admin LIMIT 1");
    const adminId = admins[0]?.id_admin ?? 0;
    await db.query(
      `INSERT INTO bbs_observations
         (id_admin, observer_name, driver_id, date, vehicle_type, scores, source, device_id, alarm_type, begin_time, plate_number)
       VALUES (?, 'Uji Retensi', 'ID:0', CURDATE(), 'Truk', '{}', 'adas', ?, 'TEST ALARM', NOW() - INTERVAL ? DAY, 'TEST PLATE')`,
      [adminId, DEVICE, OLD_DAYS]
    );

    const [[adasWithSynthetic]] = await db.query(
      "SELECT COUNT(*) AS total FROM bbs_observations WHERE source = 'adas'"
    );
    assert.strictEqual(Number(adasWithSynthetic.total), Number(adasBefore.total) + 1);

    const result = await retention.purgeRetention(["adas"], { days: 365, adminId: null });
    assert.strictEqual(result.adas.deleted, 1, "tepat 1 baris ADAS sintetis harus terhapus");

    const [[adasAfter]] = await db.query(
      "SELECT COUNT(*) AS total FROM bbs_observations WHERE source = 'adas'"
    );
    const [[manualAfter]] = await db.query(
      "SELECT COUNT(*) AS total FROM bbs_observations WHERE source = 'manual'"
    );
    assert.strictEqual(Number(adasAfter.total), Number(adasBefore.total), "ADAS kembali ke semula");
    assert.strictEqual(
      Number(manualAfter.total),
      Number(manualBefore.total),
      "observasi manual harus TIDAK tersentuh"
    );
    console.log("OK purge ADAS benar-benar menghapus & observasi manual aman");
  } finally {
    await cleanup();
  }
}

async function main() {
  testIsEnabledSemantics();
  testParseModules();
  testValidateRetentionSetting();
  testKeysBoundsDefaults();
  await testSettingsShape();
  await testPreviewMatchesDirectSql();
  await testAdasFilterScopedToAdasSource();
  await testDisabledModuleDeletesNothing();
  await testPreviewIncludesAgeContext();
  await testPreviewDaysOverride();
  await testPurgeActuallyDeletes();
  await testAdasPurgeActuallyDeletes();
  console.log("\nAll retention tests passed.");
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
