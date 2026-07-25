const db = require("../db");
const {
  fetchWialonGeofences,
  fetchUnitsInZonesByResource,
  getUnitPositionMap,
  reverseGeocodeCoordinates,
  pointInPolygon,
  fetchRawMessagesForUnit,
  fetchZonePolygons,
  loginIsolatedSession,
  logoutIsolatedSession
} = require("./wialonService");

const DEFAULT_INTERVAL_MS = Number.parseInt(
  process.env.GEOFENCE_TRACKING_INTERVAL_MS || "60000",
  10
);

const TRACKING_INTERVAL_MS = Number.isFinite(DEFAULT_INTERVAL_MS) && DEFAULT_INTERVAL_MS > 0
  ? DEFAULT_INTERVAL_MS
  : 60000;
const DEFAULT_FINISH_GEOFENCE_NAME = String(
  process.env.DEFAULT_FINISH_GEOFENCE_NAME || "Sankyu"
).trim();
const DEFAULT_FINISH_STEP_CODE = "finish_order";
const DEFAULT_FINISH_STEP_KEY = `system:${DEFAULT_FINISH_STEP_CODE}`;

let intervalHandle = null;
let syncInProgress = false;
let started = false;

const pad2 = (value) => String(value).padStart(2, "0");

const toDateString = (value) => {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
};

const toMySqlDateTime = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return [
    `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`,
    `${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}:${pad2(parsed.getSeconds())}`
  ].join(" ");
};

const normalizePositiveIntString = (value) => {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return String(parsed);
};

/**
 * Build a chronological zone entry timeline from raw GPS messages.
 * Each entry represents the moment the truck first enters a zone it was not
 * already inside. Exiting a zone resets the tracker so a re-entry later is
 * treated as a new visit.
 *
 * @param {Array<{t:number, lat:number, lon:number}>} messages - GPS messages sorted by time
 * @param {Map<string, {points: Array, resourceId: string, zoneId: string}>} zonePolygonMap - zone polygons keyed by "resourceId:zoneId"
 * @returns {Array<{zoneKey: string, entryTs: number}>} sorted by entryTs ascending
 */
const buildZoneEntryTimeline = (messages, zonePolygonMap) => {
  const timeline = [];
  const inZoneMap = new Map(); // zoneKey → true (truck is currently inside this zone)

  for (const msg of messages) {
    const point = { x: msg.lon, y: msg.lat };
    // fetchRawMessagesForUnit returns t in Unix seconds (Wialon msg.t)
    const rawT = Number(msg.t);
    const msgTs = rawT > 1e12 ? Math.floor(rawT / 1000) : Math.floor(rawT);

    for (const [zoneKey, zoneData] of zonePolygonMap) {
      const isInZone = pointInPolygon(point, zoneData.points);

      if (isInZone && !inZoneMap.has(zoneKey)) {
        // Truck just entered this zone
        timeline.push({ zoneKey, entryTs: msgTs });
        inZoneMap.set(zoneKey, true);
      } else if (!isInZone && inZoneMap.has(zoneKey)) {
        // Truck left this zone — reset tracker so re-entry later is a new visit
        inZoneMap.delete(zoneKey);
      }
    }
  }

  return timeline.sort((a, b) => a.entryTs - b.entryTs);
};

/**
 * Seed zone consumption + global clock from existing route history so later
 * visits to the same geofence (KIIC→GIIC→KIIC) never reuse the first entry.
 *
 * @param {Array<{step_key?:string,id_sc_stop?:*,wialon_resource_id?:*,wialon_zone_id?:*,gps_ts?:number,gps_time?:*}>} historyRows
 * @param {Array<{id:*,wialon_resource_id?:*,wialon_zone_id?:*}>} stops
 * @returns {{consumedByZone: Map<string,number>, lastGlobalTs: number, hitStopIds: Set<number>}}
 */
const seedConsumptionFromHistory = (historyRows, stops = []) => {
  const consumedByZone = new Map();
  let lastGlobalTs = 0;
  const hitStopIds = new Set();
  const stopById = new Map(
    (stops || []).map((s) => [Number(s.id), s])
  );

  const rows = Array.isArray(historyRows) ? [...historyRows] : [];
  rows.sort((a, b) => {
    const ta = Number(a.gps_ts) || (a.gps_time ? Math.floor(new Date(a.gps_time).getTime() / 1000) : 0);
    const tb = Number(b.gps_ts) || (b.gps_time ? Math.floor(new Date(b.gps_time).getTime() / 1000) : 0);
    return ta - tb;
  });

  for (const row of rows) {
    if (row.step_key === DEFAULT_FINISH_STEP_KEY) continue;
    const stopId = row.id_sc_stop != null ? Number(row.id_sc_stop) : null;
    if (stopId) hitStopIds.add(stopId);

    let ts = Number(row.gps_ts);
    if (!Number.isFinite(ts) || ts <= 0) {
      ts = row.gps_time ? Math.floor(new Date(row.gps_time).getTime() / 1000) : 0;
    }
    if (!Number.isFinite(ts) || ts <= 0) continue;
    if (ts > lastGlobalTs) lastGlobalTs = ts;

    let rId = normalizePositiveIntString(row.wialon_resource_id);
    let zId = normalizePositiveIntString(row.wialon_zone_id);
    if ((!rId || !zId) && stopId && stopById.has(stopId)) {
      const stop = stopById.get(stopId);
      rId = normalizePositiveIntString(stop.wialon_resource_id);
      zId = normalizePositiveIntString(stop.wialon_zone_id);
    }
    if (!rId || !zId) continue;
    const zoneKey = `${rId}:${zId}`;
    const prev = consumedByZone.get(zoneKey) || 0;
    if (ts > prev) consumedByZone.set(zoneKey, ts);
  }

  return { consumedByZone, lastGlobalTs, hitStopIds };
};

/**
 * Assign zone-entry events to stops in stop_order with:
 * - per-zone consume (2nd KIIC ≠ 1st KIIC entry)
 * - global monotonic gps time across stops
 * - optional gate: wait until previous stop is hit
 *
 * @returns {Array<{stop:object, entryTs:number, zoneKey:string}>}
 */
/**
 * Default Opsi B (loose): field order is unpredictable — do not require previous
 * stop hit. ETA is never used here; only GPS zone-entry times.
 * Set GEOFENCE_REQUIRE_PREVIOUS_STOP=1 for strict sequential mode.
 */
const DEFAULT_REQUIRE_PREVIOUS_STOP =
  String(process.env.GEOFENCE_REQUIRE_PREVIOUS_STOP || "0").trim() === "1";

/**
 * Loose finish (default): GPS finish geofence may complete the SPK even if middle
 * stops were skipped. Set GEOFENCE_REQUIRE_ALL_STOPS_BEFORE_FINISH=1 for old behavior.
 */
const DEFAULT_REQUIRE_ALL_STOPS_BEFORE_FINISH =
  String(process.env.GEOFENCE_REQUIRE_ALL_STOPS_BEFORE_FINISH || "0").trim() === "1";

// Same-zone finish (Departure=Finish=Sankyu): require meaningful leave so ignition/GPS
// blips at base do not complete the SPK (#44390). Leave evidence may start up to
// LOOKBACK before planned departure so early trip+return still finishes (#44394).
const FINISH_MIN_AWAY_SEC = (() => {
  const n = Number.parseInt(process.env.GEOFENCE_FINISH_MIN_AWAY_SEC || "1200", 10);
  return Number.isFinite(n) && n >= 0 ? n : 1200; // 20 min
})();
const FINISH_MIN_AWAY_M = (() => {
  const n = Number.parseFloat(process.env.GEOFENCE_FINISH_MIN_AWAY_M || "1000");
  return Number.isFinite(n) && n >= 0 ? n : 1000; // 1 km
})();
const FINISH_LEAVE_LOOKBACK_SEC = (() => {
  const n = Number.parseInt(process.env.GEOFENCE_FINISH_LEAVE_LOOKBACK_SEC || "14400", 10);
  return Number.isFinite(n) && n >= 0 ? n : 14400; // 4 h before planned dep
})();

// Auto-finish unfinished SPKs by trip distance (zone centroid) + age since planned dep
const AGE_FINISH_SHORT_KM = (() => {
  const n = Number.parseFloat(process.env.GEOFENCE_AGE_FINISH_SHORT_KM || "60");
  return Number.isFinite(n) && n >= 0 ? n : 60;
})();
const AGE_FINISH_MID_KM = (() => {
  const n = Number.parseFloat(process.env.GEOFENCE_AGE_FINISH_MID_KM || "100");
  return Number.isFinite(n) && n > AGE_FINISH_SHORT_KM ? n : 100;
})();
const AGE_FINISH_DAYS_SHORT = (() => {
  const n = Number.parseInt(process.env.GEOFENCE_AGE_FINISH_DAYS_SHORT || "3", 10);
  return Number.isFinite(n) && n > 0 ? n : 3;
})();
const AGE_FINISH_DAYS_MID = (() => {
  const n = Number.parseInt(process.env.GEOFENCE_AGE_FINISH_DAYS_MID || "7", 10);
  return Number.isFinite(n) && n > 0 ? n : 7;
})();
const AGE_FINISH_DAYS_LONG = (() => {
  const n = Number.parseInt(process.env.GEOFENCE_AGE_FINISH_DAYS_LONG || "10", 10);
  return Number.isFinite(n) && n > 0 ? n : 10;
})();
const AGE_FINISH_DAYS_FALLBACK = (() => {
  const n = Number.parseInt(process.env.GEOFENCE_AGE_FINISH_DAYS_FALLBACK || "3", 10);
  return Number.isFinite(n) && n > 0 ? n : 3;
})();
const AGE_FINISH_LOOKBACK_DAYS = (() => {
  const n = Number.parseInt(process.env.GEOFENCE_AGE_FINISH_LOOKBACK_DAYS || "60", 10);
  return Number.isFinite(n) && n > 0 ? n : 60;
})();
const AGE_FINISH_DRY_RUN =
  String(process.env.GEOFENCE_AGE_FINISH_DRY_RUN || "0").trim() === "1";
const AGE_FINISH_STEP_NAME = "Auto Finish (Jarak/Umur)";

/** Approx meters between two lat/lon points (haversine). */
const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
};

const polygonCentroid = (points) => {
  if (!Array.isArray(points) || points.length === 0) return null;
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += Number(p.x) || 0;
    sy += Number(p.y) || 0;
  }
  return { lon: sx / points.length, lat: sy / points.length };
};

/**
 * Max haversine km from departure zone centroid to middle (or finish) stop centroids.
 * @returns {number|null} km or null when polygons unavailable
 */
