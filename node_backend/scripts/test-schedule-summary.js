/**
 * Unit tests for Schedule Pengiriman summary helpers (no DB / no Wialon).
 * Run: node scripts/test-schedule-summary.js
 *
 * Covers the agreed semantics:
 * - schedule_status is per-SPK (waiting/on_trip/overdue/completed); "incomplete_finish" is gone.
 * - finish is detected from a single source of truth (detectFinishHit).
 * - progress counts middle ("tujuan") stops only; skipped/inferred count as reached.
 */
const assert = require('assert');

const {
  resolveScheduleStatus,
  resolveStopTimelineSummary,
  detectFinishHit,
  summarizeStopProgress
} = require('../services/scheduleSummaryService');

const now = Date.now();
const HOUR = 60 * 60 * 1000;

// ── resolveScheduleStatus ────────────────────────────────────────────────────
assert.equal(
  resolveScheduleStatus({
    departureDatetime: new Date(now - 5 * HOUR),
    plannedFinishDatetime: new Date(now - HOUR),
    finishHit: true
  }).schedule_status,
  'completed',
  'finishHit -> completed (even if planned finish already passed)'
);

assert.equal(
  resolveScheduleStatus({
    departureDatetime: new Date(now - 5 * HOUR),
    plannedFinishDatetime: new Date(now - HOUR),
    finishHit: false
  }).schedule_status,
  'overdue',
  'planned finish passed and not finished -> overdue'
);

assert.equal(
  resolveScheduleStatus({
    departureDatetime: new Date(now - 2 * HOUR),
    plannedFinishDatetime: new Date(now + 2 * HOUR),
    finishHit: false
  }).schedule_status,
  'on_trip',
  'departed and finish ETA in future -> on_trip'
);

assert.equal(
  resolveScheduleStatus({
    departureDatetime: new Date(now + 2 * HOUR),
    plannedFinishDatetime: new Date(now + 5 * HOUR),
    finishHit: false
  }).schedule_status,
  'waiting',
  'not departed yet -> waiting'
);

assert.equal(
  resolveScheduleStatus({
    departureDatetime: new Date(now - 3 * HOUR),
    arrivalDatetime: new Date(now - HOUR),
    finishHit: false
  }).schedule_status,
  'overdue',
  'falls back to arrival when no planned finish ETA'
);
console.log('OK resolveScheduleStatus');

// ── resolveStopTimelineSummary + detectFinishHit ─────────────────────────────
const stops = [
  { id: 1, stop_order: 0, stop_name: 'Departure', is_departure: 1, is_finish: 0, estimated_arrival: null, wialon_zone_name: null },
  { id: 2, stop_order: 1, stop_name: 'T1', is_departure: 0, is_finish: 0, estimated_arrival: new Date(now - 3 * HOUR), wialon_zone_name: 'Z2' },
  { id: 3, stop_order: 2, stop_name: 'T2', is_departure: 0, is_finish: 0, estimated_arrival: new Date(now - 2 * HOUR), wialon_zone_name: 'Z3' },
  { id: 4, stop_order: 3, stop_name: 'Finish', is_departure: 0, is_finish: 1, estimated_arrival: new Date(now - HOUR), wialon_zone_name: 'ZF' }
];

const history = [
  { id_sc_stop: 2, step_key: 'stop:2', gps_time: new Date(now - 2.5 * HOUR), is_manual: 0, lat: 1, lon: 2 },
  { id_sc_stop: null, step_key: 'system:finish_order', gps_time: new Date(now - HOUR), is_manual: 1 }
];

const timeline = resolveStopTimelineSummary({ deliveryStops: stops, historyRows: history });
const byId = Object.fromEntries(timeline.map((s) => [s.id, s]));

assert.equal(byId[1].inferred_passed, true, 'departure inferred passed when a later stop was visited');
assert.equal(byId[1].overdue, false, 'inferred departure is not marked overdue');
assert.equal(byId[2].hit, true, 'T1 hit via history');
assert.equal(byId[3].geofence_skipped, true, 'unhit middle stop skipped once finished');
assert.equal(byId[3].overdue, false, 'skipped stop is not marked overdue');
assert.equal(byId[4].hit, true, 'finish stop hit via system:finish_order fallback');
assert.equal(detectFinishHit(timeline, history), true, 'finish detected via system:finish_order');
console.log('OK resolveStopTimelineSummary + detectFinishHit');

// finish detected from a finish-stop hit without a system row
const historyFinishStopOnly = [
  { id_sc_stop: 4, step_key: 'stop:4', gps_time: new Date(now - HOUR), is_manual: 0 }
];
const timelineFinishStop = resolveStopTimelineSummary({ deliveryStops: stops, historyRows: historyFinishStopOnly });
assert.equal(detectFinishHit(timelineFinishStop, historyFinishStopOnly), true, 'finish detected via finish-stop hit');

// not finished yet
const timelineOpen = resolveStopTimelineSummary({ deliveryStops: stops, historyRows: [] });
assert.equal(detectFinishHit(timelineOpen, []), false, 'no finish row / hit -> not finished');
assert.equal(timelineOpen.find((s) => s.id === 3).geofence_skipped, false, 'no skip when SPK not finished');
console.log('OK detectFinishHit variants');

// ── summarizeStopProgress ────────────────────────────────────────────────────
const progress = summarizeStopProgress(timeline);
assert.equal(progress.total_stops, 2, 'total counts middle stops only (T1, T2)');
assert.equal(progress.visited_stops, 2, 'skipped T2 still counts as reached');
assert.equal(
  summarizeStopProgress(timelineOpen).visited_stops,
  0,
  'nothing reached when no history'
);
console.log('OK summarizeStopProgress');

console.log('\nAll schedule-summary tests passed.');
