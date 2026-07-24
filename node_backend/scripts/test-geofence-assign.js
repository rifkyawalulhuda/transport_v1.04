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
  resolveFinishGpsHit,
  analyzeBaseExit
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

// Unit square ~111km side if used as lat/lon degrees — use small poly around 0,0
// points x=lon y=lat in [0,1] — 1 degree ~ 111km so outside at lon=0.05 is ~5.5km
const BASE_POLY = [
  { x: 0, y: 0 },
  { x: 0.01, y: 0 },
  { x: 0.01, y: 0.01 },
  { x: 0, y: 0.01 }
];

function testFalseFinishIgnitionAtBase() {
  // #44390-like: early dep hit, after planned dep still at base with short blip
  const stops = [
    { id: 203, stop_order: 0, wialon_resource_id: 1, wialon_zone_id: 1, is_departure: 1, is_finish: 0 },
    { id: 204, stop_order: 1, wialon_resource_id: 1, wialon_zone_id: 79, is_departure: 0, is_finish: 0 }
  ];
  const departureTs = 10000; // planned trip start
  const messages = [
    { t: 5000, lat: 0.005, lon: 0.005 }, // parked before dep
    { t: 10060, lat: 0.005, lon: 0.005 }, // still inside after dep
    { t: 10100, lat: 0.011, lon: 0.011 }, // short outside blip (~seconds)
    { t: 10130, lat: 0.005, lon: 0.005 } // re-entry ignition
  ];
  const zoneTimeline = [
    { zoneKey: SANKYU, entryTs: 5000 },
    { zoneKey: SANKYU, entryTs: 10130 }
  ];
  const history = [
    { id_sc_stop: 203, step_key: 'stop:203', wialon_resource_id: 1, wialon_zone_id: 1, gps_ts: 5000 }
  ];
  const hit = resolveFinishGpsHit({
    departureTs,
    historyRows: history,
    stops,
    zoneTimeline,
    finishZoneKey: SANKYU,
    departureZoneKey: SANKYU,
    messages,
    finishPoints: BASE_POLY,
    requireAllStopsBeforeFinish: false
  });
  assert.strictEqual(hit, null, '#44390-like ignition must not finish');
  console.log('OK no false finish on ignition at base');
}

function testFinishAfterLongLeaveNoMiddle() {
  const stops = [
    { id: 10, stop_order: 0, wialon_resource_id: 1, wialon_zone_id: 1, is_departure: 1, is_finish: 0 },
    { id: 11, stop_order: 1, wialon_resource_id: 1, wialon_zone_id: 79, is_departure: 0, is_finish: 0 }
  ];
  const departureTs = 1000;
  const reentry = 1000 + 30 * 60;
  const messages = [
    { t: 900, lat: 0.005, lon: 0.005 },
    { t: 1100, lat: 0.2, lon: 0.2 },
    { t: 1100 + 25 * 60, lat: 0.2, lon: 0.2 },
    { t: reentry, lat: 0.005, lon: 0.005 }
  ];
  const hit = resolveFinishGpsHit({
    departureTs,
    historyRows: [{ id_sc_stop: 10, step_key: 'stop:10', gps_ts: 900, wialon_resource_id: 1, wialon_zone_id: 1 }],
    stops,
    zoneTimeline: [
      { zoneKey: SANKYU, entryTs: 900 },
      { zoneKey: SANKYU, entryTs: reentry }
    ],
    finishZoneKey: SANKYU,
    departureZoneKey: SANKYU,
    messages,
    finishPoints: BASE_POLY,
    requireAllStopsBeforeFinish: false
  });
  assert.ok(hit);
  assert.strictEqual(hit.entryTs, reentry);
  console.log('OK finish after long leave without middle');
}

function testFinishWithMiddleHitBypassesMinAway() {
  const stops = [
    { id: 10, stop_order: 0, wialon_resource_id: 1, wialon_zone_id: 1, is_departure: 1, is_finish: 0 },
    { id: 11, stop_order: 1, wialon_resource_id: 1, wialon_zone_id: 79, is_departure: 0, is_finish: 0 }
  ];
  const departureTs = 1000;
  const hit = resolveFinishGpsHit({
    departureTs,
    historyRows: [
      { id_sc_stop: 10, step_key: 'stop:10', gps_ts: 900, wialon_resource_id: 1, wialon_zone_id: 1 },
      { id_sc_stop: 11, step_key: 'stop:11', gps_ts: 1500, wialon_resource_id: 1, wialon_zone_id: 79 }
    ],
    stops,
    zoneTimeline: [
      { zoneKey: SANKYU, entryTs: 900 },
      { zoneKey: SANKYU, entryTs: 2000 }
    ],
    finishZoneKey: SANKYU,
    departureZoneKey: SANKYU,
    messages: [
      { t: 900, lat: 0.005, lon: 0.005 },
      { t: 1500, lat: 1, lon: 1 },
      { t: 2000, lat: 0.005, lon: 0.005 }
    ],
    finishPoints: BASE_POLY,
    requireAllStopsBeforeFinish: false
  });
  assert.ok(hit, 'middle hit allows finish on return');
  assert.strictEqual(hit.entryTs, 2000);
  console.log('OK middle hit bypasses min-away for finish');
}