const computeTripDistanceKm = ({ stops = [], zonePolygonMap = new Map() } = {}) => {
  const list = Array.isArray(stops) ? stops : [];
  const dep = list.find((s) => Number(s.is_departure) === 1);
  if (!dep) return null;
  const depRes = normalizePositiveIntString(dep.wialon_resource_id);
  const depZ = normalizePositiveIntString(dep.wialon_zone_id);
  if (!depRes || !depZ) return null;
  const depKey = `${depRes}:${depZ}`;
  const depPoints = zonePolygonMap.get(depKey)?.points;
  const depC = polygonCentroid(depPoints);
  if (!depC) return null;

  const targets = list.filter(
    (s) => Number(s.is_departure) !== 1 && Number(s.is_finish) !== 1
  );
  const finishStops = list.filter((s) => Number(s.is_finish) === 1);
  const dests = targets.length > 0 ? targets : finishStops;
  if (dests.length === 0) return null;

  let maxM = 0;
  let any = false;
  for (const s of dests) {
    const rId = normalizePositiveIntString(s.wialon_resource_id);
    const zId = normalizePositiveIntString(s.wialon_zone_id);
    if (!rId || !zId) continue;
    const pts = zonePolygonMap.get(`${rId}:${zId}`)?.points;
    const c = polygonCentroid(pts);
    if (!c) continue;
    const m = haversineMeters(depC.lat, depC.lon, c.lat, c.lon);
    if (Number.isFinite(m)) {
      any = true;
      if (m > maxM) maxM = m;
    }
  }
  if (!any) return null;
  return Number((maxM / 1000).toFixed(3));
};

/**
 * Days allowed open after planned departure from trip distance km.
 * ≤shortKm → short days; ≤midKm → mid days; else long days; null → fallback.
 */
const resolveAgeFinishDays = (
  distanceKm,
  {
    shortKm = AGE_FINISH_SHORT_KM,
    midKm = AGE_FINISH_MID_KM,
    daysShort = AGE_FINISH_DAYS_SHORT,
    daysMid = AGE_FINISH_DAYS_MID,
    daysLong = AGE_FINISH_DAYS_LONG,
    daysFallback = AGE_FINISH_DAYS_FALLBACK
  } = {}
) => {
  if (distanceKm == null || !Number.isFinite(Number(distanceKm))) {
    return daysFallback;
  }
  const km = Number(distanceKm);
  if (km <= shortKm) return daysShort;
  if (km <= midKm) return daysMid;
  return daysLong;
};

/**
 * Whether SPK is due for age-based auto-finish.
 * @returns {{ due: boolean, days: number, deadlineTs: number, distanceKm: number|null }}
 */
const isDueForAgeFinish = ({
  departureTs,
  distanceKm = null,
  nowTs = Math.floor(Date.now() / 1000),
  bracketOpts = {}
} = {}) => {
  const dep = Number(departureTs) || 0;
  const now = Number(nowTs) || 0;
  const days = resolveAgeFinishDays(distanceKm, bracketOpts);
  if (dep <= 0 || now < dep) {
    return { due: false, days, deadlineTs: 0, distanceKm: distanceKm ?? null };
  }
  const deadlineTs = dep + days * 24 * 60 * 60;
  return {
    due: now >= deadlineTs,
    days,
    deadlineTs,
    distanceKm: distanceKm == null || !Number.isFinite(Number(distanceKm))
      ? null
      : Number(distanceKm)
  };
};

/**
 * Evidence that truck left finish/base polygon meaningfully after tripStartTs.
 * Blocks idle/ignition false finish when Departure zone === Finish zone.
 */
const analyzeBaseExit = ({
  messages = [],
  finishPoints = null,
  tripStartTs = 0,
  minAwaySec = FINISH_MIN_AWAY_SEC,
  minAwayM = FINISH_MIN_AWAY_M
} = {}) => {
  const result = {
    leftAfterTripStart: false,
    awayDurationSec: 0,
    maxAwayMeters: 0,
    firstExitTs: 0,
    lastOutsideTs: 0,
    reentryTs: 0,
    qualifies: false
  };

  if (
    !Array.isArray(finishPoints) ||
    finishPoints.length < 3 ||
    !Array.isArray(messages) ||
    messages.length === 0
  ) {
    return result;
  }

  const centroid = polygonCentroid(finishPoints);
  const tripStart = Number(tripStartTs) || 0;
  let outsideStart = null;
  let maxContinuousAway = 0;
  let totalAway = 0;
  let prevTs = null;
  let wasOutside = false;

  const sorted = [...messages].sort(
    (a, b) => messageTsSeconds(a) - messageTsSeconds(b)
  );

  for (const m of sorted) {
    const ts = messageTsSeconds(m);
    if (!Number.isFinite(ts) || ts <= tripStart) {
      prevTs = ts;
      continue;
    }
    const outside = !pointInPolygon({ x: m.lon, y: m.lat }, finishPoints);

    if (outside) {
      result.leftAfterTripStart = true;
      if (!result.firstExitTs) result.firstExitTs = ts;
      result.lastOutsideTs = ts;
      if (outsideStart == null) outsideStart = ts;
      if (centroid && Number.isFinite(m.lat) && Number.isFinite(m.lon)) {
        const d = haversineMeters(centroid.lat, centroid.lon, m.lat, m.lon);
        if (d > result.maxAwayMeters) result.maxAwayMeters = d;
      }
      if (prevTs != null && wasOutside && ts > prevTs) {
        totalAway += ts - prevTs;
      }
      wasOutside = true;
    } else {
      if (outsideStart != null) {
        const seg = ts - outsideStart;
        if (seg > maxContinuousAway) maxContinuousAway = seg;
        if (!result.reentryTs) result.reentryTs = ts;
        outsideStart = null;
      }
      wasOutside = false;
    }
    prevTs = ts;
  }
  // Still outside at end of trail
  if (outsideStart != null && prevTs != null) {
    const seg = prevTs - outsideStart;
    if (seg > maxContinuousAway) maxContinuousAway = seg;
  }

  result.awayDurationSec = Math.max(maxContinuousAway, totalAway);
  result.qualifies =
    result.leftAfterTripStart &&
    (result.awayDurationSec >= minAwaySec || result.maxAwayMeters >= minAwayM);

  return result;
};

/**
 * Resolve finish GPS hit (actual entry time, not ETA).
 * Same-zone finish (dep=finish Sankyu): require meaningful leave within lookback
 * before planned departure OR a middle-stop hit — blocks ignition false finish
 * (#44390) while allowing early trip+return finish (#44394).
 * Hard gate: now must be >= planned departure before finish may be recorded.
 *
 * @returns {{ entryTs: number, lat: number|null, lon: number|null, source: string }|null}
 */
const resolveFinishGpsHit = ({
  departureTs,
  historyRows = [],
  stops = [],
  zoneTimeline = [],
  finishZoneKey,
  departureZoneKey = null,
  messages = [],
  position = null,
  finishPoints = null,
  unitId = null,
  membershipHasUnit = false,
  requireAllStopsBeforeFinish = DEFAULT_REQUIRE_ALL_STOPS_BEFORE_FINISH,
  leaveLookbackSec = FINISH_LEAVE_LOOKBACK_SEC
} = {}) => {
  if (!finishZoneKey) return null;

  const depTs = Number(departureTs) || 0;
  const nowTs = Math.floor(Date.now() / 1000);
  if (depTs > 0 && nowTs < depTs) return null;

  const nonDepartureStops = (stops || []).filter(
    (s) => Number(s.is_departure) !== 1 && Number(s.is_finish) !== 1
  );
  if (requireAllStopsBeforeFinish && nonDepartureStops.length > 0) {
    const hitIds = new Set(
      (historyRows || [])
        .filter((h) => h.id_sc_stop != null && h.step_key !== DEFAULT_FINISH_STEP_KEY)
        .map((h) => Number(h.id_sc_stop))
    );
    const allHit = nonDepartureStops.every((s) => hitIds.has(Number(s.id)));
    if (!allHit) return null;
  }

  // Leave / middle-hit evidence window starts lookback before planned dep (#44394).
  // Recording finish still requires now >= depTs (gate above).
  const lookback = Number.isFinite(Number(leaveLookbackSec)) && Number(leaveLookbackSec) >= 0
    ? Number(leaveLookbackSec)
    : FINISH_LEAVE_LOOKBACK_SEC;
  const leaveEvidenceStartTs = depTs > 0 ? Math.max(0, depTs - lookback) : 0;

  // Middle stop hit in leave-evidence window = proven trip (allows loose finish on return)
  const middleHitAfterTrip = (historyRows || []).some((h) => {
    if (h.step_key === DEFAULT_FINISH_STEP_KEY) return false;
    if (h.id_sc_stop == null) return false;
    const stop = (stops || []).find((s) => Number(s.id) === Number(h.id_sc_stop));
    if (!stop) return false;
    if (Number(stop.is_departure) === 1 || Number(stop.is_finish) === 1) return false;
    let ts = Number(h.gps_ts);
    if (!Number.isFinite(ts) || ts <= 0) {
      ts = h.gps_time ? Math.floor(new Date(h.gps_time).getTime() / 1000) : 0;
    }
    return ts > leaveEvidenceStartTs;
  });

  const sameZoneFinish =
    departureZoneKey &&
    finishZoneKey &&
    String(departureZoneKey) === String(finishZoneKey);

  let evidence = null;
  if (sameZoneFinish && !middleHitAfterTrip) {
    evidence = analyzeBaseExit({
      messages,
      finishPoints,
      tripStartTs: leaveEvidenceStartTs,
      minAwaySec: FINISH_MIN_AWAY_SEC,
      minAwayM: FINISH_MIN_AWAY_M
    });
    if (!evidence.qualifies) return null;
  }

  // minFinishTs: after leave-evidence start; if same-zone, after proven first exit
  // (allows re-entry before planned dep when leave happened early — #44394)
  let minFinishTs = leaveEvidenceStartTs;
  if (sameZoneFinish && evidence?.firstExitTs) {
    minFinishTs = Math.max(minFinishTs, evidence.firstExitTs);
  }
  if (middleHitAfterTrip) {
    const { lastGlobalTs } = seedConsumptionFromHistory(historyRows, stops);
    minFinishTs = Math.max(minFinishTs, lastGlobalTs || 0);
  }

  const timeline = Array.isArray(zoneTimeline)
    ? [...zoneTimeline].sort((a, b) => a.entryTs - b.entryTs)
    : [];
  const finishEntry = timeline.find(
    (e) => e.zoneKey === finishZoneKey && e.entryTs > minFinishTs
  );

  if (finishEntry) {
    const entryMsg = (messages || []).find(
      (m) => messageTsSeconds(m) === finishEntry.entryTs
    );
    return {
      entryTs: finishEntry.entryTs,
      lat: entryMsg?.lat ?? position?.lat ?? null,
      lon: entryMsg?.lon ?? position?.lon ?? null,
      source: "timeline"
    };
  }

  // Live fallback: inside finish zone now + trip evidence already satisfied above
  const insideNow =
    membershipHasUnit ||
    (position?.lat != null &&
      position?.lon != null &&
      Array.isArray(finishPoints) &&
      finishPoints.length >= 3 &&
      pointInPolygon({ x: position.lon, y: position.lat }, finishPoints));
  if (!insideNow) return null;

  if (sameZoneFinish && !middleHitAfterTrip) {
    // evidence.qualifies already required; need live time after exit
    if (!evidence?.firstExitTs) return null;
  } else if (!sameZoneFinish && !middleHitAfterTrip) {
    // Different finish zone: require at least one outside-of-finish in evidence window
    let leftOnce = false;
    if (Array.isArray(finishPoints) && finishPoints.length >= 3 && Array.isArray(messages)) {
      for (const m of messages) {
        const ts = messageTsSeconds(m);
        if (ts <= leaveEvidenceStartTs) continue;
        if (!pointInPolygon({ x: m.lon, y: m.lat }, finishPoints)) {
          leftOnce = true;
          break;
        }
      }
    }
    if (!leftOnce && leaveEvidenceStartTs > 0) return null;
  }

  const liveTs =
    position?.gps_time != null
      ? Math.floor(new Date(position.gps_time).getTime() / 1000)
      : nowTs;
  if (!Number.isFinite(liveTs) || liveTs <= minFinishTs) return null;

  return {
    entryTs: liveTs,
    lat: position?.lat ?? null,
    lon: position?.lon ?? null,
    source: "live"
  };
};

