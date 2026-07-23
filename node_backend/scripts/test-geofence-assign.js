/**
 * Unit tests for sequential geofence assignment (no Wialon / DB).
 * Run: node scripts/test-geofence-assign.js
 *
 * Default product mode = Opsi B (loose): requirePreviousStopHit false,
 * per-zone consume only (actual GPS times, not ETA).
 */
const assert = require('assert');

const {
  buildZoneEntryTimeline,
  seedConsumptionFromHistory,
  assignStopHits,
  resolveFinishGpsHit
} = require('../services/geofenceTrackingService');

const KIIC = '1:10';
const GIIC = '1:20';
const ZONE3 = '1:30';

const makeStops = () => [
  { id: 1, stop_order: 1, wialon_resource_id: 1, wialon_zone_id: 10, stop_name: 'KIIC-1', is_departure: 0, is_finish: 0 },
  { id: 2, stop_order: 2, wialon_resource_id: 1, wialon_zone_id: 20, stop_name: 'GIIC-1', is_departure: 0, is_finish: 0 },
  { id: 3, stop_order: 3, wialon_resource_id: 1, wialon_zone_id: 10, stop_name: 'KIIC-2', is_departure: 0, is_finish: 0 },
  { id: 4, stop_order: 4, wialon_resource_id: 1, wialon_zone_id: 20, stop_name: 'GIIC-2', is_departure: 0, is_finish: 0 }
];

const t1 = 1000;
const t2 = 2000;
const t3 = 3000;
const t4 = 4000;

const fullTimeline = [
  { zoneKey: KIIC, entryTs: t1 },
  { zoneKey: GIIC, entryTs: t2 },
  { zoneKey: KIIC, entryTs: t3 },
  { zoneKey: GIIC, entryTs: t4 }
];

function testFullSequence() {
  const hits = assignStopHits({
    stops: makeStops(),
    zoneTimeline: fullTimeline,
    existingHistory: [],
    requirePreviousStopHit: false
  });
  assert.strictEqual(hits.length, 4);
  assert.deepStrictEqual(
    hits.map((h) => h.entryTs),
    [t1, t2, t3, t4]
  );
  assert.strictEqual(hits[2].entryTs, t3); // NOT t1
  console.log('OK full KIIC→GIIC→KIIC→GIIC sequence (GPS times)');
}

function testSeedPartialHistory() {
  const existing = [
    {
      id_sc_stop: 1,
      step_key: 'stop:1',
      wialon_resource_id: 1,
      wialon_zone_id: 10,
      gps_ts: t1
    },
    {
      id_sc_stop: 2,
      step_key: 'stop:2',
      wialon_resource_id: 1,
      wialon_zone_id: 20,
      gps_ts: t2
    }
  ];
  const hits = assignStopHits({
    stops: makeStops(),
    zoneTimeline: fullTimeline,
    existingHistory: existing,
    requirePreviousStopHit: false
  });
  assert.strictEqual(hits.length, 2);
  assert.strictEqual(hits[0].stop.id, 3);
  assert.strictEqual(hits[0].entryTs, t3);
  assert.strictEqual(hits[1].stop.id, 4);
  assert.strictEqual(hits[1].entryTs, t4);
  console.log('OK seed from history — 2nd KIIC uses t3 not t1');
}

function testOnlyOneKiicEntry() {
  const timeline = [
    { zoneKey: KIIC, entryTs: t1 },
    { zoneKey: GIIC, entryTs: t2 }
  ];
  const hits = assignStopHits({
    stops: makeStops(),
    zoneTimeline: timeline,
    existingHistory: [],
    requirePreviousStopHit: false
  });
  assert.strictEqual(hits.length, 2);
  assert.strictEqual(hits[0].entryTs, t1);
  assert.strictEqual(hits[1].entryTs, t2);
  console.log('OK only one KIIC entry → stop3 unhit');
}

function testOutOfOrderFieldVisit() {
  // Physical order: zone2 @ t1, zone1 @ t2, zone3 @ t3
  // Stops: 1=zone1, 2=zone2, 3=zone3
  const stops = [
    { id: 1, stop_order: 1, wialon_resource_id: 1, wialon_zone_id: 10, stop_name: 'S1', is_departure: 0, is_finish: 0 },
    { id: 2, stop_order: 2, wialon_resource_id: 1, wialon_zone_id: 20, stop_name: 'S2', is_departure: 0, is_finish: 0 },
    { id: 3, stop_order: 3, wialon_resource_id: 1, wialon_zone_id: 30, stop_name: 'S3', is_departure: 0, is_finish: 0 }
  ];
  const timeline = [
    { zoneKey: GIIC, entryTs: t1 },
    { zoneKey: KIIC, entryTs: t2 },
    { zoneKey: ZONE3, entryTs: t3 }
  ];
  const hits = assignStopHits({
    stops,
    zoneTimeline: timeline,
    existingHistory: [],
    requirePreviousStopHit: false
  });
  assert.strictEqual(hits.length, 3);
  const byId = Object.fromEntries(hits.map((h) => [h.stop.id, h.entryTs]));
  assert.strictEqual(byId[1], t2); // actual GPS when entered zone1
  assert.strictEqual(byId[2], t1); // actual GPS when entered zone2 (before stop1 clock)
  assert.strictEqual(byId[3], t3);
  console.log('OK out-of-order field visit records actual GPS times');
}

