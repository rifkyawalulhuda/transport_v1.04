/**
 * Unit tests untuk selectStorageRows (downsampling telemetry Speed).
 * Run: node scripts/test-speed-storage-filter.js
 *
 * Fokus: memastikan pemangkasan baris TIDAK merusak moving_seconds harian
 * (penyebut rumus skor) dan tidak mengubah durasi overspeed.
 */
const assert = require('assert');
const speed = require('../services/speedService');

const INTERVAL_SECONDS = 180;
const INTERVAL_MS = INTERVAL_SECONDS * 1000;
const THRESHOLD = 60;
const BURST_GAP = 90;

const pad = (value) => String(value).padStart(2, '0');

/** Kembalikan string MySQL dari epoch ms memakai komponen UTC (seperti service). */
const mysqlFromEpochMs = (ms) => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
};

/** Titik awal bucket sampling untuk sebuah waktu (anchor epoch, sama dgn service). */
const bucketStartMs = (mysqlDateTime) =>
  Math.floor(speed.mysqlToEpochMs(mysqlDateTime) / INTERVAL_MS) * INTERVAL_MS;

// Anchor tetap agar koordinat test selalu naik secara global (jarak > 0).
const BASE_MS = bucketStartMs('2026-09-15 09:00:00');

/** Buat N baris berjarak 30 detik di dalam SATU bucket sampling. */
const makeBucketRows = (speeds, { deviceId = 'DEV-1', baseMs } = {}) =>
  speeds.map((speedKmh, index) => {
    const absMs = baseMs + index * speed.SLOT_SECONDS * 1000;
    const offset = (absMs - BASE_MS) / (speed.SLOT_SECONDS * 1000);
    return {
      deviceId,
      creationTime: mysqlFromEpochMs(absMs),
      speedKmh,
      isMoving: 1,
      plateNumber: 'B 9979 SYM',
      driverId: 'ID:1',
      fleet: 'Sankyu,PT',
      latitude: -6.85 + offset * 0.001,
      longitude: 109.13 + offset * 0.001
    };
  });

const keyOf = (row) => `${row.deviceId}|${row.creationTime}`;

const run = (rows, options = {}) =>
  speed.selectStorageRows(rows, {
    thresholdKmh: THRESHOLD,
    sampleIntervalSeconds: INTERVAL_SECONDS,
    ...options
  });

const sumMovingSeconds = (rows) =>
  rows.reduce((sum, row) => sum + (row.movingSeconds || 0), 0);

function testDefaults() {
  assert.strictEqual(speed.SLOT_SECONDS, 30);
  assert.strictEqual(speed.DEFAULT_SAMPLE_INTERVAL_SECONDS, 180);
  console.log('OK default constants');
}

function testEmptyInput() {
  const result = run([]);
  assert.deepStrictEqual(result.rows, []);
  assert.strictEqual(result.stats.keptOverspeed, 0);
  assert.strictEqual(result.stats.keptSampled, 0);
  assert.strictEqual(result.stats.droppedIdle, 0);
  assert.strictEqual(result.stats.droppedMoving, 0);
  console.log('OK empty input');
}

function testOverspeedAlwaysKeptFull() {
  const baseMs = bucketStartMs('2026-09-15 09:00:00');
  const rows = makeBucketRows([61, 63, 65, 67, 69, 70], { baseMs });
  const { rows: kept, stats } = run(rows);

  assert.strictEqual(kept.length, 6, 'semua baris overspeed harus disimpan');
  assert.strictEqual(stats.keptOverspeed, 6);
  assert.strictEqual(stats.keptSampled, 0);
  assert.strictEqual(stats.droppedMoving, 0);
  kept.forEach((row) => assert.strictEqual(row.movingSeconds, 30));
  assert.strictEqual(sumMovingSeconds(kept), rows.length * 30);
  console.log('OK overspeed kept at full resolution');
}

function testSingleSamplePerBucket() {
  const baseMs = bucketStartMs('2026-09-15 09:00:00');
  const rows = makeBucketRows([40, 41, 42, 43, 44, 45], { baseMs });
  const { rows: kept, stats } = run(rows);

  assert.strictEqual(kept.length, 1, 'hanya satu sampel per bucket');
  assert.strictEqual(stats.keptSampled, 1);
  assert.strictEqual(stats.droppedMoving, 5);
  // Sampel mewakili seluruh bucket: 6 slot x 30 detik.
  assert.strictEqual(kept[0].movingSeconds, 180);
  assert.strictEqual(kept[0].speedKmh, 40, 'sampel = baris pertama bucket');
  assert.strictEqual(sumMovingSeconds(kept), rows.length * 30);
  console.log('OK one sample per 3-minute bucket');
}