const assignStopHits = ({
  stops,
  zoneTimeline,
  existingHistory = [],
  requirePreviousStopHit = DEFAULT_REQUIRE_PREVIOUS_STOP
} = {}) => {
  const ordered = Array.isArray(stops)
    ? [...stops]
        .filter((s) => Number(s.is_finish) !== 1)
        .sort((a, b) => Number(a.stop_order) - Number(b.stop_order) || Number(a.id) - Number(b.id))
    : [];
  const timeline = Array.isArray(zoneTimeline)
    ? [...zoneTimeline].sort((a, b) => a.entryTs - b.entryTs)
    : [];

  const { consumedByZone, hitStopIds } =
    seedConsumptionFromHistory(existingHistory, ordered);
  const assignments = [];

  for (let i = 0; i < ordered.length; i++) {
    const stop = ordered[i];
    const stopId = Number(stop.id);
    if (hitStopIds.has(stopId)) continue;

    if (requirePreviousStopHit && i > 0) {
      const prev = ordered[i - 1];
      if (!hitStopIds.has(Number(prev.id))) break;
    }

    const resourceId = normalizePositiveIntString(stop.wialon_resource_id);
    const zoneId = normalizePositiveIntString(stop.wialon_zone_id);
    if (!resourceId || !zoneId) continue;
    const zoneKey = `${resourceId}:${zoneId}`;
    // Per-zone consume only — do NOT require entryTs > lastGlobalTs so
    // out-of-order field visits (stop2 before stop1) still record actual GPS times.
    const lastZoneTs = consumedByZone.get(zoneKey) || 0;

    const entry = timeline.find(
      (e) => e.zoneKey === zoneKey && e.entryTs > lastZoneTs
    );
    if (!entry) {
      // Strict: block later stops. Loose (Opsi B): skip this stop, try others.
      if (requirePreviousStopHit) break;
      continue;
    }

    assignments.push({ stop, entryTs: entry.entryTs, zoneKey });
    consumedByZone.set(zoneKey, entry.entryTs);
    hitStopIds.add(stopId);
  }

  return assignments;
};

const getActiveSalesCostCandidates = async () => {
  const [rows] = await db.query(`
    SELECT DISTINCT
      sc.id_sales_cost,
      sc.id_area,
      sc.id_truck,
      sc.departure_datetime,
      sc.arrival_datetime,
      sc.finish_order_datetime,
      t.wialon_unit_id,
      a.finish_geofence_resource_id,
      a.finish_geofence_zone_id,
      a.finish_geofence_zone_name
    FROM sales_cost sc
    INNER JOIN truck t ON sc.id_truck = t.id_truck
    INNER JOIN area a ON sc.id_area = a.id_area
    INNER JOIN sales_cost_step_schedule scss ON scss.id_sales_cost = sc.id_sales_cost
    WHERE sc.id_truck IS NOT NULL
      AND t.wialon_unit_id IS NOT NULL
      AND t.wialon_unit_id <> ''
      AND t.is_active = 1
      AND scss.wialon_zone_id IS NOT NULL
      AND sc.departure_datetime IS NOT NULL
      AND sc.departure_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND NOT EXISTS (
        SELECT 1 FROM sales_cost_route_history scrh
        WHERE scrh.id_sales_cost = sc.id_sales_cost
          AND scrh.step_key = 'system:finish_order'
      )
    ORDER BY sc.id_truck ASC, sc.departure_datetime DESC, sc.id_sales_cost DESC
  `);

  // Return ALL active sales costs (one per SPK, not one per truck).
  // Previously this deduplicated to 1 SPK per truck, causing trucks with
  // multiple active deliveries to only track the most recent one. (H9 fix)
  return rows
    .filter((row) => row.id_sales_cost && row.id_area && row.id_truck && row.wialon_unit_id)
    .map((row) => ({
      id_sales_cost: Number(row.id_sales_cost),
      id_area: Number(row.id_area),
      id_truck: Number(row.id_truck),
      departure_datetime: row.departure_datetime ?? null,
      arrival_datetime: row.arrival_datetime ?? null,
      finish_order_datetime: row.finish_order_datetime ?? null,
      wialon_unit_id: normalizePositiveIntString(row.wialon_unit_id),
      finish_geofence_resource_id: row.finish_geofence_resource_id ?? null,
      finish_geofence_zone_id: row.finish_geofence_zone_id ?? null,
      finish_geofence_zone_name: row.finish_geofence_zone_name ?? null
    }));
};

const checkArrivalDelays = async () => {
  try {
    const [overdueRows] = await db.query(`
      SELECT
        sc.id_sales_cost,
        sc.arrival_datetime,
        t.no_police,
        a.nama_area
      FROM sales_cost sc
      INNER JOIN truck t ON sc.id_truck = t.id_truck
      INNER JOIN area a ON sc.id_area = a.id_area
      WHERE sc.arrival_datetime IS NOT NULL
        AND sc.arrival_datetime < NOW()
        AND sc.departure_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND NOT EXISTS (
          SELECT 1 FROM sales_cost_route_history scrh
          WHERE scrh.id_sales_cost = sc.id_sales_cost
            AND scrh.step_key = 'system:finish_order'
        )
        AND NOT EXISTS (
          SELECT 1 FROM delivery_notifications dn
          WHERE dn.id_sales_cost = sc.id_sales_cost
            AND dn.id_area_route_step IS NULL
            AND dn.notification_type = 'arrival_overdue'
            AND dn.is_dismissed = 0
        )
    `);

    for (const row of overdueRows) {
      const arrivalStr = toMySqlDateTime(row.arrival_datetime);
      const message = `Truk ${row.no_police} seharusnya sudah tiba di rute ${row.nama_area} pada ${arrivalStr}. Truk belum trigger Geofence Area tujuan. Harap verifikasi posisi truk.`;
      await db.query(
        `INSERT INTO delivery_notifications
          (id_sales_cost, id_area_route_step, step_name, notification_type, truck_plate, route_name, scheduled_arrival, message)
         VALUES (?, NULL, NULL, 'arrival_overdue', ?, ?, ?, ?)`,
        [row.id_sales_cost, row.no_police, row.nama_area, row.arrival_datetime, message]
      );
    }

    if (overdueRows.length > 0) {
      console.log(`[geofence-tracking] created ${overdueRows.length} arrival overdue notification(s)`);
    }

    // Query 2: Per-step overdue check
    const [stepOverdueRows] = await db.query(`
      SELECT
        scss.id_sales_cost,
        scss.id AS id_sc_stop,
        scss.stop_name,
        scss.estimated_arrival,
        t.no_police,
        a.nama_area
      FROM sales_cost_step_schedule scss
      INNER JOIN sales_cost sc ON scss.id_sales_cost = sc.id_sales_cost
      INNER JOIN truck t ON sc.id_truck = t.id_truck
      INNER JOIN area a ON sc.id_area = a.id_area
      WHERE scss.estimated_arrival < NOW()
        AND scss.is_finish = 0
        AND sc.departure_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND NOT EXISTS (
          SELECT 1 FROM sales_cost_route_history scrh2
          WHERE scrh2.id_sales_cost = sc.id_sales_cost
            AND scrh2.step_key = 'system:finish_order'
        )
        AND NOT EXISTS (
          SELECT 1 FROM sales_cost_route_history scrh
          WHERE scrh.id_sales_cost = scss.id_sales_cost
            AND scrh.id_sc_stop = scss.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM delivery_notifications dn
          WHERE dn.id_sales_cost = scss.id_sales_cost
            AND dn.id_sc_stop = scss.id
            AND dn.is_dismissed = 0
        )
    `);

    for (const row of stepOverdueRows) {
      const arrivalStr = toMySqlDateTime(row.estimated_arrival);
      const message = `Truk ${row.no_police} seharusnya sudah tiba di ${row.stop_name} pada ${arrivalStr}. Truk belum trigger Geofence Area tersebut. Harap verifikasi posisi truk.`;
      await db.query(
        `INSERT INTO delivery_notifications
          (id_sales_cost, id_sc_stop, step_name, notification_type, truck_plate, route_name, scheduled_arrival, message)
         VALUES (?, ?, ?, 'arrival_overdue', ?, ?, ?, ?)`,
        [row.id_sales_cost, row.id_sc_stop, row.stop_name,
         row.no_police, row.nama_area, row.estimated_arrival, message]
      );
    }

    if (stepOverdueRows.length > 0) {
      console.log(`[geofence-tracking] created ${stepOverdueRows.length} per-step arrival overdue notification(s)`);
    }
  } catch (error) {
    console.warn('[geofence-tracking] checkArrivalDelays failed', error);
  }
};

const fetchExistingHistoryKeys = async (salesCostIds) => {
  if (!Array.isArray(salesCostIds) || salesCostIds.length === 0) return new Set();

  const placeholders = salesCostIds.map(() => '?').join(',');
  const [rows] = await db.query(
    `SELECT id_sales_cost, id_sc_stop, step_key
     FROM sales_cost_route_history
     WHERE id_sales_cost IN (${placeholders})`,
    salesCostIds
  );

  return new Set(
    rows.map((row) => {
      const scId = Number(row.id_sales_cost);
      const key = row.step_key || (row.id_sc_stop ? `stop:${row.id_sc_stop}` : '');
      return `${scId}:${key}`;
    }).filter(k => k !== ':')
  );
};