function testLooseSkipsMissingMiddle() {
  // stop2 has no entry; stop3 does — loose mode still assigns stop3
  const stops = [
    { id: 1, stop_order: 1, wialon_resource_id: 1, wialon_zone_id: 10, stop_name: 'S1', is_departure: 0, is_finish: 0 },
    { id: 2, stop_order: 2, wialon_resource_id: 1, wialon_zone_id: 20, stop_name: 'S2', is_departure: 0, is_finish: 0 },
    { id: 3, stop_order: 3, wialon_resource_id: 1, wialon_zone_id: 30, stop_name: 'S3', is_departure: 0, is_finish: 0 }
  ];
  const timeline = [
    { zoneKey: KIIC, entryTs: t1 },
    { zoneKey: ZONE3, entryTs: t3 }
  ];
  const hits = assignStopHits({
    stops,
    zoneTimeline: timeline,
    existingHistory: [],
    requirePreviousStopHit: false
  });
  assert.strictEqual(hits.length, 2);
  assert.strictEqual(hits[0].stop.id, 1);
  assert.strictEqual(hits[1].stop.id, 3);
  console.log('OK loose mode assigns stop3 without stop2');
}

function testStrictGateStillWorks() {
  const existing = [
    { id_sc_stop: 1, step_key: 'stop:1', wialon_resource_id: 1, wialon_zone_id: 10, gps_ts: t1 }
  ];
  const timeline = [
    { zoneKey: KIIC, entryTs: t1 },
    { zoneKey: KIIC, entryTs: t3 }
  ];
  const hits = assignStopHits({
    stops: makeStops(),
    zoneTimeline: timeline,
    existingHistory: existing,
    requirePreviousStopHit: true
  });
  assert.strictEqual(hits.length, 0, 'strict: stop2 missing blocks later');
  console.log('OK strict mode still blocks when requirePreviousStopHit=true');
}

function testBuildTimelineReentry() {
  const polyA = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ];
  const polyB = [
    { x: 2, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 1 },
    { x: 2, y: 1 }
  ];
  const map = new Map([
    [KIIC, { points: polyA, resourceId: '1', zoneId: '10' }],
    [GIIC, { points: polyB, resourceId: '1', zoneId: '20' }]
  ]);
  const messages = [
    { t: 100, lat: 0.5, lon: 0.5 },
    { t: 200, lat: 0.5, lon: 0.5 },
    { t: 300, lat: 0.5, lon: 2.5 },
    { t: 400, lat: 0.5, lon: 0.5 },
    { t: 500, lat: 0.5, lon: 2.5 }
  ];
  const tl = buildZoneEntryTimeline(messages, map);
  assert.strictEqual(tl.length, 4);
  assert.deepStrictEqual(
    tl.map((e) => [e.zoneKey, e.entryTs]),
    [
      [KIIC, 100],
      [GIIC, 300],
      [KIIC, 400],
      [GIIC, 500]
    ]
  );
  console.log('OK buildZoneEntryTimeline re-entry');
}

function testSeedFromStopLookup() {
  const stops = makeStops();
  const seed = seedConsumptionFromHistory(
    [{ id_sc_stop: 1, step_key: 'stop:1', gps_ts: t1 }],
    stops
  );
  assert.strictEqual(seed.consumedByZone.get(KIIC), t1);
  assert.strictEqual(seed.lastGlobalTs, t1);
  assert.ok(seed.hitStopIds.has(1));
  console.log('OK seed resolves zone from stop id');
}

const SANKYU = '1:1';

