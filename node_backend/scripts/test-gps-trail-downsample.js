/**
 * Unit tests for downsampleTrailPoints
 * Run: node scripts/test-gps-trail-downsample.js
 */
const assert = require('assert');
const { downsampleTrailPoints } = require('../services/wialonService');

const makePoints = (n) =>
  Array.from({ length: n }, (_, i) => ({
    t: 1000 + i * 10,
    lat: -6.3 + i * 0.001,
    lon: 107.1 + i * 0.001
  }));

function testNoChangeWhenUnderMax() {
  const pts = makePoints(10);
  const r = downsampleTrailPoints(pts, 100);
  assert.strictEqual(r.rawCount, 10);
  assert.strictEqual(r.downsampled, false);
  assert.strictEqual(r.points.length, 10);
  assert.strictEqual(r.points[0].t, pts[0].t);
  assert.strictEqual(r.points[9].t, pts[9].t);
  console.log('OK no change under max');
}

function testDownsamplePreservesEnds() {
  const pts = makePoints(1000);
  const r = downsampleTrailPoints(pts, 100);
  assert.strictEqual(r.rawCount, 1000);
  assert.strictEqual(r.downsampled, true);
  assert.ok(r.points.length <= 100);
  assert.ok(r.points.length >= 2);
  assert.strictEqual(r.points[0].t, pts[0].t);
  assert.strictEqual(r.points[r.points.length - 1].t, pts[pts.length - 1].t);
  // monotonic t
  for (let i = 1; i < r.points.length; i++) {
    assert.ok(r.points[i].t >= r.points[i - 1].t);
  }
  console.log('OK downsample 1000→~100 preserves ends');
}

function testEmpty() {
  const r = downsampleTrailPoints([], 800);
  assert.strictEqual(r.rawCount, 0);
  assert.strictEqual(r.points.length, 0);
  assert.strictEqual(r.downsampled, false);
  console.log('OK empty');
}

function main() {
  testNoChangeWhenUnderMax();
  testDownsamplePreservesEnds();
  testEmpty();
  console.log('\nAll gps-trail downsample tests passed.');
}

main();
