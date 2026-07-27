/**
 * Unit tests for gpsTrailGeometry (planned geofence polygon rings).
 * Run: node scripts/test-gps-trail-polygon.js
 */
const assert = require('assert');
const {
  wialonPointsToLatLngRing,
  simplifyLatLngRing,
  buildPlannedPolygon
} = require('../services/gpsTrailGeometry');

function testRingSwapLatLon() {
  const pts = [
    { x: 107.1, y: -6.3 },
    { x: 107.2, y: -6.3 },
    { x: 107.2, y: -6.4 },
    { x: 107.1, y: -6.4 }
  ];
  const ring = wialonPointsToLatLngRing(pts);
  assert.ok(ring);
  assert.strictEqual(ring.length, 4);
  assert.strictEqual(ring[0][0], -6.3); // lat
  assert.strictEqual(ring[0][1], 107.1); // lon
  console.log('OK ring swaps y→lat, x→lon');
}

function testSimplifyPreservesEnds() {
  const ring = Array.from({ length: 200 }, (_, i) => [-6 - i * 0.001, 107 + i * 0.001]);
  const out = simplifyLatLngRing(ring, 80);
  assert.ok(out);
  assert.ok(out.length <= 80);
  assert.ok(out.length >= 3);
  assert.deepStrictEqual(out[0], ring[0]);
  assert.deepStrictEqual(out[out.length - 1], ring[ring.length - 1]);
  console.log('OK simplify 200→≤80 preserves ends');
}

function testTooFewPointsNull() {
  assert.strictEqual(wialonPointsToLatLngRing([{ x: 1, y: 2 }, { x: 3, y: 4 }]), null);
  assert.strictEqual(buildPlannedPolygon([{ x: 1, y: 2 }]), null);
  assert.strictEqual(buildPlannedPolygon(null), null);
  assert.strictEqual(buildPlannedPolygon([]), null);
  console.log('OK <3 points / empty → null');
}

function testBuildPlannedPolygon() {
  const pts = Array.from({ length: 100 }, (_, i) => ({
    x: 107 + i * 0.01,
    y: -6 - i * 0.01
  }));
  const poly = buildPlannedPolygon(pts, 40);
  assert.ok(poly);
  assert.ok(poly.length <= 40);
  assert.ok(poly.length >= 3);
  assert.strictEqual(poly[0][0], pts[0].y);
  assert.strictEqual(poly[0][1], pts[0].x);
  console.log('OK buildPlannedPolygon end-to-end');
}

function main() {
  testRingSwapLatLon();
  testSimplifyPreservesEnds();
  testTooFewPointsNull();
  testBuildPlannedPolygon();
  console.log('\nAll gps-trail polygon tests passed.');
}

main();