function testBucketWithOverspeedKeepsLowSample() {
  const baseMs = bucketStartMs('2026-09-15 09:00:00');
  const rows = makeBucketRows([40, 41, 42, 43, 44, 70], { baseMs });
  const { rows: kept, stats } = run(rows);

  assert.strictEqual(kept.length, 2, 'baris overspeed + sampel kecepatan rendah');
  assert.strictEqual(stats.keptOverspeed, 1);
  assert.strictEqual(stats.keptSampled, 1);
  assert.strictEqual(stats.droppedMoving, 4);

  const overRow = kept.find((row) => row.speedKmh === 70);
  const lowRow = kept.find((row) => row.speedKmh === 40);
  assert.strictEqual(overRow.movingSeconds, 30);
  assert.strictEqual(lowRow.movingSeconds, 150, 'sampel membawa 5 slot non-overspeed');
  assert.strictEqual(sumMovingSeconds(kept), rows.length * 30);
  console.log('OK overspeed bucket keeps unbiased low-speed sample');
}

function testOverspeedFirstRowFoldsMovingTime() {
  const baseMs = bucketStartMs('2026-09-15 09:00:00');
  const rows = makeBucketRows([70, 40, 41, 42, 43, 44], { baseMs });
  const { rows: kept, stats } = run(rows);

  assert.strictEqual(kept.length, 1, 'baris pertama sudah overspeed -> tanpa sampel tambahan');
  assert.strictEqual(stats.keptOverspeed, 1);
  assert.strictEqual(stats.keptSampled, 0);
  assert.strictEqual(kept[0].movingSeconds, 180, 'baris over menampung sisa waktu bergerak');
  assert.strictEqual(sumMovingSeconds(kept), rows.length * 30);
  console.log('OK first-row overspeed folds remaining moving time');
}

function testIdleRowsNeverStored() {
  const baseMs = bucketStartMs('2026-09-15 09:00:00');
  const moving = makeBucketRows([45], { baseMs });
  const idle = [1, 2, 3].map((index) => ({
    deviceId: 'DEV-1',
    creationTime: mysqlFromEpochMs(baseMs + (index + 1) * 30000),
    speedKmh: 0,
    isMoving: 0
  }));
  const { rows: kept, stats } = run([...moving, ...idle]);

  assert.strictEqual(kept.length, 1);
  assert.strictEqual(stats.droppedIdle, 3);
  console.log('OK idle rows dropped');
}

function testDeterministicRegardlessOfInputOrder() {
  const baseMs = bucketStartMs('2026-09-15 09:00:00');
  const rows = [
    ...makeBucketRows([40, 41, 42, 43, 44, 45], { baseMs }),
    ...makeBucketRows([50, 51, 52, 53, 54, 70], { baseMs: baseMs + INTERVAL_MS })
  ];
  const shuffled = [...rows].reverse();

  const a = run(rows).rows.map(keyOf).sort();
  const b = run(shuffled).rows.map(keyOf).sort();
  assert.deepStrictEqual(a, b, 'urutan input tidak boleh mengubah baris terpilih');
  console.log('OK deterministic regardless of input order');
}

function testOverlappingFilesSelectSameRows() {
  const baseMs = bucketStartMs('2026-09-15 09:00:00');
  const all = [];
  for (let bucket = 0; bucket < 6; bucket += 1) {
    all.push(...makeBucketRows([40, 41, 42, 43, 44, 45], { baseMs: baseMs + bucket * INTERVAL_MS }));
  }

  const fileA = all.slice(0, 20);
  const fileB = all.slice(16); // tumpang tindih 4 baris
  const unionMap = new Map();
  [...fileA, ...fileB].forEach((row) => unionMap.set(keyOf(row), row));

  const keptAll = run(all).rows.map(keyOf).sort();
  const keptUnion = run([...unionMap.values()]).rows.map(keyOf).sort();

  assert.deepStrictEqual(keptUnion, keptAll, 'file tumpang tindih harus memilih baris yang sama');
  assert.strictEqual(new Set(keptUnion).size, keptUnion.length, 'tidak boleh ada duplikat device+waktu');
  console.log('OK overlapping files select identical rows');
}