/** History rows used to seed sequential zone consumption (per sales cost). */
const fetchHistoryRowsForAssignment = async (salesCostIds) => {
  if (!Array.isArray(salesCostIds) || salesCostIds.length === 0) {
    return new Map();
  }
  const placeholders = salesCostIds.map(() => '?').join(',');
  const [rows] = await db.query(
    `SELECT id_sales_cost, id_sc_stop, step_key,
            wialon_resource_id, wialon_zone_id,
            UNIX_TIMESTAMP(gps_time) AS gps_ts, gps_time
     FROM sales_cost_route_history
     WHERE id_sales_cost IN (${placeholders})
       AND gps_time IS NOT NULL
       AND CAST(gps_time AS CHAR) <> '0000-00-00 00:00:00'`,
    salesCostIds
  );
  const bySc = new Map();
  for (const row of rows) {
    const scId = Number(row.id_sales_cost);
    if (!bySc.has(scId)) bySc.set(scId, []);
    bySc.get(scId).push(row);
  }
  return bySc;
};

const findDefaultFinishGeofence = async () => {
  const geofences = await fetchWialonGeofences();
  const normalizedTarget = DEFAULT_FINISH_GEOFENCE_NAME.toLowerCase();
  return (
    geofences.find((row) => row.zone_name.trim().toLowerCase() === normalizedTarget) ||
    geofences.find((row) => row.zone_name.trim().toLowerCase().includes(normalizedTarget)) ||
    null
  );
};

const resolveFinishGeofenceForSalesCost = (salesCost, fallbackFinishGeofence, scssFinishStop = null) => {
  const resourceId = normalizePositiveIntString(salesCost.finish_geofence_resource_id);
  const zoneId = normalizePositiveIntString(salesCost.finish_geofence_zone_id);
  const zoneName = String(salesCost.finish_geofence_zone_name || "").trim();

  if (resourceId && zoneId) {
    return {
      resource_id: Number(resourceId),
      zone_id: Number(zoneId),
      zone_name: zoneName || String(scssFinishStop?.wialon_zone_name || "Finish").trim() || "Finish"
    };
  }

  // Prefer explicit Finish stop geofence from sales_cost_step_schedule when area cols are empty
  const scssRes = normalizePositiveIntString(scssFinishStop?.wialon_resource_id);
  const scssZone = normalizePositiveIntString(scssFinishStop?.wialon_zone_id);
  if (scssRes && scssZone) {
    return {
      resource_id: Number(scssRes),
      zone_id: Number(scssZone),
      zone_name: String(scssFinishStop.wialon_zone_name || "Finish").trim() || "Finish"
    };
  }

  if (
    fallbackFinishGeofence?.resource_id &&
    fallbackFinishGeofence?.zone_id &&
    fallbackFinishGeofence?.zone_name
  ) {
    return fallbackFinishGeofence;
  }

  return null;
};

const messageTsSeconds = (msg) => {
  const rawT = Number(msg?.t);
  if (!Number.isFinite(rawT)) return 0;
  return rawT > 1e12 ? Math.floor(rawT / 1000) : Math.floor(rawT);
};

const syncGeofenceRouteHistory = async () => {
  const activeSalesCosts = await getActiveSalesCostCandidates();
  if (activeSalesCosts.length === 0) {
    return {
      active: 0,
      inserted: 0
    };
  }

  // Login once per sync cycle and share the isolated session across all trucks
  const sid = await loginIsolatedSession();
  let inserted = 0;
  try {

  const fallbackFinishGeofence = await findDefaultFinishGeofence();

  const activeScIds = activeSalesCosts.map((salesCost) => salesCost.id_sales_cost);
  const existingHistoryKeys = await fetchExistingHistoryKeys(activeScIds);
  const historyRowsBySc = await fetchHistoryRowsForAssignment(activeScIds);

  // Build resource/zone map from scss stops across all active sales costs
  const scIdPlaceholders = activeSalesCosts.map(() => '?').join(',');
  const scIds = activeSalesCosts.map((sc) => sc.id_sales_cost);
  const [allStopsRows] = await db.query(`
    SELECT id, id_sales_cost, stop_order, stop_name,
           wialon_resource_id, wialon_zone_id, wialon_zone_name,
           is_departure, is_finish
    FROM sales_cost_step_schedule
    WHERE id_sales_cost IN (${scIdPlaceholders})
      AND is_finish = 0
    ORDER BY id_sales_cost ASC, stop_order ASC
  `, scIds);

  // Finish rows (is_finish=1) supply geofence when area.finish_geofence_* is null
  const [finishStopRows] = await db.query(`
    SELECT id, id_sales_cost, stop_order, stop_name,
           wialon_resource_id, wialon_zone_id, wialon_zone_name,
           is_departure, is_finish
    FROM sales_cost_step_schedule
    WHERE id_sales_cost IN (${scIdPlaceholders})
      AND is_finish = 1
    ORDER BY id_sales_cost ASC, stop_order ASC
  `, scIds);
  const finishStopBySalesCost = new Map();
  for (const row of finishStopRows) {
    const scId = Number(row.id_sales_cost);
    if (!finishStopBySalesCost.has(scId)) finishStopBySalesCost.set(scId, row);
  }

  // Group stops by sales cost id
  const stopsBySalesCost = new Map();
  for (const row of allStopsRows) {
    const scId = Number(row.id_sales_cost);
    if (!stopsBySalesCost.has(scId)) stopsBySalesCost.set(scId, []);
    stopsBySalesCost.get(scId).push(row);
  }

  // Filter to only sales costs that have at least one scss stop
  const salesCostsWithStops = activeSalesCosts.filter(
    (sc) => (stopsBySalesCost.get(sc.id_sales_cost) || []).length > 0
  );

  if (salesCostsWithStops.length === 0) {
    return {
      active: activeSalesCosts.length,
      inserted: 0
    };
  }

  // Build resource→zone map for membership queries
  const resourceMap = new Map();
  for (const sc of salesCostsWithStops) {
    const stops = stopsBySalesCost.get(sc.id_sales_cost) || [];
    for (const stop of stops) {
      const resourceId = normalizePositiveIntString(stop.wialon_resource_id);
      const zoneId = normalizePositiveIntString(stop.wialon_zone_id);
      if (!resourceId || !zoneId) continue;
      if (!resourceMap.has(resourceId)) resourceMap.set(resourceId, new Set());
      resourceMap.get(resourceId).add(zoneId);
    }
    const finishGeofence = resolveFinishGeofenceForSalesCost(
      sc,
      fallbackFinishGeofence,
      finishStopBySalesCost.get(sc.id_sales_cost) || null
    );
    if (finishGeofence?.resource_id && finishGeofence?.zone_id) {
      const rId = normalizePositiveIntString(finishGeofence.resource_id);
      const zId = normalizePositiveIntString(finishGeofence.zone_id);
      if (rId && zId) {
        if (!resourceMap.has(rId)) resourceMap.set(rId, new Set());
        resourceMap.get(rId).add(zId);
      }
    }
  }

  const unitIds = salesCostsWithStops.map((sc) => sc.wialon_unit_id).filter(Boolean);

  const membershipResults = await Promise.all(
    Array.from(resourceMap.entries()).map(async ([resourceId, zoneIdSet]) => {
      const membershipMap = await fetchUnitsInZonesByResource({
        resourceId,
        zoneIds: Array.from(zoneIdSet),
        unitIds
      });
      return [resourceId, membershipMap];
    })
  );

  const membershipByResource = new Map(membershipResults);
  const positionMap = await getUnitPositionMap(unitIds);

  // Persist GPS cache to truck table — 2-phase: coordinates first, geocoding second (parallel)
  if (positionMap.size > 0) {
    // Phase 1: update coordinates in parallel (no geocoding)
    const gpsUpdates = [];
    const geocodeTargets = [];

    for (const [unitId, position] of positionMap.entries()) {
      if (position?.lat == null || position?.lon == null) continue;
      const gpsTime = toMySqlDateTime(position.gps_time) || toMySqlDateTime(new Date());
      geocodeTargets.push({ unitId, lat: position.lat, lon: position.lon });
      gpsUpdates.push(
        db.query(
          `UPDATE truck SET last_lat = ?, last_lng = ?, last_gps_time = ? WHERE wialon_unit_id = ? AND is_active = 1`,
          [position.lat, position.lon, gpsTime, unitId]
        )
      );
    }

    if (gpsUpdates.length > 0) {
      const results = await Promise.allSettled(gpsUpdates);
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        console.warn(`[geofence-tracking] GPS cache update: ${gpsUpdates.length - failed} ok, ${failed} failed`);
      } else {
        console.log(`[geofence-tracking] updated GPS cache for ${gpsUpdates.length} unit(s)`);
      }
    }

    // Phase 2: geocode in parallel, fire-and-forget (does not block main sync cycle)
    if (geocodeTargets.length > 0) {
      const geocodeJobs = geocodeTargets.map(async ({ unitId, lat, lon }) => {
        try {
          const geo = await reverseGeocodeCoordinates({ lat, lon }).catch(() => null);
          const address = geo?.formatted_address || null;
          if (address) {
            await db.query(
              `UPDATE truck SET last_address = ? WHERE wialon_unit_id = ? AND is_active = 1`,
              [address, unitId]
            );
          }
        } catch {
          // fail silently per unit
        }
      });
      void Promise.allSettled(geocodeJobs);
    }
  }

  let inserted = 0;
  // Cache zone polygons per resourceId — fetched once per sync cycle, reused across trucks
  const zonePolygonCache = new Map();
  for (const salesCost of salesCostsWithStops) {
    const stops = stopsBySalesCost.get(salesCost.id_sales_cost) || [];
    const unitId = normalizePositiveIntString(salesCost.wialon_unit_id);
    const position = positionMap.get(unitId) || null;
    const finishGeofence = resolveFinishGeofenceForSalesCost(
      salesCost,
      fallbackFinishGeofence,
      finishStopBySalesCost.get(salesCost.id_sales_cost) || null
    );

    if (!unitId) continue;

    // Fetch GPS messages for this truck. Start slightly before planned departure so
    // early geofence hits (truck arrives before scheduled departure) are still recorded.
    const EARLY_ARRIVAL_BUFFER_SEC = 12 * 60 * 60;
    const departureTs = Math.floor(new Date(salesCost.departure_datetime).getTime() / 1000);
    if (!Number.isFinite(departureTs) || departureTs <= 0) {
      console.warn(
        `[geofence-tracking] SC ${salesCost.id_sales_cost} skip: invalid departure_datetime`
      );
      continue;
    }
    const nowTs = Math.floor(Date.now() / 1000);
    const timeFrom = Math.max(0, departureTs - EARLY_ARRIVAL_BUFFER_SEC);

    let messages = [];
    try {
      messages = await fetchRawMessagesForUnit({
        sid,
        unitId,
        timeFrom,
        timeTo: nowTs
      });
    } catch (err) {
      console.warn(`[geofence-tracking] failed to fetch messages for unit ${unitId}:`, err.message);
      continue;
    }

    if (messages.length === 0) continue;

    // Build zone polygon map — fetch polygon data directly from Wialon geofence
    // (resourceMap only holds Set<zoneId>, NOT polygon data — previous implementation
    // was structurally broken and always produced an empty zonePolygonMap)
    const zonePolygonMap = new Map();
    const resourceIdsNeeded = new Set(
      stops.map((s) => normalizePositiveIntString(s.wialon_resource_id)).filter(Boolean)
    );
    if (finishGeofence?.resource_id) {
      const fr = normalizePositiveIntString(finishGeofence.resource_id);
      if (fr) resourceIdsNeeded.add(fr);
    }

    for (const rId of resourceIdsNeeded) {
      if (!zonePolygonCache.has(rId)) {
        try {
          const polygonData = await fetchZonePolygons(rId, sid);
          zonePolygonCache.set(rId, polygonData || new Map());
        } catch {
          zonePolygonCache.set(rId, new Map());
        }
      }

      const polygons = zonePolygonCache.get(rId);
      // fetchZonePolygons returns Map<zoneId, {name, points}> — not bare points[]
      for (const [zoneId, zoneData] of polygons) {
        const zId = normalizePositiveIntString(zoneId);
        const points = Array.isArray(zoneData?.points) ? zoneData.points : null;
        if (zId && points?.length >= 3) {
          zonePolygonMap.set(`${rId}:${zId}`, { points, resourceId: rId, zoneId: zId });
        }
      }
    }

    // Build chronological zone entry timeline from GPS messages
    const zoneTimeline = buildZoneEntryTimeline(messages, zonePolygonMap);

    // Sequential assign: seed from DB history so KIIC#2 never reuses KIIC#1 time
    const scHistoryRows = historyRowsBySc.get(salesCost.id_sales_cost) || [];
    const assignments = assignStopHits({
      stops,
      zoneTimeline,
      existingHistory: scHistoryRows
      // requirePreviousStopHit defaults to Opsi B (loose) via env/default
    });

    for (const { stop, entryTs } of assignments) {
      const stepKey = `stop:${stop.id}`;
      const historyKey = `${salesCost.id_sales_cost}:${stepKey}`;
      if (existingHistoryKeys.has(historyKey)) continue;

      const entryGpsTime = toMySqlDateTime(new Date(entryTs * 1000));
      const entryMsg = messages.find((m) => messageTsSeconds(m) === entryTs);

      await db.query(
        `INSERT INTO sales_cost_route_history (
            id_sales_cost, id_area, id_sc_stop, step_key, system_step_code,
            id_truck, step_order_snapshot, step_name_snapshot,
            wialon_resource_id, wialon_zone_id, wialon_zone_name,
            gps_time, lat, lon
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          salesCost.id_sales_cost,
          salesCost.id_area,
          stop.id,
          stepKey,
          null,
          salesCost.id_truck,
          stop.stop_order,
          stop.stop_name,
          stop.wialon_resource_id,
          stop.wialon_zone_id,
          stop.wialon_zone_name,
          entryGpsTime,
          entryMsg?.lat ?? position?.lat ?? null,
          entryMsg?.lon ?? position?.lon ?? null
        ]
      );

      existingHistoryKeys.add(historyKey);
      scHistoryRows.push({
        id_sc_stop: stop.id,
        step_key: stepKey,
        wialon_resource_id: stop.wialon_resource_id,
        wialon_zone_id: stop.wialon_zone_id,
        gps_ts: entryTs
      });
      inserted += 1;
    }

    // Process finish geofence — loose by default (skip middle stops OK).
    // Guard: only after departure + re-entry / leave trail (see resolveFinishGpsHit).
    const deliveryStops = stops.filter((s) => Number(s.is_departure) !== 1);
    const finishHistoryKey = `${salesCost.id_sales_cost}:${DEFAULT_FINISH_STEP_KEY}`;
    if (existingHistoryKeys.has(finishHistoryKey) || !finishGeofence) {
      continue;
    }

    const finishResourceId = normalizePositiveIntString(finishGeofence.resource_id);
    const finishZoneId = normalizePositiveIntString(finishGeofence.zone_id);
    if (!finishResourceId || !finishZoneId) continue;
    const finishZoneKey = `${finishResourceId}:${finishZoneId}`;
    const finishPoints = zonePolygonMap.get(finishZoneKey)?.points || null;
    const finishMembership =
      membershipByResource.get(finishResourceId)?.get(finishZoneId) || null;
    const membershipHasUnit = !!(finishMembership && finishMembership.has(unitId));

    const depStop = stops.find((s) => Number(s.is_departure) === 1);
    const depRes = normalizePositiveIntString(depStop?.wialon_resource_id);
    const depZ = normalizePositiveIntString(depStop?.wialon_zone_id);
    const departureZoneKey =
      depRes && depZ ? `${depRes}:${depZ}` : null;

    const finishHit = resolveFinishGpsHit({
      departureTs,
      historyRows: scHistoryRows,
      stops,
      zoneTimeline,
      finishZoneKey,
      departureZoneKey,
      messages,
      position,
      finishPoints,
      unitId,
      membershipHasUnit
    });
    if (!finishHit) continue;

    const finishGpsTime = toMySqlDateTime(new Date(finishHit.entryTs * 1000));

    await db.query(
      `INSERT INTO sales_cost_route_history (
          id_sales_cost, id_area, id_sc_stop, step_key, system_step_code,
          id_truck, step_order_snapshot, step_name_snapshot,
          wialon_resource_id, wialon_zone_id, wialon_zone_name,
          gps_time, lat, lon
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        salesCost.id_sales_cost,
        salesCost.id_area,
        null,
        DEFAULT_FINISH_STEP_KEY,
        DEFAULT_FINISH_STEP_CODE,
        salesCost.id_truck,
        deliveryStops.length + 1,
        "Finish Order",
        finishGeofence.resource_id,
        finishGeofence.zone_id,
        finishGeofence.zone_name,
        finishGpsTime,
        finishHit.lat,
        finishHit.lon
      ]
    );

    // Set finish_order_datetime only when empty — do not overwrite planned ETA
    await db.query(
      `UPDATE sales_cost
         SET finish_order_datetime = NOW()
       WHERE id_sales_cost = ?
         AND (finish_order_datetime IS NULL
              OR CAST(finish_order_datetime AS CHAR) = '0000-00-00 00:00:00')`,
      [salesCost.id_sales_cost]
    );

    existingHistoryKeys.add(finishHistoryKey);
    inserted += 1;
  }

  return {
    active: salesCostsWithStops.length,
    inserted
  };

  } catch (err) {
    console.error("[geofence-tracking] sync error:", err);
    throw err;
  } finally {
    await logoutIsolatedSession(sid);
  }
};