function testAnalyzeBaseExitShortBlip() {
  // Just outside poly edge (~0.011), ~100-200m, 30s only — below thresholds
  const r = analyzeBaseExit({
    messages: [
      { t: 100, lat: 0.005, lon: 0.005 },
      { t: 200, lat: 0.0105, lon: 0.0105 },
      { t: 230, lat: 0.005, lon: 0.005 }
    ],
    finishPoints: BASE_POLY,
    tripStartTs: 50,
    minAwaySec: 1200,
    minAwayM: 1000
  });
  assert.ok(r.leftAfterTripStart);
  assert.ok(r.maxAwayMeters < 1000, `maxAway=${r.maxAwayMeters}`);
  assert.ok(r.awayDurationSec < 1200);
  assert.strictEqual(r.qualifies, false);
  console.log('OK analyzeBaseExit rejects short blip');
}

function testLooseFinishWithoutMiddleStops() {
  const stops = [
    { id: 10, stop_order: 0, wialon_resource_id: 1, wialon_zone_id: 1, is_departure: 1, is_finish: 0 },
    { id: 11, stop_order: 1, wialon_resource_id: 1, wialon_zone_id: 20, is_departure: 0, is_finish: 0 }
  ];
  const departureTs = 500;
  // Meaningful leave (>20min / far) then re-enter — skip tujuan still OK
  const messages = [
    { t: 400, lat: 0.005, lon: 0.005 }, // in base before dep
    { t: 600, lat: 0.5, lon: 0.5 }, // far outside after dep
    { t: 600 + 25 * 60, lat: 0.5, lon: 0.5 }, // still away 25 min
    { t: 600 + 26 * 60, lat: 0.005, lon: 0.005 } // re-entry
  ];
  const reentryTs = 600 + 26 * 60;
  const zoneTimeline = [
    { zoneKey: SANKYU, entryTs: 400 },
    { zoneKey: SANKYU, entryTs: reentryTs }
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
    departureZoneKey: SANKYU,
    messages,
    finishPoints: BASE_POLY,
    requireAllStopsBeforeFinish: false
  });
  assert.ok(hit, 'finish should allow skip middle after meaningful leave');
  assert.strictEqual(hit.entryTs, reentryTs);
  console.log('OK loose finish without middle after min-away leave');
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
    departureZoneKey: SANKYU,
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
  // Far away long enough (distance >> 1km) then return
  const messages = [
    { t: 50, lat: 0.5, lon: 0.5 },
    { t: 150, lat: 5, lon: 5 },
    { t: 150 + 25 * 60, lat: 5, lon: 5 },
    { t: 150 + 26 * 60, lat: 0.5, lon: 0.5 }
  ];
  const reentry = 150 + 26 * 60;
  const zoneTimeline = [
    { zoneKey: SANKYU, entryTs: 50 },
    { zoneKey: SANKYU, entryTs: reentry }
  ];
  const hit = resolveFinishGpsHit({
    departureTs,
    historyRows: [],
    stops: [
      { id: 1, is_departure: 1, is_finish: 0, wialon_resource_id: 1, wialon_zone_id: 1 }
    ],
    zoneTimeline,
    finishZoneKey: SANKYU,
    departureZoneKey: SANKYU,
    messages,
    finishPoints: poly,
    requireAllStopsBeforeFinish: false
  });
  assert.ok(hit);
  assert.strictEqual(hit.entryTs, reentry);
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
  testFalseFinishIgnitionAtBase();
  testFinishAfterLongLeaveNoMiddle();
  testFinishWithMiddleHitBypassesMinAway();
  testAnalyzeBaseExitShortBlip();
  testLooseFinishWithoutMiddleStops();
  testNoFinishBeforeDeparture();
  testNoFinishIdleAtBaseWithoutLeave();
  testFinishAfterLeaveAndReturn();
  testStrictFinishRequiresAllStops();
  console.log('\nAll geofence assign + loose finish + base-exit tests passed.');
}

main();