function testDailyMovingSecondsStaysExact() {
  const baseMs = bucketStartMs('2026-09-15 09:00:00');
  const full = [];
  for (let bucket = 0; bucket < 10; bucket += 1) {
    full.push(...makeBucketRows([40, 41, 42, 43, 44, 45], { baseMs: baseMs + bucket * INTERVAL_MS }));
  }

  const before = speed.buildDailyAggregates(full, THRESHOLD, BURST_GAP);
  const stored = run(full).rows;
  const after = speed.buildDailyAggregates(stored, THRESHOLD, BURST_GAP);

  assert.strictEqual(before[0].movingSeconds, full.length * 30);
  assert.strictEqual(after[0].movingSeconds, before[0].movingSeconds, 'moving_seconds harus identik');
  assert.strictEqual(after[0].distanceKm > 0, true);
  console.log('OK daily moving_seconds identical after downsampling');
}

function testOverspeedSecondsUnaffected() {
  const baseMs = bucketStartMs('2026-09-15 09:00:00');
  const full = [];
  for (let bucket = 0; bucket < 4; bucket += 1) {
    // Satu baris overspeed per bucket, sisanya di bawah threshold.
    full.push(...makeBucketRows([40, 41, 42, 43, 44, 70], { baseMs: baseMs + bucket * INTERVAL_MS }));
  }

  const before = speed.buildDailyAggregates(full, THRESHOLD, BURST_GAP);
  const stored = run(full).rows;
  const after = speed.buildDailyAggregates(stored, THRESHOLD, BURST_GAP);

  assert.strictEqual(before[0].overspeedSeconds, 4 * 30);
  assert.strictEqual(after[0].overspeedSeconds, before[0].overspeedSeconds);
  assert.strictEqual(after[0].eventCount, before[0].eventCount, 'jumlah event tidak boleh berubah');
  console.log('OK overspeed seconds & event count unaffected');
}

function testDefaultIntervalWhenSettingMissing() {
  const baseMs = bucketStartMs('2026-09-15 09:00:00');
  const rows = makeBucketRows([40, 41, 42, 43, 44, 45], { baseMs });
  const { rows: kept } = speed.selectStorageRows(rows, { thresholdKmh: THRESHOLD });
  assert.strictEqual(kept.length, 1, 'tanpa setting, pakai interval default 180 detik');
  assert.strictEqual(kept[0].movingSeconds, 180);
  console.log('OK default sample interval fallback');
}

function testIdempotentOnAlreadySampledData() {
  const baseMs = bucketStartMs('2026-09-15 09:00:00');
  const full = [];
  for (let bucket = 0; bucket < 5; bucket += 1) {
    // Bucket campuran: mayoritas di bawah threshold + satu baris overspeed.
    full.push(...makeBucketRows([40, 45, 50, 55, 58, 70], { baseMs: baseMs + bucket * INTERVAL_MS }));
  }

  const first = run(full).rows;
  const second = run(first).rows;

  // Total waktu bergerak tidak boleh menyusut pada pemrosesan berulang.
  assert.strictEqual(sumMovingSeconds(second), sumMovingSeconds(first), 'total moving_seconds harus tetap');
  assert.strictEqual(sumMovingSeconds(first), full.length * 30, 'total awal = jumlah baris x 30');

  const a = first.map(keyOf).sort();
  const b = second.map(keyOf).sort();
  assert.deepStrictEqual(b, a, 'pemrosesan ulang tidak boleh mengubah baris terpilih');

  const msFirst = new Map(first.map((row) => [keyOf(row), row.movingSeconds]));
  second.forEach((row) => {
    assert.strictEqual(row.movingSeconds, msFirst.get(keyOf(row)), `movingSeconds berubah: ${keyOf(row)}`);
  });
  console.log('OK idempotent on already-sampled data');
}

function testIdempotentWithOverspeedFirstRow() {
  const baseMs = bucketStartMs('2026-09-15 09:00:00');
  const full = makeBucketRows([70, 40, 41, 42, 43, 44], { baseMs });

  const first = run(full).rows;
  const second = run(first).rows;

  assert.strictEqual(sumMovingSeconds(first), 180);
  assert.strictEqual(sumMovingSeconds(second), 180, 'folding durasi harus tetap stabil');
  assert.strictEqual(second.length, 1);
  console.log('OK idempotent when first row is overspeed');
}

function main() {
  testDefaults();
  testEmptyInput();
  testOverspeedAlwaysKeptFull();
  testSingleSamplePerBucket();
  testBucketWithOverspeedKeepsLowSample();
  testOverspeedFirstRowFoldsMovingTime();
  testIdleRowsNeverStored();
  testDeterministicRegardlessOfInputOrder();
  testOverlappingFilesSelectSameRows();
  testDailyMovingSecondsStaysExact();
  testOverspeedSecondsUnaffected();
  testDefaultIntervalWhenSettingMissing();
  testIdempotentOnAlreadySampledData();
  testIdempotentWithOverspeedFirstRow();
  console.log('\nAll speed storage filter tests passed.');
}

main();