let lastPurgeAt = 0;
const PURGE_INTERVAL_MS = 60 * 60 * 1000; // run at most once per hour

const purgeOldDeliveryNotifications = async () => {
  const now = Date.now();
  if (now - lastPurgeAt < PURGE_INTERVAL_MS) return;
  lastPurgeAt = now;

  try {
    // Hard-delete delivery_notifications older than 30 days
    const [result] = await db.query(
      `DELETE FROM delivery_notifications
       WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    if (result.affectedRows > 0) {
      console.log(
        `[geofence-tracking] purged ${result.affectedRows} old delivery notification(s) (>30 days)`
      );
    }

    // Clean up orphaned delivery_notification_read rows
    await db.query(
      `DELETE dnr FROM delivery_notification_read dnr
       LEFT JOIN delivery_notifications dn ON dn.id = dnr.id_delivery_notification
       WHERE dn.id IS NULL`
    );
  } catch (err) {
    console.warn("[geofence-tracking] purge failed:", err.message);
  }
};

/**
 * Auto-hit stops for manual / no-GPS SPKs when NOW >= estimated_arrival.
 * Uses ETA as gps_time (is_manual=1). Completes with system:finish_order on finish stop.
 */
const applyDueManualEtaHits = async () => {
  const summary = { processed: 0, inserted: 0, finished: 0, errors: 0 };

  // Candidates: not finished, recent, and (flagged manual OR no wialon unit OR no stop zones)
  let candidates;
  try {
    const [rows] = await db.query(`
      SELECT sc.id_sales_cost, sc.id_area, sc.id_truck,
             sc.departure_datetime, sc.finish_order_datetime,
             sc.is_manual_mode,
             t.wialon_unit_id
      FROM sales_cost sc
      INNER JOIN truck t ON sc.id_truck = t.id_truck
      WHERE sc.id_truck IS NOT NULL
        AND sc.departure_datetime IS NOT NULL
        AND sc.departure_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND NOT EXISTS (
          SELECT 1 FROM sales_cost_route_history h
          WHERE h.id_sales_cost = sc.id_sales_cost
            AND h.step_key = 'system:finish_order'
        )
        AND (
          sc.is_manual_mode = 1
          OR t.wialon_unit_id IS NULL
          OR t.wialon_unit_id = ''
        )
      ORDER BY sc.id_sales_cost ASC
    `);
    candidates = rows;
  } catch (err) {
    // Fallback if is_manual_mode column missing on older DBs
    if (err && (err.code === "ER_BAD_FIELD_ERROR" || /is_manual_mode/i.test(err.message || ""))) {
      const [rows] = await db.query(`
        SELECT sc.id_sales_cost, sc.id_area, sc.id_truck,
               sc.departure_datetime, sc.finish_order_datetime,
               0 AS is_manual_mode,
               t.wialon_unit_id
        FROM sales_cost sc
        INNER JOIN truck t ON sc.id_truck = t.id_truck
        WHERE sc.id_truck IS NOT NULL
          AND sc.departure_datetime IS NOT NULL
          AND sc.departure_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          AND NOT EXISTS (
            SELECT 1 FROM sales_cost_route_history h
            WHERE h.id_sales_cost = sc.id_sales_cost
              AND h.step_key = 'system:finish_order'
          )
          AND (
            t.wialon_unit_id IS NULL
            OR t.wialon_unit_id = ''
          )
        ORDER BY sc.id_sales_cost ASC
      `);
      candidates = rows;
    } else {
      throw err;
    }
  }

  if (!candidates.length) return summary;

  const scIds = candidates.map((r) => Number(r.id_sales_cost));
  const placeholders = scIds.map(() => "?").join(",");

  const [allStops] = await db.query(
    `SELECT id, id_sales_cost, stop_order, stop_name,
            wialon_resource_id, wialon_zone_id, wialon_zone_name,
            is_departure, is_finish, estimated_arrival
     FROM sales_cost_step_schedule
     WHERE id_sales_cost IN (${placeholders})
     ORDER BY id_sales_cost ASC, stop_order ASC`,
    scIds
  );
  const stopsBySc = new Map();
  for (const row of allStops) {
    const id = Number(row.id_sales_cost);
    if (!stopsBySc.has(id)) stopsBySc.set(id, []);
    stopsBySc.get(id).push(row);
  }

  const [histRows] = await db.query(
    `SELECT id_sales_cost, id_sc_stop, step_key
     FROM sales_cost_route_history
     WHERE id_sales_cost IN (${placeholders})`,
    scIds
  );
  const histBySc = new Map();
  for (const row of histRows) {
    const id = Number(row.id_sales_cost);
    if (!histBySc.has(id)) histBySc.set(id, new Set());
    const key = row.step_key || (row.id_sc_stop ? `stop:${row.id_sc_stop}` : "");
    if (key) histBySc.get(id).add(key);
  }

  const now = new Date();
  const toMysqlLocal = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  for (const sc of candidates) {
    try {
      summary.processed += 1;
      const scId = Number(sc.id_sales_cost);
      const stops = stopsBySc.get(scId) || [];
      if (stops.length === 0) continue;

      const existing = histBySc.get(scId) || new Set();
      if (existing.has(DEFAULT_FINISH_STEP_KEY)) continue;

      // Only is_manual_mode or trucks without Wialon unit use ETA auto-hits (H4).
      // GPS trucks (even if zones empty) must use geofence tracking or admin complete-all.
      const unitId = String(sc.wialon_unit_id || "").trim();
      if (Number(sc.is_manual_mode) !== 1 && unitId) continue;

      for (const stop of stops) {
        const stepKey = `stop:${stop.id}`;
        if (existing.has(stepKey)) continue;
        if (!stop.estimated_arrival) continue;

        const eta = new Date(stop.estimated_arrival);
        if (Number.isNaN(eta.getTime()) || eta > now) {
          // Sequential: later stops wait until earlier ETA is due (or already hit)
          if (Number(stop.is_finish) !== 1) break;
          continue;
        }

        const gpsTime = toMysqlLocal(eta);
        await db.query(
          `INSERT IGNORE INTO sales_cost_route_history
            (id_sales_cost, id_area, id_sc_stop, step_key, system_step_code,
             id_truck, step_order_snapshot, step_name_snapshot,
             wialon_resource_id, wialon_zone_id, wialon_zone_name,
             gps_time, is_manual, lat, lon)
           VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 1, NULL, NULL)`,
          [
            scId,
            sc.id_area,
            stop.id,
            stepKey,
            sc.id_truck,
            stop.stop_order,
            stop.stop_name || "",
            stop.wialon_resource_id ? Number(stop.wialon_resource_id) : null,
            stop.wialon_zone_id ? Number(stop.wialon_zone_id) : null,
            stop.wialon_zone_name || null,
            gpsTime
          ]
        );
        existing.add(stepKey);
        summary.inserted += 1;

        if (Number(stop.is_finish) === 1) {
          if (!existing.has(DEFAULT_FINISH_STEP_KEY)) {
            await db.query(
              `INSERT IGNORE INTO sales_cost_route_history
                (id_sales_cost, id_area, id_sc_stop, step_key, system_step_code,
                 id_truck, step_order_snapshot, step_name_snapshot,
                 wialon_resource_id, wialon_zone_id, wialon_zone_name,
                 gps_time, is_manual, lat, lon)
               VALUES (?, ?, NULL, ?, ?, ?, ?, 'Finish Order', NULL, NULL, NULL, ?, 1, NULL, NULL)`,
              [
                scId,
                sc.id_area,
                DEFAULT_FINISH_STEP_KEY,
                DEFAULT_FINISH_STEP_CODE,
                sc.id_truck,
                Number(stop.stop_order) + 1,
                gpsTime
              ]
            );
            existing.add(DEFAULT_FINISH_STEP_KEY);
            summary.finished += 1;
          }
          // Do not overwrite planned finish_order_datetime if already set (ETA template)
          await db.query(
            `UPDATE sales_cost
               SET finish_order_datetime = ?
             WHERE id_sales_cost = ?
               AND (finish_order_datetime IS NULL
                    OR CAST(finish_order_datetime AS CHAR) = '0000-00-00 00:00:00')`,
            [gpsTime, scId]
          );
        }
      }

      // Finish ETA due but finish row may be is_finish=1 without separate history if no finish stop
      // Also: if finish stop has no estimated_arrival, use sc.finish_order_datetime
      if (!existing.has(DEFAULT_FINISH_STEP_KEY)) {
        const finishStop = stops.find((s) => Number(s.is_finish) === 1);
        const finishEtaRaw =
          finishStop?.estimated_arrival || sc.finish_order_datetime || null;
        if (finishEtaRaw) {
          const finishEta = new Date(finishEtaRaw);
          if (!Number.isNaN(finishEta.getTime()) && finishEta <= now) {
            // Ensure all prior non-finish stops that are due were processed; if any prior stop
            // has ETA in future, wait. If prior stop has no ETA, still allow finish when finish ETA due.
            const earlierBlocking = stops.some((s) => {
              if (Number(s.is_finish) === 1) return false;
              if (existing.has(`stop:${s.id}`)) return false;
              if (!s.estimated_arrival) return false;
              const e = new Date(s.estimated_arrival);
              return !Number.isNaN(e.getTime()) && e > now;
            });
            if (!earlierBlocking) {
              // Hit any remaining due non-finish stops first
              for (const stop of stops) {
                if (Number(stop.is_finish) === 1) continue;
                const stepKey = `stop:${stop.id}`;
                if (existing.has(stepKey)) continue;
                if (!stop.estimated_arrival) continue;
                const eta = new Date(stop.estimated_arrival);
                if (Number.isNaN(eta.getTime()) || eta > now) continue;
                const gpsTime = toMysqlLocal(eta);
                await db.query(
                  `INSERT IGNORE INTO sales_cost_route_history
                    (id_sales_cost, id_area, id_sc_stop, step_key, system_step_code,
                     id_truck, step_order_snapshot, step_name_snapshot,
                     wialon_resource_id, wialon_zone_id, wialon_zone_name,
                     gps_time, is_manual, lat, lon)
                   VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 1, NULL, NULL)`,
                  [
                    scId,
                    sc.id_area,
                    stop.id,
                    stepKey,
                    sc.id_truck,
                    stop.stop_order,
                    stop.stop_name || "",
                    stop.wialon_resource_id ? Number(stop.wialon_resource_id) : null,
                    stop.wialon_zone_id ? Number(stop.wialon_zone_id) : null,
                    stop.wialon_zone_name || null,
                    gpsTime
                  ]
                );
                existing.add(stepKey);
                summary.inserted += 1;
              }

              const gpsTime = toMysqlLocal(finishEta);
              if (finishStop && !existing.has(`stop:${finishStop.id}`)) {
                await db.query(
                  `INSERT IGNORE INTO sales_cost_route_history
                    (id_sales_cost, id_area, id_sc_stop, step_key, system_step_code,
                     id_truck, step_order_snapshot, step_name_snapshot,
                     wialon_resource_id, wialon_zone_id, wialon_zone_name,
                     gps_time, is_manual, lat, lon)
                   VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 1, NULL, NULL)`,
                  [
                    scId,
                    sc.id_area,
                    finishStop.id,
                    `stop:${finishStop.id}`,
                    sc.id_truck,
                    finishStop.stop_order,
                    finishStop.stop_name || "Finish",
                    finishStop.wialon_resource_id ? Number(finishStop.wialon_resource_id) : null,
                    finishStop.wialon_zone_id ? Number(finishStop.wialon_zone_id) : null,
                    finishStop.wialon_zone_name || null,
                    gpsTime
                  ]
                );
                existing.add(`stop:${finishStop.id}`);
                summary.inserted += 1;
              }

              await db.query(
                `INSERT IGNORE INTO sales_cost_route_history
                  (id_sales_cost, id_area, id_sc_stop, step_key, system_step_code,
                   id_truck, step_order_snapshot, step_name_snapshot,
                   wialon_resource_id, wialon_zone_id, wialon_zone_name,
                   gps_time, is_manual, lat, lon)
                 VALUES (?, ?, NULL, ?, ?, ?, ?, 'Finish Order', NULL, NULL, NULL, ?, 1, NULL, NULL)`,
                [
                  scId,
                  sc.id_area,
                  DEFAULT_FINISH_STEP_KEY,
                  DEFAULT_FINISH_STEP_CODE,
                  sc.id_truck,
                  (finishStop ? Number(finishStop.stop_order) : 99) + 1,
                  gpsTime
                ]
              );
              existing.add(DEFAULT_FINISH_STEP_KEY);
              summary.finished += 1;
              summary.inserted += 1;
            }
          }
        }
      }
    } catch (err) {
      summary.errors += 1;
      console.warn(
        `[manual-eta] SC ${sc.id_sales_cost} error:`,
        err.message
      );
    }
  }

  if (summary.inserted > 0 || summary.finished > 0) {
    console.log(
      `[manual-eta] processed:${summary.processed} inserted:${summary.inserted} finished:${summary.finished} errors:${summary.errors}`
    );
  }
  return summary;
};

/**
 * Auto-finish active SPKs past distance-based age since planned departure.
 * ≤60km → 3d, ≤100km → 7d, >100km → 10d; no distance → fallback 3d.
 * Dry-run: GEOFENCE_AGE_FINISH_DRY_RUN=1 logs only.
 */
const applyDueDistanceAgeFinish = async () => {
  const summary = {
    processed: 0,
    finished: 0,
    would_finish: 0,
    skipped: 0,
    errors: 0,
    dry_run: AGE_FINISH_DRY_RUN
  };

  const lookback = AGE_FINISH_LOOKBACK_DAYS;
  const minDays = Math.min(
    AGE_FINISH_DAYS_SHORT,
    AGE_FINISH_DAYS_MID,
    AGE_FINISH_DAYS_LONG,
    AGE_FINISH_DAYS_FALLBACK
  );

  let candidates;
  try {
    const [rows] = await db.query(
      `
      SELECT sc.id_sales_cost, sc.id_area, sc.id_truck, sc.departure_datetime
      FROM sales_cost sc
      INNER JOIN truck t ON sc.id_truck = t.id_truck
      WHERE sc.id_truck IS NOT NULL
        AND sc.departure_datetime IS NOT NULL
        AND sc.departure_datetime <= NOW()
        AND sc.departure_datetime >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND sc.departure_datetime <= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND NOT EXISTS (
          SELECT 1 FROM sales_cost_route_history h
          WHERE h.id_sales_cost = sc.id_sales_cost
            AND h.step_key = 'system:finish_order'
        )
      ORDER BY sc.departure_datetime ASC, sc.id_sales_cost ASC
      `,
      [lookback, minDays]
    );
    candidates = rows;
  } catch (err) {
    console.warn("[age-finish] candidate query failed:", err.message);
    return summary;
  }

  if (!candidates || candidates.length === 0) {
    return summary;
  }

  const scIds = candidates.map((r) => Number(r.id_sales_cost));
  const placeholders = scIds.map(() => "?").join(",");
  const [stopRows] = await db.query(
    `
    SELECT id, id_sales_cost, stop_order, stop_name,
           wialon_resource_id, wialon_zone_id, wialon_zone_name,
           is_departure, is_finish
    FROM sales_cost_step_schedule
    WHERE id_sales_cost IN (${placeholders})
    ORDER BY id_sales_cost ASC, stop_order ASC, id ASC
    `,
    scIds
  );

  const stopsBySc = new Map();
  const resourceIds = new Set();
  for (const row of stopRows) {
    const scId = Number(row.id_sales_cost);
    if (!stopsBySc.has(scId)) stopsBySc.set(scId, []);
    stopsBySc.get(scId).push(row);
    const rId = normalizePositiveIntString(row.wialon_resource_id);
    if (rId) resourceIds.add(rId);
  }

  let sid = null;
  const zonePolygonMap = new Map();
  try {
    if (resourceIds.size > 0) {
      try {
        sid = await loginIsolatedSession();
        for (const rId of resourceIds) {
          try {
            const polygonData = await fetchZonePolygons(rId, sid);
            for (const [zId, data] of polygonData.entries()) {
              const points = data?.points || data;
              if (!Array.isArray(points) || points.length < 3) continue;
              zonePolygonMap.set(`${rId}:${normalizePositiveIntString(zId)}`, {
                points,
                resourceId: rId,
                zoneId: normalizePositiveIntString(zId)
              });
            }
          } catch (polyErr) {
            console.warn(
              `[age-finish] polygon fetch failed resource ${rId}:`,
              polyErr.message
            );
          }
        }
      } catch (loginErr) {
        console.warn(
          "[age-finish] Wialon login failed, using distance fallback:",
          loginErr.message
        );
      }
    }

    const nowTs = Math.floor(Date.now() / 1000);
    const nowGps = toMySqlDateTime(new Date());

    for (const sc of candidates) {
      const scId = Number(sc.id_sales_cost);
      summary.processed += 1;
      try {
        const depMs = new Date(sc.departure_datetime).getTime();
        const departureTs = Number.isFinite(depMs) ? Math.floor(depMs / 1000) : 0;
        if (departureTs <= 0) {
          summary.skipped += 1;
          continue;
        }

        const stops = stopsBySc.get(scId) || [];
        const distanceKm = computeTripDistanceKm({ stops, zonePolygonMap });
        const check = isDueForAgeFinish({
          departureTs,
          distanceKm,
          nowTs
        });

        if (!check.due) {
          summary.skipped += 1;
          continue;
        }

        const logPayload = {
          id_sales_cost: scId,
          distance_km: check.distanceKm,
          days: check.days,
          deadline: new Date(check.deadlineTs * 1000).toISOString(),
          departure: sc.departure_datetime
        };

        if (AGE_FINISH_DRY_RUN) {
          summary.would_finish += 1;
          console.log("[age-finish] DRY_RUN would finish", logPayload);
          continue;
        }

        const deliveryStops = stops.filter((s) => Number(s.is_departure) !== 1);
        await db.query(
          `INSERT IGNORE INTO sales_cost_route_history (
              id_sales_cost, id_area, id_sc_stop, step_key, system_step_code,
              id_truck, step_order_snapshot, step_name_snapshot,
              wialon_resource_id, wialon_zone_id, wialon_zone_name,
              gps_time, is_manual, lat, lon
            ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, 1, NULL, NULL)`,
          [
            scId,
            sc.id_area,
            DEFAULT_FINISH_STEP_KEY,
            DEFAULT_FINISH_STEP_CODE,
            sc.id_truck,
            deliveryStops.length + 1,
            AGE_FINISH_STEP_NAME,
            nowGps
          ]
        );

        await db.query(
          `UPDATE sales_cost
              SET finish_order_datetime = NOW()
            WHERE id_sales_cost = ?
              AND (finish_order_datetime IS NULL
                   OR CAST(finish_order_datetime AS CHAR) = '0000-00-00 00:00:00')`,
          [scId]
        );

        summary.finished += 1;
        console.log("[age-finish] finished", logPayload);
      } catch (err) {
        summary.errors += 1;
        console.warn(`[age-finish] SC ${scId} error:`, err.message);
      }
    }
  } finally {
    if (sid) {
      try {
        await logoutIsolatedSession(sid);
      } catch {
        /* ignore */
      }
    }
  }

  if (
    summary.finished > 0 ||
    summary.would_finish > 0 ||
    summary.errors > 0
  ) {
    console.log(
      `[age-finish] processed:${summary.processed} finished:${summary.finished} would_finish:${summary.would_finish} skipped:${summary.skipped} errors:${summary.errors} dry_run:${summary.dry_run}`
    );
  }
  return summary;
};

const runSyncCycle = async () => {
  if (syncInProgress) {
    return;
  }

  syncInProgress = true;
  try {
    const summary = await syncGeofenceRouteHistory();
    if (summary.inserted > 0) {
      console.log(
        `[geofence-tracking] inserted ${summary.inserted} route history row(s) for ${summary.active} active sales cost(s)`
      );
    }
    try {
      await applyDueManualEtaHits();
    } catch (manualErr) {
      console.warn("[manual-eta] sync failed", manualErr);
    }
    try {
      await applyDueDistanceAgeFinish();
    } catch (ageErr) {
      console.warn("[age-finish] sync failed", ageErr);
    }
    await checkArrivalDelays();
    await purgeOldDeliveryNotifications();
  } catch (error) {
    console.warn("[geofence-tracking] sync failed", error);
  } finally {
    syncInProgress = false;
  }
};

const startGeofenceTracking = () => {
  if (started) {
    return;
  }

  started = true;
  void runSyncCycle();
  intervalHandle = setInterval(() => {
    void runSyncCycle();
  }, TRACKING_INTERVAL_MS);
  console.log(
    `[geofence-tracking] started with interval ${TRACKING_INTERVAL_MS} ms`
  );
};

const stopGeofenceTracking = async (timeoutMs = 5000) => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  started = false;

  // Wait for any in-progress sync cycle to finish before returning
  if (syncInProgress) {
    const deadline = Date.now() + timeoutMs;
    while (syncInProgress && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (syncInProgress) {
      console.warn("[geofence-tracking] stop timeout — cycle still running after", timeoutMs, "ms");
    }
  }
};


// ============================================================
// HISTORICAL BACKFILL
// ============================================================

const BACKFILL_MAX_GAP_MS = 7 * 24 * 60 * 60 * 1000;
const BACKFILL_MIN_GAP_MS = 5 * 60 * 1000;

const runBackfill = async (fromTs, toTs) => {
  const summary = { processed: 0, inserted: 0, skipped: 0, errors: 0 };
  const startedAt = Date.now();
  console.log(`[geofence-backfill] starting from ${new Date(fromTs * 1000).toISOString()} to ${new Date(toTs * 1000).toISOString()}`);

  const [salesCosts] = await db.query(`
    SELECT sc.id_sales_cost, sc.id_area, sc.id_truck,
           sc.departure_datetime, sc.finish_order_datetime,
           t.wialon_unit_id,
           a.finish_geofence_resource_id, a.finish_geofence_zone_id, a.finish_geofence_zone_name
    FROM sales_cost sc
    INNER JOIN truck t ON sc.id_truck = t.id_truck
    INNER JOIN area a ON sc.id_area = a.id_area
    WHERE sc.id_truck IS NOT NULL
      AND t.wialon_unit_id IS NOT NULL AND t.wialon_unit_id <> ''
      AND t.is_active = 1
      AND sc.departure_datetime IS NOT NULL
      AND UNIX_TIMESTAMP(sc.departure_datetime) <= ?
      AND (sc.finish_order_datetime IS NULL OR UNIX_TIMESTAMP(sc.finish_order_datetime) >= ?)
    ORDER BY sc.id_sales_cost ASC
  `, [toTs, fromTs]);

  if (salesCosts.length === 0) {
    console.log('[geofence-backfill] no active sales costs in window');
    return summary;
  }
  console.log(`[geofence-backfill] ${salesCosts.length} sales cost(s) to process`);

  const salesCostIds = salesCosts.map(sc => Number(sc.id_sales_cost));
  const placeholders = salesCostIds.map(() => '?').join(',');
  const [existingRows] = await db.query(
    `SELECT id_sales_cost, id_sc_stop, step_key FROM sales_cost_route_history WHERE id_sales_cost IN (${placeholders})`,
    salesCostIds
  );
  const existingKeys = new Set(
    existingRows.map(r => {
      const key = r.step_key || (r.id_sc_stop ? `stop:${r.id_sc_stop}` : '');
      return `${r.id_sales_cost}:${key}`;
    }).filter(k => k !== ':')
  );

  // Fetch all scss stops for the sales costs in the window
  const [allStopsRows] = await db.query(
    `SELECT id, id_sales_cost, stop_order, stop_name,
            wialon_resource_id, wialon_zone_id, wialon_zone_name,
            is_departure, is_finish
     FROM sales_cost_step_schedule
     WHERE id_sales_cost IN (${placeholders}) AND is_finish = 0
     ORDER BY id_sales_cost ASC, stop_order ASC`,
    salesCostIds
  );
  const stopsBySalesCost = new Map();
  for (const row of allStopsRows) {
    const scId = Number(row.id_sales_cost);
    if (!stopsBySalesCost.has(scId)) stopsBySalesCost.set(scId, []);
    stopsBySalesCost.get(scId).push(row);
  }

  const [finishStopRows] = await db.query(
    `SELECT id, id_sales_cost, stop_order, stop_name,
            wialon_resource_id, wialon_zone_id, wialon_zone_name,
            is_departure, is_finish
     FROM sales_cost_step_schedule
     WHERE id_sales_cost IN (${placeholders}) AND is_finish = 1
     ORDER BY id_sales_cost ASC, stop_order ASC`,
    salesCostIds
  );
  const finishStopBySalesCost = new Map();
  for (const row of finishStopRows) {
    const scId = Number(row.id_sales_cost);
    if (!finishStopBySalesCost.has(scId)) finishStopBySalesCost.set(scId, row);
  }

  // Full history for sequential seed (zone consume + monotonic clock)
  const [histTimeRows] = await db.query(
    `SELECT id_sales_cost, id_sc_stop, step_key,
            wialon_resource_id, wialon_zone_id,
            UNIX_TIMESTAMP(gps_time) AS gps_ts, gps_time
     FROM sales_cost_route_history
     WHERE id_sales_cost IN (${placeholders})
       AND gps_time IS NOT NULL
       AND CAST(gps_time AS CHAR) <> '0000-00-00 00:00:00'`,
    salesCostIds
  );
  const historyRowsByScBackfill = new Map();
  for (const row of histTimeRows) {
    const scId = Number(row.id_sales_cost);
    if (!historyRowsByScBackfill.has(scId)) historyRowsByScBackfill.set(scId, []);
    historyRowsByScBackfill.get(scId).push(row);
  }

  const zonePolygonCache = new Map();
  const getZonePolygonsForResource = async (resourceId, sid) => {
    const cKey = String(resourceId);
    if (!zonePolygonCache.has(cKey)) {
      zonePolygonCache.set(cKey, await fetchZonePolygons(resourceId, sid));
    }
    return zonePolygonCache.get(cKey) || new Map();
  };

  let sid = null;
  let fallbackFinishGeofence = null;
  try {
    sid = await loginIsolatedSession();
    fallbackFinishGeofence = await findDefaultFinishGeofence();
  } catch (err) {
    console.warn('[geofence-backfill] cannot create Wialon session:', err.message);
    return summary;
  }

  try {
    for (const sc of salesCosts) {
      try {
        summary.processed += 1;
        const unitId = String(sc.wialon_unit_id || '').trim();
        if (!unitId) { summary.skipped += 1; continue; }

        const stops = stopsBySalesCost.get(Number(sc.id_sales_cost)) || [];
        if (stops.length === 0) { summary.skipped += 1; continue; }

        // Allow up to 12h before planned departure so early GPS hits still backfill.
        // Do NOT cap by finish_order_datetime — that column is often planned ETA, not actual end.
        const EARLY_ARRIVAL_BUFFER_SEC = 12 * 60 * 60;
        const departureTs = Math.floor(new Date(sc.departure_datetime).getTime() / 1000);
        const scFrom = Math.max(fromTs, Math.max(0, departureTs - EARLY_ARRIVAL_BUFFER_SEC));
        const scTo = toTs;
        if (scFrom >= scTo) { summary.skipped += 1; continue; }

        const messages = await fetchRawMessagesForUnit({ sid, unitId, timeFrom: scFrom, timeTo: scTo });
        if (messages.length === 0) { summary.skipped += 1; continue; }

        // Build polygon map for all stop (+ finish) zones — same as live sync
        const zonePolygonMap = new Map();
        const resourceIdsNeeded = new Set(
          stops.map((s) => normalizePositiveIntString(s.wialon_resource_id)).filter(Boolean)
        );
        const scIdNum = Number(sc.id_sales_cost);
        const finishGeofencePreview = resolveFinishGeofenceForSalesCost(
          sc,
          fallbackFinishGeofence,
          finishStopBySalesCost.get(scIdNum) || null
        );
        if (finishGeofencePreview?.resource_id) {
          const fr = normalizePositiveIntString(finishGeofencePreview.resource_id);
          if (fr) resourceIdsNeeded.add(fr);
        }
        for (const rId of resourceIdsNeeded) {
          const polygons = await getZonePolygonsForResource(rId, sid);
          for (const [zoneId, zoneData] of polygons) {
            const zId = normalizePositiveIntString(zoneId);
            const points = Array.isArray(zoneData?.points) ? zoneData.points : null;
            if (zId && points?.length >= 3) {
              zonePolygonMap.set(`${rId}:${zId}`, { points, resourceId: rId, zoneId: zId });
            }
          }
        }

        const zoneTimeline = buildZoneEntryTimeline(messages, zonePolygonMap);
        const scHistory = historyRowsByScBackfill.get(scIdNum) || [];
        const assignments = assignStopHits({
          stops,
          zoneTimeline,
          existingHistory: scHistory
          // requirePreviousStopHit defaults to Opsi B (loose) via env/default
        });

        for (const { stop, entryTs } of assignments) {
          const stepKey = `stop:${stop.id}`;
          if (existingKeys.has(`${sc.id_sales_cost}:${stepKey}`)) continue;
          const entryMsg = messages.find((m) => messageTsSeconds(m) === entryTs);
          const gpsTime = toMySqlDateTime(new Date(entryTs * 1000));
          await db.query(`
            INSERT IGNORE INTO sales_cost_route_history
              (id_sales_cost, id_area, id_sc_stop, step_key, system_step_code,
               id_truck, step_order_snapshot, step_name_snapshot,
               wialon_resource_id, wialon_zone_id, wialon_zone_name, gps_time, recorded_at, lat, lon)
            VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
          `, [sc.id_sales_cost, sc.id_area, stop.id, stepKey,
             sc.id_truck, stop.stop_order, stop.stop_name,
             stop.wialon_resource_id, stop.wialon_zone_id, stop.wialon_zone_name,
             gpsTime, entryMsg?.lat ?? null, entryMsg?.lon ?? null]);
          existingKeys.add(`${sc.id_sales_cost}:${stepKey}`);
          scHistory.push({
            id_sc_stop: stop.id,
            step_key: stepKey,
            wialon_resource_id: stop.wialon_resource_id,
            wialon_zone_id: stop.wialon_zone_id,
            gps_ts: entryTs
          });
          summary.inserted += 1;
        }
        historyRowsByScBackfill.set(scIdNum, scHistory);

        // Loose finish: GPS finish geofence completes SPK even if middle stops skipped
        const deliveryStops = stops.filter((s) => Number(s.is_departure) !== 1);
        const finishKey = DEFAULT_FINISH_STEP_KEY;
        if (!existingKeys.has(`${sc.id_sales_cost}:${finishKey}`)) {
          const finishGeofence = finishGeofencePreview;
          const fResId = normalizePositiveIntString(finishGeofence?.resource_id);
          const fZId = normalizePositiveIntString(finishGeofence?.zone_id);
          if (fResId && fZId) {
            const fZoneKey = `${fResId}:${fZId}`;
            const fPoints = zonePolygonMap.get(fZoneKey)?.points || null;
            const depStop = stops.find((s) => Number(s.is_departure) === 1);
            const depRes = normalizePositiveIntString(depStop?.wialon_resource_id);
            const depZ = normalizePositiveIntString(depStop?.wialon_zone_id);
            const departureZoneKey =
              depRes && depZ ? `${depRes}:${depZ}` : null;
            const finishHit = resolveFinishGpsHit({
              departureTs,
              historyRows: scHistory,
              stops,
              zoneTimeline,
              finishZoneKey: fZoneKey,
              departureZoneKey,
              messages,
              position: null,
              finishPoints: fPoints,
              membershipHasUnit: false
            });
            if (finishHit) {
              const gpsTime = toMySqlDateTime(new Date(finishHit.entryTs * 1000));
              await db.query(`
                INSERT IGNORE INTO sales_cost_route_history
                  (id_sales_cost, id_area, id_sc_stop, step_key, system_step_code,
                   id_truck, step_order_snapshot, step_name_snapshot,
                   wialon_resource_id, wialon_zone_id, wialon_zone_name, gps_time, recorded_at, lat, lon)
                VALUES (?, ?, NULL, ?, ?, ?, ?, 'Finish Order', ?, ?, ?, ?, NOW(), ?, ?)
              `, [sc.id_sales_cost, sc.id_area, finishKey, DEFAULT_FINISH_STEP_CODE,
                 sc.id_truck, deliveryStops.length + 1,
                 finishGeofence.resource_id, finishGeofence.zone_id, finishGeofence.zone_name,
                 gpsTime, finishHit.lat, finishHit.lon]);
              existingKeys.add(`${sc.id_sales_cost}:${finishKey}`);
              summary.inserted += 1;
            }
          }
        }
      } catch (err) {
        console.warn(`[geofence-backfill] SC ${sc.id_sales_cost} error:`, err.message);
        summary.errors += 1;
      }
    }
  } finally {
    if (sid) await logoutIsolatedSession(sid);
  }

  const dur = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`[geofence-backfill] done in ${dur}s — processed:${summary.processed} inserted:${summary.inserted} skipped:${summary.skipped} errors:${summary.errors}`);
  return summary;
};

const detectAndRunStartupBackfill = async () => {
  try {
    const [rows] = await db.query('SELECT MAX(recorded_at) AS last_recorded FROM sales_cost_route_history');
    const lastRecorded = rows[0]?.last_recorded;
    const nowMs = Date.now();
    const nowTs = Math.floor(nowMs / 1000);
    let fromTs;
    if (!lastRecorded) {
      fromTs = Math.floor((nowMs - BACKFILL_MAX_GAP_MS) / 1000);
      console.log('[geofence-backfill] no history found, backfilling last 7 days');
    } else {
      const lastMs = new Date(lastRecorded).getTime();
      const gapMs = nowMs - lastMs;
      if (gapMs < BACKFILL_MIN_GAP_MS) {
        console.log(`[geofence-backfill] gap ${Math.round(gapMs / 1000)}s too small, skipping`);
        return;
      }
      fromTs = gapMs > BACKFILL_MAX_GAP_MS
        ? Math.floor((nowMs - BACKFILL_MAX_GAP_MS) / 1000)
        : Math.floor(lastMs / 1000);
      console.log(`[geofence-backfill] gap ${Math.round(gapMs / 60000)}min detected, running startup backfill`);
    }
    await runBackfill(fromTs, nowTs);
  } catch (err) {
    console.warn('[geofence-backfill] startup backfill failed:', err.message);
  }
};

module.exports = {
  startGeofenceTracking,
  stopGeofenceTracking,
  syncGeofenceRouteHistory,
  checkArrivalDelays,
  runBackfill,
  detectAndRunStartupBackfill,
  applyDueManualEtaHits,
  applyDueDistanceAgeFinish,
  // Pure helpers exported for unit tests
  buildZoneEntryTimeline,
  seedConsumptionFromHistory,
  assignStopHits,
  resolveFinishGpsHit,
  analyzeBaseExit,
  computeTripDistanceKm,
  resolveAgeFinishDays,
  isDueForAgeFinish,
  haversineMeters,
  polygonCentroid
};
