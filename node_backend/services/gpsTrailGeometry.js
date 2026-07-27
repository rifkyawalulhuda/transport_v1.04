/**
 * Pure geometry helpers for GPS trail planned geofence polygons.
 * Wialon zone points use { x: lon, y: lat }.
 */

const DEFAULT_POLYGON_MAX_POINTS = 80;

const resolvePolygonMaxPoints = (maxPoints) => {
  const n = Number(maxPoints);
  if (Number.isFinite(n) && n >= 3) return Math.floor(n);
  return DEFAULT_POLYGON_MAX_POINTS;
};

/**
 * Convert Wialon polygon points to Leaflet-friendly [[lat, lon], ...].
 * @param {Array<{x?:number,y?:number,lon?:number,lat?:number}>|null|undefined} points
 * @returns {Array<[number, number]>|null}
 */
const wialonPointsToLatLngRing = (points) => {
  if (!Array.isArray(points) || points.length < 3) return null;
  const ring = [];
  for (const p of points) {
    const lon = Number(p?.x ?? p?.lon);
    const lat = Number(p?.y ?? p?.lat);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    ring.push([lat, lon]);
  }
  return ring.length >= 3 ? ring : null;
};

/**
 * Even-stride simplify; always keeps first + last. Result length >= 3 when input is.
 * @param {Array<[number, number]>|null|undefined} ring
 * @param {number} [maxPoints]
 * @returns {Array<[number, number]>|null}
 */
const simplifyLatLngRing = (ring, maxPoints = DEFAULT_POLYGON_MAX_POINTS) => {
  if (!Array.isArray(ring) || ring.length < 3) return null;
  const cap = resolvePolygonMaxPoints(maxPoints);
  if (ring.length <= cap) return ring;

  const out = [];
  const lastIdx = ring.length - 1;
  const seen = new Set();
  for (let i = 0; i < cap; i++) {
    const idx = i === cap - 1 ? lastIdx : Math.round((i * lastIdx) / (cap - 1));
    if (seen.has(idx)) continue;
    seen.add(idx);
    out.push(ring[idx]);
  }
  // Ensure first/last if stride skipped due to rounding collisions
  if (out.length < 3) return ring.slice(0, 3);
  if (out[0] !== ring[0]) out[0] = ring[0];
  if (out[out.length - 1] !== ring[lastIdx]) out[out.length - 1] = ring[lastIdx];
  return out.length >= 3 ? out : null;
};

/**
 * Build simplified [[lat, lon], ...] ring for API payload.
 * @param {Array|null|undefined} points Wialon points
 * @param {number} [maxPoints]
 * @returns {Array<[number, number]>|null}
 */
const buildPlannedPolygon = (points, maxPoints = DEFAULT_POLYGON_MAX_POINTS) => {
  const ring = wialonPointsToLatLngRing(points);
  return simplifyLatLngRing(ring, maxPoints);
};

module.exports = {
  DEFAULT_POLYGON_MAX_POINTS,
  wialonPointsToLatLngRing,
  simplifyLatLngRing,
  buildPlannedPolygon
};