function testLooseFinishWithoutMiddleStops() {
  const stops = [
    { id: 10, stop_order: 0, wialon_resource_id: 1, wialon_zone_id: 1, is_departure: 1, is_finish: 0 },
    { id: 11, stop_order: 1, wialon_resource_id: 1, wialon_zone_id: 20, is_departure: 0, is_finish: 0 }
  ];
  const departureTs = 500;
  // Left base, never hit tujuan, re-entered Sankyu
  const zoneTimeline = [
    { zoneKey: SANKYU, entryTs: 400 }, // before departure (idle)
    { zoneKey: SANKYU, entryTs: 900 } // re-entry after departure
  ];
  const history = [
    { id_sc_stop: 10, step_key: 'stop:10', wialon_resource_id: 1, wialon_zone_id: 1, gps_ts: 400 }
  ];
  const hit = resolveFinishGpsHit({
    departureTs,
    historyRows: history,
    stops,
    zoneTimeline,
    finishZoneKey: SANKYU,
    requireAllStopsBeforeFinish: false
  });
  assert.ok(hit, 'finish should allow skip middle');
  assert.strictEqual(hit.entryTs, 900);
  console.log('OK loose finish without middle stop hits');
}

function testNoFinishBeforeDeparture() {
  const hit = resolveFinishGpsHit({
    departureTs: Math.floor(Date.now() / 1000) + 3600, // future departure
    historyRows: [],
    stops: [],
    zoneTimeline: [{ zoneKey: SANKYU, entryTs: Math.floor(Date.now() / 1000) }],
    finishZoneKey: SANKYU,
    requireAllStopsBeforeFinish: false
  });
  assert.strictEqual(hit, null);
  console.log('OK no finish before departure');
}

function testNoFinishIdleAtBaseWithoutLeave() {
  const departureTs = 100;
  // Only one entry at base; still inside, no re-entry after leave
  const zoneTimeline = [{ zoneKey: SANKYU, entryTs: 50 }];
  const poly = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ];
  const messages = [
    { t: 50, lat: 0.5, lon: 0.5 },
    { t: 200, lat: 0.5, lon: 0.5 },
    { t: 300, lat: 0.5, lon: 0.5 }
  ];
  const hit = resolveFinishGpsHit({
    departureTs,
    historyRows: [],
    stops: [],
    zoneTimeline,
    finishZoneKey: SANKYU,
    messages,
    position: { lat: 0.5, lon: 0.5, gps_time: new Date(300 * 1000).toISOString() },
    finishPoints: poly,
    membershipHasUnit: true,
    requireAllStopsBeforeFinish: false
  });
  assert.strictEqual(hit, null, 'idle at base must not finish');
  console.log('OK no false finish while idle at base');
}

function testFinishAfterLeaveAndReturn() {
  const departureTs = 100;
  const poly = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ];
  const messages = [
    { t: 50, lat: 0.5, lon: 0.5 }, // in
    { t: 150, lat: 5, lon: 5 }, // left after departure
    { t: 250, lat: 0.5, lon: 0.5 } // returned
  ];
  const zoneTimeline = [
    { zoneKey: SANKYU, entryTs: 50 },
    { zoneKey: SANKYU, entryTs: 250 }
  ];
  const hit = resolveFinishGpsHit({
    departureTs,
    historyRows: [],
    stops: [],
    zoneTimeline,
    finishZoneKey: SANKYU,
    messages,
    finishPoints: poly,
    requireAllStopsBeforeFinish: false
  });
  assert.ok(hit);
  assert.strictEqual(hit.entryTs, 250);
  console.log('OK finish after leave and return to base');
}

function testStrictFinishRequiresAllStops() {
  const stops = [
    { id: 10, stop_order: 0, wialon_resource_id: 1, wialon_zone_id: 1, is_departure: 1, is_finish: 0 },
    { id: 11, stop_order: 1, wialon_resource_id: 1, wialon_zone_id: 20, is_departure: 0, is_finish: 0 }
  ];
  const hit = resolveFinishGpsHit({
    departureTs: 100,
    historyRows: [
      { id_sc_stop: 10, step_key: 'stop:10', wialon_resource_id: 1, wialon_zone_id: 1, gps_ts: 120 }
    ],
    stops,
    zoneTimeline: [{ zoneKey: SANKYU, entryTs: 500 }],
    finishZoneKey: SANKYU,
    requireAllStopsBeforeFinish: true
  });
  assert.strictEqual(hit, null, 'strict requires middle stop');
  console.log('OK strict finish still requires all stops');
}

function main() {
  testFullSequence();
  testSeedPartialHistory();
  testOnlyOneKiicEntry();
  testOutOfOrderFieldVisit();
  testLooseSkipsMissingMiddle();
  testStrictGateStillWorks();
  testBuildTimelineReentry();
  testSeedFromStopLookup();
  testLooseFinishWithoutMiddleStops();
  testNoFinishBeforeDeparture();
  testNoFinishIdleAtBaseWithoutLeave();
  testFinishAfterLeaveAndReturn();
  testStrictFinishRequiresAllStops();
  console.log('\nAll geofence assign + loose finish tests passed.');
}

main();
