const db = require("../db");

const DEFAULT_BASE_URL =
  process.env.WIALON_BASE_URL || "https://hst-api.wialon.com/wialon/ajax.html";
const DEFAULT_TOKEN = String(process.env.WIALON_TOKEN || "").trim();
const DEFAULT_LOGIN_FLAGS = Number.parseInt(
  process.env.WIALON_LOGIN_FLAGS || "13",
  10
);
const DEFAULT_SESSION_TTL_MS = Number.parseInt(
  process.env.WIALON_SESSION_TTL_MS || `${45 * 60 * 1000}`,
  10
);
const DEFAULT_REQUEST_TIMEOUT_MS = Number.parseInt(
  process.env.WIALON_TIMEOUT_MS || "20000",
  10
);
const DEFAULT_GEOAPIFY_BASE_URL =
  process.env.GEOAPIFY_BASE_URL || "https://api.geoapify.com/v1/geocode/reverse";
const DEFAULT_GEOAPIFY_API_KEY = String(process.env.GEOAPIFY_API_KEY || "").trim();
const DEFAULT_GEOAPIFY_TIMEOUT_MS = Number.parseInt(
  process.env.GEOAPIFY_TIMEOUT_MS || "6000",
  10
);
const DEFAULT_REVERSE_GEOCODE_CACHE_TTL_MS = Number.parseInt(
  process.env.REVERSE_GEOCODE_CACHE_TTL_MS || `${24 * 60 * 60 * 1000}`,
  10
);
const DEFAULT_MONTHLY_DISTANCE_CACHE_TTL_MS = Number.parseInt(
  process.env.WIALON_MONTHLY_DISTANCE_CACHE_TTL_MS || `${10 * 60 * 1000}`,
  10
);
const DEFAULT_MONTHLY_DISTANCE_WORKER_COUNT = Number.parseInt(
  process.env.WIALON_MONTHLY_DISTANCE_WORKER_COUNT || "4",
  10
);

const SESSION_TTL_MS = Number.isFinite(DEFAULT_SESSION_TTL_MS)
  ? DEFAULT_SESSION_TTL_MS
  : 45 * 60 * 1000;
const REQUEST_TIMEOUT_MS = Number.isFinite(DEFAULT_REQUEST_TIMEOUT_MS)
  ? DEFAULT_REQUEST_TIMEOUT_MS
  : 20000;
const LOGIN_FLAGS = Number.isFinite(DEFAULT_LOGIN_FLAGS) ? DEFAULT_LOGIN_FLAGS : 13;
const GEOAPIFY_TIMEOUT_MS = Number.isFinite(DEFAULT_GEOAPIFY_TIMEOUT_MS)
  ? DEFAULT_GEOAPIFY_TIMEOUT_MS
  : 6000;
const REVERSE_GEOCODE_CACHE_TTL_MS = Number.isFinite(
  DEFAULT_REVERSE_GEOCODE_CACHE_TTL_MS
)
  ? DEFAULT_REVERSE_GEOCODE_CACHE_TTL_MS
  : 24 * 60 * 60 * 1000;
const MONTHLY_DISTANCE_CACHE_TTL_MS = Number.isFinite(
  DEFAULT_MONTHLY_DISTANCE_CACHE_TTL_MS
)
  ? DEFAULT_MONTHLY_DISTANCE_CACHE_TTL_MS
  : 10 * 60 * 1000;
const MONTHLY_DISTANCE_WORKER_COUNT = Number.isFinite(
  DEFAULT_MONTHLY_DISTANCE_WORKER_COUNT
)
  ? Math.max(1, DEFAULT_MONTHLY_DISTANCE_WORKER_COUNT)
  : 4;

class WialonError extends Error {
  constructor(message, code, payload) {
    super(message);
    this.name = "WialonError";
    this.code = code;
    this.payload = payload;
  }
}

const sessionState = {
  sid: null,
  expiresAt: 0,
  loginPromise: null
};
const reverseGeocodeCache = new Map();
const monthlyDistanceCache = new Map();

const parseJsonSafely = (value) => {
  if (!value) {
    return null;
  }
  if (typeof value === "object") {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const isFiniteNumber = (value) => Number.isFinite(Number(value));

const toNumber = (value) => {
  if (!isFiniteNumber(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toPositiveIntString = (value) => {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return String(parsed);
};

const pad2 = (value) => String(value).padStart(2, "0");

const ensureFiniteCoordinate = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildReverseGeocodeCacheKey = (lat, lon) => {
  const safeLat = ensureFiniteCoordinate(lat);
  const safeLon = ensureFiniteCoordinate(lon);
  if (safeLat === null || safeLon === null) {
    return null;
  }

  return `${safeLat.toFixed(5)},${safeLon.toFixed(5)}`;
};

// Cache remains valid only while its age is still inside the configured TTL.
const isReverseGeocodeCacheValid = (entry) => {
  if (!entry || !Number.isFinite(entry.cachedAt)) {
    return false;
  }

  return Date.now() - Number(entry.cachedAt) < REVERSE_GEOCODE_CACHE_TTL_MS;
};

const getCachedReverseGeocode = (cacheKey) => {
  if (!cacheKey) {
    return null;
  }

  const entry = reverseGeocodeCache.get(cacheKey);
  if (!entry) {
    return null;
  }

  if (!isReverseGeocodeCacheValid(entry)) {
    reverseGeocodeCache.delete(cacheKey);
    return null;
  }

  return entry.value;
};

const setCachedReverseGeocode = (cacheKey, payload) => {
  if (!cacheKey) {
    return;
  }

  reverseGeocodeCache.set(cacheKey, {
    value: payload,
    cachedAt: Date.now()
  });

  if (reverseGeocodeCache.size > 1000) {
    const oldestKey = reverseGeocodeCache.keys().next().value;
    if (oldestKey) {
      reverseGeocodeCache.delete(oldestKey);
    }
  }
};

const getMonthlyDistanceCacheEntry = (cacheKey) => {
  if (!cacheKey) {
    return null;
  }

  const entry = monthlyDistanceCache.get(cacheKey);
  if (!entry) {
    return null;
  }

  if (!Number.isFinite(entry.cachedAt)) {
    monthlyDistanceCache.delete(cacheKey);
    return null;
  }

  if (Date.now() - Number(entry.cachedAt) >= MONTHLY_DISTANCE_CACHE_TTL_MS) {
    monthlyDistanceCache.delete(cacheKey);
    return null;
  }

  return entry.value;
};

const setMonthlyDistanceCacheEntry = (cacheKey, payload) => {
  if (!cacheKey) {
    return;
  }

  monthlyDistanceCache.set(cacheKey, {
    value: payload,
    cachedAt: Date.now()
  });

  if (monthlyDistanceCache.size > 24) {
    const oldestKey = monthlyDistanceCache.keys().next().value;
    if (oldestKey) {
      monthlyDistanceCache.delete(oldestKey);
    }
  }
};

const normalizeMatchKey = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const extractUnitId = (item) => {
  const unitId = toPositiveIntString(
    item?.id ?? item?.i ?? item?.itemId ?? item?.sys_id
  );
  return unitId;
};

const extractUnitName = (item) =>
  String(item?.nm ?? item?.n ?? item?.name ?? item?.sys_name ?? "").trim();

const extractResourceId = (item) => {
  const resourceId = toPositiveIntString(
    item?.id ?? item?.i ?? item?.itemId ?? item?.sys_id
  );
  return resourceId;
};

const extractResourceName = (item) =>
  String(item?.nm ?? item?.n ?? item?.name ?? item?.sys_name ?? "").trim();

const toIsoDate = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    const millis = numeric > 1e12 ? numeric : numeric > 1e10 ? numeric : numeric * 1000;
    const date = new Date(millis);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const getRequestUrl = (svc, params, sid) => {
  const url = new URL(DEFAULT_BASE_URL);
  url.searchParams.set("svc", svc);
  url.searchParams.set("params", JSON.stringify(params || {}));
  if (sid) {
    url.searchParams.set("sid", sid);
  }
  return url;
};

const requestWialon = async (svc, params, sid) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(getRequestUrl(svc, params, sid), {
      method: "GET",
      signal: controller.signal
    });
    const rawText = await response.text();
    const payload = parseJsonSafely(rawText);

    if (!response.ok) {
      throw new WialonError(
        `Wialon request failed with status ${response.status}`,
        response.status,
        payload
      );
    }

    if (typeof payload === "number") {
      if (payload !== 0) {
        throw new WialonError(`Wialon returned error ${payload}`, payload, payload);
      }
      return payload;
    }

    if (
      payload &&
      typeof payload === "object" &&
      Object.prototype.hasOwnProperty.call(payload, "error") &&
      payload.error !== undefined &&
      payload.error !== null &&
      Number(payload.error) !== 0
    ) {
      throw new WialonError(
        `Wialon returned error ${payload.error}`,
        Number(payload.error),
        payload
      );
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
};

const clearSession = () => {
  sessionState.sid = null;
  sessionState.expiresAt = 0;
};

const loginWithToken = async () => {
  if (!DEFAULT_TOKEN) {
    throw new Error("WIALON_TOKEN belum dikonfigurasi");
  }

  const payload = await requestWialon("token/login", {
    token: DEFAULT_TOKEN,
    fl: LOGIN_FLAGS
  });

  if (!payload || typeof payload !== "object" || !payload.eid) {
    throw new Error("Wialon login gagal: session id tidak ditemukan");
  }

  sessionState.sid = String(payload.eid);
  sessionState.expiresAt = Date.now() + SESSION_TTL_MS;
  return sessionState.sid;
};

const loginIsolatedSession = async () => {
  if (!DEFAULT_TOKEN) {
    throw new Error("WIALON_TOKEN belum dikonfigurasi");
  }

  const payload = await requestWialon("token/login", {
    token: DEFAULT_TOKEN,
    fl: LOGIN_FLAGS
  });

  if (!payload || typeof payload !== "object" || !payload.eid) {
    throw new Error("Wialon login gagal: session id tidak ditemukan");
  }

  return String(payload.eid);
};

const logoutIsolatedSession = async (sid) => {
  if (!sid) {
    return;
  }

  try {
    await requestWialon("core/logout", {}, sid);
  } catch {
    // ignore isolated session cleanup failures
  }
};

const getSessionId = async () => {
  if (sessionState.sid && Date.now() < sessionState.expiresAt) {
    return sessionState.sid;
  }

  if (!sessionState.loginPromise) {
    sessionState.loginPromise = loginWithToken().finally(() => {
      sessionState.loginPromise = null;
    });
  }

  return sessionState.loginPromise;
};

const wialonRequest = async (svc, params) => {
  const sid = await getSessionId();

  try {
    return await requestWialon(svc, params, sid);
  } catch (error) {
    if (error instanceof WialonError) {
      clearSession();
      const retrySid = await getSessionId();
      return requestWialon(svc, params, retrySid);
    }
    throw error;
  }
};

const resolvePosition = (item) => {
  const pos = item?.pos || item?.position || item?.lastPosition || item?.p || null;
  const lat = toNumber(pos?.y ?? pos?.lat ?? pos?.latitude ?? pos?.[0]);
  const lon = toNumber(pos?.x ?? pos?.lng ?? pos?.lon ?? pos?.longitude ?? pos?.[1]);
  const speed = toNumber(pos?.s?.value ?? pos?.s ?? item?.speed ?? item?.s);
  const heading = toNumber(pos?.c ?? item?.course ?? item?.heading ?? item?.c);
  const altitude = toNumber(pos?.z?.value ?? item?.altitude ?? item?.z);
  const satellites = toNumber(pos?.sc ?? item?.satellites ?? item?.sc);
  const deviceTime =
    toIsoDate(
      item?.t ??
        item?.time ??
        item?.tm ??
        item?.lmsg?.t ??
        item?.lmsg?.time ??
        item?.lmsg?.tm ??
        item?.lastTime ??
        item?.last_time ??
        pos?.t ??
        pos?.time ??
        pos?.tm
    ) || null;

  return {
    lat,
    lon,
    speed,
    heading,
    altitude,
    satellites,
    deviceTime
  };
};

const resolveStatus = (position, fallbackStatus) => {
  if (fallbackStatus) {
    return fallbackStatus;
  }

  if (position.lat === null || position.lon === null) {
    return "no_position";
  }

  if (position.speed !== null && position.speed > 1) {
    return "moving";
  }

  return "idle";
};

const scoreWialonUnitMatch = (truckKey, unitKey) => {
  if (!truckKey || !unitKey) {
    return 0;
  }

  if (truckKey === unitKey) {
    return 4;
  }

  if (unitKey.includes(truckKey) || truckKey.includes(unitKey)) {
    return 3;
  }

  return 0;
};

const pickBestWialonUnitMatch = (truck, units, usedUnitIds, overwrite = false) => {
  const currentUnitId = toPositiveIntString(truck.wialon_unit_id);
  if (currentUnitId && !overwrite) {
    return {
      status: "kept",
      truck,
      matchedUnit: null
    };
  }

  const truckKey = normalizeMatchKey(truck.no_police);
  if (!truckKey) {
    return {
      status: "skipped",
      truck,
      matchedUnit: null,
      reason: "no_police kosong"
    };
  }

  const scoredUnits = units
    .map((unit) => ({
      unit,
      score: scoreWialonUnitMatch(truckKey, unit.matchKey)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      if (left.unit.matchKey.length !== right.unit.matchKey.length) {
        return left.unit.matchKey.length - right.unit.matchKey.length;
      }
      return String(left.unit.name).localeCompare(String(right.unit.name));
    });

  if (scoredUnits.length === 0) {
    return {
      status: "unmatched",
      truck,
      matchedUnit: null,
      reason: "tidak ada unit yang cocok"
    };
  }

  const exactMatches = scoredUnits.filter((entry) => entry.score === 4);
  const candidatePool = exactMatches.length > 0 ? exactMatches : scoredUnits;
  const availableCandidates = candidatePool.filter(
    (entry) => !usedUnitIds.has(entry.unit.id)
  );

  if (availableCandidates.length === 0) {
    return {
      status: "ambiguous",
      truck,
      matchedUnit: null,
      reason: "unit yang cocok sudah dipakai truck lain"
    };
  }

  if (availableCandidates.length > 1 && availableCandidates[0].score === availableCandidates[1].score) {
    return {
      status: "ambiguous",
      truck,
      matchedUnit: null,
      reason: "lebih dari satu unit cocok"
    };
  }

  return {
    status: "matched",
    truck,
    matchedUnit: availableCandidates[0].unit
  };
};

const fetchWialonUnitCatalog = async () => {
  const response = await wialonRequest("core/search_items", {
    spec: {
      itemsType: "avl_unit",
      propName: "sys_name",
      propValueMask: "*",
      sortType: "sys_name",
      propType: "property"
    },
    force: 1,
    flags: 1025,
    from: 0,
    to: 0
  });

  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.items)
      ? response.items
      : [];

  return items
    .map((item) => {
      const id = extractUnitId(item);
      const name = extractUnitName(item);
      if (!id || !name) {
        return null;
      }

      return {
        id,
        name,
        matchKey: normalizeMatchKey(name)
      };
    })
    .filter(Boolean);
};

const fetchWialonResourceCatalog = async () => {
  const response = await wialonRequest("core/search_items", {
    spec: {
      itemsType: "avl_resource",
      propName: "sys_name",
      propValueMask: "*",
      sortType: "sys_name",
      propType: "property"
    },
    force: 1,
    flags: 1,
    from: 0,
    to: 0
  });

  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.items)
      ? response.items
      : [];

  return items
    .map((item) => {
      const id = extractResourceId(item);
      const name = extractResourceName(item);
      if (!id || !name) {
        return null;
      }

      return {
        id,
        name
      };
    })
    .filter(Boolean);
};

const fetchWialonUnitSnapshot = async () => {
  const response = await wialonRequest("core/search_items", {
    spec: {
      itemsType: "avl_unit",
      propName: "sys_name",
      propValueMask: "*",
      sortType: "sys_name",
      propType: "property"
    },
    force: 1,
    flags: 1025,
    from: 0,
    to: 0
  });

  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.items)
      ? response.items
      : [];

  return items
    .map((item) => {
      const id = extractUnitId(item);
      const name = extractUnitName(item);
      if (!id || !name) {
        return null;
      }

      return {
        id,
        name,
        matchKey: normalizeMatchKey(name),
        item
      };
    })
    .filter(Boolean);
};

const normalizeZoneDataRows = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.zones)) {
    return payload.zones;
  }

  if (payload && typeof payload === "object") {
    return Object.entries(payload).map(([zoneId, zoneValue]) => ({
      ...(zoneValue && typeof zoneValue === "object" ? zoneValue : {}),
      id: zoneValue?.id ?? zoneId
    }));
  }

  return [];
};

const fetchResourceZoneData = async (resourceId) => {
  const safeResourceId = normalizePositiveIntString(resourceId);
  if (!safeResourceId) {
    return [];
  }

  // Some Wialon accounts return an empty array when `col: []` is provided.
  // Omitting `col` is the reliable way to request all zones from a resource.
  const attempts = [{ flags: 28 }, { flags: 1 }];
  for (const attempt of attempts) {
    try {
      const payload = await wialonRequest("resource/get_zone_data", {
        itemId: Number(safeResourceId),
        flags: attempt.flags
      });

      const rows = normalizeZoneDataRows(payload);
      if (rows.length > 0 || attempt.flags === 1) {
        return rows;
      }
    } catch (error) {
      if (attempt.flags === 1) {
        throw error;
      }
    }
  }

  return [];
};

const normalizePositiveIntString = (value) => {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return String(parsed);
};

const fetchWialonGeofences = async () => {
  const resources = await fetchWialonResourceCatalog();
  const geofenceCollections = await Promise.all(
    resources.map(async (resource) => {
      const zones = await fetchResourceZoneData(resource.id);
      return zones
        .map((zone) => {
          const zoneId = normalizePositiveIntString(zone?.id ?? zone?.i ?? zone?.zone_id);
          const zoneName = String(zone?.n ?? zone?.nm ?? zone?.name ?? "").trim();
          if (!zoneId || !zoneName) {
            return null;
          }

          return {
            resource_id: Number(resource.id),
            resource_name: resource.name,
            zone_id: Number(zoneId),
            zone_name: zoneName
          };
        })
        .filter(Boolean);
    })
  );

  return geofenceCollections
    .flat()
    .sort((left, right) => {
      const leftKey = `${left.resource_name} ${left.zone_name}`.toLowerCase();
      const rightKey = `${right.resource_name} ${right.zone_name}`.toLowerCase();
      return leftKey.localeCompare(rightKey);
    });
};

const normalizeZoneMembershipPayload = (payload, zoneIds) => {
  const membership = new Map();
  const targetZoneIds = Array.isArray(zoneIds)
    ? zoneIds.map((zoneId) => normalizePositiveIntString(zoneId)).filter(Boolean)
    : [];

  const consumeUnits = (zoneId, value) => {
    const normalizedZoneId = normalizePositiveIntString(zoneId);
    if (!normalizedZoneId) {
      return;
    }

    const unitIds = [];
    if (Array.isArray(value)) {
      value.forEach((unitId) => {
        const normalizedUnitId = normalizePositiveIntString(unitId);
        if (normalizedUnitId) {
          unitIds.push(normalizedUnitId);
        }
      });
    } else if (value && typeof value === "object") {
      const nestedCandidates = [
        value.units,
        value.u,
        value.items,
        value.data,
        Object.keys(value)
      ];
      nestedCandidates.forEach((candidate) => {
        if (!Array.isArray(candidate)) {
          return;
        }
        candidate.forEach((unitId) => {
          const normalizedUnitId = normalizePositiveIntString(
            unitId?.id ?? unitId?.i ?? unitId
          );
          if (normalizedUnitId) {
            unitIds.push(normalizedUnitId);
          }
        });
      });
    }

    membership.set(
      normalizedZoneId,
      new Set(unitIds)
    );
  };

  const walkPayload = (node, nodeKey = null) => {
    if (Array.isArray(node)) {
      const normalizedNodeKey = normalizePositiveIntString(nodeKey);
      if (normalizedNodeKey && targetZoneIds.includes(normalizedNodeKey)) {
        consumeUnits(normalizedNodeKey, node);
        return;
      }

      node.forEach((item) => {
        walkPayload(item, nodeKey);
      });
      return;
    }

    if (!node || typeof node !== "object") {
      return;
    }

    const directZoneId = node.zone_id ?? node.id ?? node.i ?? null;
    const directUnits = node.units ?? node.u ?? node.items ?? node.data;
    if (directZoneId && directUnits !== undefined) {
      consumeUnits(directZoneId, directUnits);
    }

    Object.entries(node).forEach(([key, value]) => {
      if (["zone_id", "id", "i", "units", "u", "items", "data"].includes(key)) {
        return;
      }

      const normalizedKey = normalizePositiveIntString(key);
      if (normalizedKey && targetZoneIds.includes(normalizedKey)) {
        consumeUnits(normalizedKey, value);
        return;
      }

      walkPayload(value, key);
    });
  };

  walkPayload(payload);

  targetZoneIds.forEach((zoneId) => {
    if (!membership.has(zoneId)) {
      membership.set(zoneId, new Set());
    }
  });

  return membership;
};

const fetchUnitsInZonesByResource = async ({ resourceId, zoneIds, unitIds }) => {
  const safeResourceId = normalizePositiveIntString(resourceId);
  const safeZoneIds = Array.isArray(zoneIds)
    ? Array.from(new Set(zoneIds.map((zoneId) => normalizePositiveIntString(zoneId)).filter(Boolean)))
    : [];
  const safeUnitIds = Array.isArray(unitIds)
    ? Array.from(new Set(unitIds.map((unitId) => normalizePositiveIntString(unitId)).filter(Boolean)))
    : [];

  if (!safeResourceId || safeZoneIds.length === 0 || safeUnitIds.length === 0) {
    return new Map();
  }

  const payload = await wialonRequest("resource/get_zones_by_unit", {
    spec: {
      zoneId: {
        [safeResourceId]: safeZoneIds.map(Number)
      },
      units: safeUnitIds.map(Number),
      time: 0
    }
  });

  return normalizeZoneMembershipPayload(payload, safeZoneIds);
};

const getUnitPositionMap = async (unitIds = []) => {
  const snapshot = await fetchWialonUnitSnapshot();
  const allowedUnitIds = new Set(
    unitIds.map((unitId) => normalizePositiveIntString(unitId)).filter(Boolean)
  );
  const positionMap = new Map();

  snapshot.forEach((unit) => {
    if (allowedUnitIds.size > 0 && !allowedUnitIds.has(unit.id)) {
      return;
    }

    const position = resolvePosition(unit.item);
    positionMap.set(unit.id, {
      unit_id: Number(unit.id),
      unit_name: unit.name,
      lat: position.lat,
      lon: position.lon,
      speed: position.speed,
      heading: position.heading,
      altitude: position.altitude,
      satellites: position.satellites,
      gps_time: position.deviceTime
    });
  });

  return positionMap;
};

const toDateString = (value) => {
  if (!value || value === "0000-00-00") {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(
      value.getDate()
    )}`;
  }

  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime())
    ? null
    : `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(
        parsed.getDate()
      )}`;
};

const normalizeMonthParts = (monthValue) => {
  const rawValue =
    monthValue === null || monthValue === undefined || monthValue === ""
      ? null
      : String(monthValue).trim();

  if (!rawValue) {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1
    };
  }

  const match = rawValue.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error("Parameter month wajib berformat YYYY-MM.");
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    throw new Error("Parameter month tidak valid.");
  }

  return {
    year,
    month
  };
};

const buildMonthlyDistancePeriod = (monthValue) => {
  const { year, month } = normalizeMonthParts(monthValue);
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endExclusiveDate = new Date(year, month, 1, 0, 0, 0, 0);
  const timeFrom = Math.floor(startDate.getTime() / 1000);
  const timeTo = Math.max(timeFrom, Math.floor(endExclusiveDate.getTime() / 1000) - 1);

  return {
    year,
    month,
    month_key: `${year}-${pad2(month)}`,
    start_at: startDate.toISOString(),
    end_at: new Date(timeTo * 1000).toISOString(),
    timeFrom,
    timeTo
  };
};

const normalizePagination = ({ page, limit } = {}) => {
  const safePage = Number.parseInt(String(page || "1"), 10);
  const safeLimit = Number.parseInt(String(limit || "10"), 10);

  return {
    page: Number.isFinite(safePage) && safePage > 0 ? safePage : 1,
    limit:
      Number.isFinite(safeLimit) && safeLimit > 0
        ? Math.min(safeLimit, 50)
        : 10
  };
};

const formatTripTimestamp = (value) => {
  if (!Number.isFinite(Number(value))) {
    return null;
  }

  return new Date(Number(value) * 1000).toISOString();
};

const buildTruckDisplayName = (truck) =>
  [truck.merk_mobil, truck.model, truck.type_truck, truck.jenis_kendaraan]
    .filter(Boolean)
    .join(" ")
    .trim();

const fetchTruckMileageCatalog = async ({ search, page, limit } = {}) => {
  const normalizedSearch = String(search || "").trim();
  const pagination = normalizePagination({ page, limit });
  const whereClause = normalizedSearch
    ? `
      WHERE is_active = 1
        AND CONCAT_WS(' ', no_police, merk_mobil, model, type_truck, jenis_kendaraan, wialon_unit_id)
        LIKE ?
    `
    : "WHERE is_active = 1";
  const params = normalizedSearch ? [`%${normalizedSearch}%`] : [];
  const [countRows] = await db.query(
    `
      SELECT COUNT(*) AS total
      FROM truck
      ${whereClause}
    `,
    params
  );
  const offset = (pagination.page - 1) * pagination.limit;
  const [rows] = await db.query(
    `
      SELECT
        id_truck,
        no_police,
        jenis_kendaraan,
        merk_mobil,
        model,
        type_truck,
        wialon_unit_id
      FROM truck
      ${whereClause}
      ORDER BY no_police ASC, id_truck ASC
      LIMIT ?
      OFFSET ?
    `,
    [...params, pagination.limit, offset]
  );

  return {
    rows: rows.map((row) => ({
    id_truck: Number(row.id_truck),
    no_police: row.no_police || null,
    jenis_kendaraan: row.jenis_kendaraan || null,
    merk_mobil: row.merk_mobil || null,
    model: row.model || null,
    type_truck: row.type_truck || null,
    wialon_unit_id: toPositiveIntString(row.wialon_unit_id),
    vehicle_name: buildTruckDisplayName(row) || null
    })),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total_rows: Number(countRows?.[0]?.total || 0),
      total_pages: Math.max(
        1,
        Math.ceil(Number(countRows?.[0]?.total || 0) / pagination.limit)
      )
    }
  };
};

const fetchTripsForUnitInPeriod = async ({ sid, unitId, timeFrom, timeTo }) => {
  try {
    try {
      await requestWialon("messages/unload", {}, sid);
    } catch {
      // ignore stale loader cleanup errors
    }

    await requestWialon(
      "messages/load_interval",
      {
        itemId: Number(unitId),
        timeFrom,
        timeTo,
        flags: 1,
        flagsMask: 65281,
        loadCount: 0xffffffff
      },
      sid
    );

    const tripsPayload = await requestWialon(
      "unit/get_trips",
      {
        itemId: Number(unitId),
        timeFrom,
        timeTo,
        msgsSource: 1
      },
      sid
    );

    return Array.isArray(tripsPayload)
      ? tripsPayload
      : Array.isArray(tripsPayload?.trips)
        ? tripsPayload.trips
        : [];
  } finally {
    try {
      await requestWialon("messages/unload", {}, sid);
    } catch {
      // ignore cleanup errors after trip extraction
    }
  }
};

const buildMileageRowWithoutTrips = (truck, status, extra = {}) => ({
  id_truck: truck.id_truck,
  no_police: truck.no_police,
  vehicle_name: truck.vehicle_name,
  jenis_kendaraan: truck.jenis_kendaraan,
  merk_mobil: truck.merk_mobil,
  model: truck.model,
  type_truck: truck.type_truck,
  wialon_unit_id: truck.wialon_unit_id || null,
  total_distance_m: 0,
  total_distance_km: 0,
  trips_count: 0,
  first_trip_at: null,
  last_trip_at: null,
  status,
  error: null,
  ...extra
});

const buildTruckMonthlyDistanceRow = async (truck, period, sid, options = {}) => {
  if (!truck.wialon_unit_id) {
    return buildMileageRowWithoutTrips(truck, "unlinked");
  }

  const knownUnitIds = options?.knownUnitIds instanceof Set ? options.knownUnitIds : null;
  if (knownUnitIds && !knownUnitIds.has(String(truck.wialon_unit_id))) {
    return buildMileageRowWithoutTrips(truck, "missing_unit", {
      error: "Mapping Wialon tidak ditemukan di akun GPS aktif."
    });
  }

  try {
    const trips = await fetchTripsForUnitInPeriod({
      sid,
      unitId: truck.wialon_unit_id,
      timeFrom: period.timeFrom,
      timeTo: period.timeTo
    });

    if (trips.length === 0) {
      return buildMileageRowWithoutTrips(truck, "no_trip");
    }

    let totalDistanceMeters = 0;
    let firstTripAt = null;
    let lastTripAt = null;

    trips.forEach((trip) => {
      const distanceMeters = Number(trip?.m);
      if (Number.isFinite(distanceMeters) && distanceMeters > 0) {
        totalDistanceMeters += distanceMeters;
      }

      const fromTime = formatTripTimestamp(trip?.from?.t);
      const toTime = formatTripTimestamp(trip?.to?.t);
      if (fromTime && (!firstTripAt || fromTime < firstTripAt)) {
        firstTripAt = fromTime;
      }
      if (toTime && (!lastTripAt || toTime > lastTripAt)) {
        lastTripAt = toTime;
      }
    });

    return {
      id_truck: truck.id_truck,
      no_police: truck.no_police,
      vehicle_name: truck.vehicle_name,
      jenis_kendaraan: truck.jenis_kendaraan,
      merk_mobil: truck.merk_mobil,
      model: truck.model,
      type_truck: truck.type_truck,
      wialon_unit_id: truck.wialon_unit_id,
      total_distance_m: Math.round(totalDistanceMeters),
      total_distance_km: Number((totalDistanceMeters / 1000).toFixed(2)),
      trips_count: trips.length,
      first_trip_at: firstTripAt,
      last_trip_at: lastTripAt,
      status: totalDistanceMeters > 0 ? "has_trip" : "no_trip",
      error: null
    };
  } catch (error) {
    return buildMileageRowWithoutTrips(truck, "error", {
      error: String(error?.message || error || "Gagal mengambil mileage Wialon.")
    });
  }
};

const buildTruckMonthlyDistanceRows = async (trucks, period, options = {}) => {
  const unlinkedRows = trucks
    .filter((truck) => !truck.wialon_unit_id)
    .map((truck) => buildMileageRowWithoutTrips(truck, "unlinked"));
  const mappedTrucks = trucks.filter((truck) => truck.wialon_unit_id);

  if (mappedTrucks.length === 0) {
    return unlinkedRows;
  }

  const truckQueue = [...mappedTrucks];
  const mappedRows = [];
  let workerFailure = null;
  const workerCount = Math.min(MONTHLY_DISTANCE_WORKER_COUNT, mappedTrucks.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      let sid = null;

      try {
        sid = await loginIsolatedSession();

        while (truckQueue.length > 0) {
          const truck = truckQueue.shift();
          if (!truck) {
            break;
          }

          const row = await buildTruckMonthlyDistanceRow(truck, period, sid, options);
          mappedRows.push(row);
        }
      } catch (error) {
        if (!workerFailure) {
          workerFailure = String(
            error?.message || error || "Gagal membuka sesi mileage Wialon."
          );
        }
      } finally {
        await logoutIsolatedSession(sid);
      }
    })
  );

  while (truckQueue.length > 0) {
    const truck = truckQueue.shift();
    if (!truck) {
      break;
    }

    mappedRows.push(
      buildMileageRowWithoutTrips(truck, "error", {
        error: workerFailure || "Sebagian request mileage Wialon gagal diproses."
      })
    );
  }

  return [...mappedRows, ...unlinkedRows];
};

const getTruckMonthlyDistance = async ({ month, search, page, limit } = {}) => {
  const period = buildMonthlyDistancePeriod(month);
  const pagination = normalizePagination({ page, limit });
  const normalizedSearch = String(search || "").trim().toLowerCase();
  const cacheKey = `active-trucks|${period.month_key}|${normalizedSearch}|${pagination.page}|${pagination.limit}`;
  const cachedPayload = getMonthlyDistanceCacheEntry(cacheKey);
  if (cachedPayload) {
    return {
      ...cachedPayload,
      meta: {
        ...cachedPayload.meta,
        cached: true
      }
    };
  }

  const truckCatalog = await fetchTruckMileageCatalog({
    search: normalizedSearch,
    page: pagination.page,
    limit: pagination.limit
  });
  const knownUnitIds = new Set(
    (await fetchWialonUnitCatalog()).map((unit) => String(unit.id))
  );
  const rows = await buildTruckMonthlyDistanceRows(truckCatalog.rows, period, {
    knownUnitIds
  });

  rows.sort((left, right) => {
    if (right.total_distance_m !== left.total_distance_m) {
      return right.total_distance_m - left.total_distance_m;
    }
    return String(left.no_police || "").localeCompare(String(right.no_police || ""));
  });

  const summary = rows.reduce(
    (accumulator, row) => {
      accumulator.total_trucks += 1;
      if (row.wialon_unit_id && row.status !== "missing_unit") {
        accumulator.mapped_trucks += 1;
      } else {
        accumulator.unlinked_trucks += 1;
      }

      if (row.status === "has_trip") {
        accumulator.active_trucks += 1;
      }
      if (row.status === "error") {
        accumulator.error_trucks += 1;
      }

      accumulator.total_distance_m += row.total_distance_m;
      accumulator.total_trips += row.trips_count;
      return accumulator;
    },
    {
      total_trucks: 0,
      mapped_trucks: 0,
      unlinked_trucks: 0,
      active_trucks: 0,
      error_trucks: 0,
      total_distance_m: 0,
      total_trips: 0
    }
  );

  summary.total_distance_km = Number((summary.total_distance_m / 1000).toFixed(2));

  const payload = {
    summary,
    rows,
    period,
    pagination: truckCatalog.pagination,
    meta: {
      fetched_at: new Date().toISOString(),
      cached: false,
      cache_ttl_ms: MONTHLY_DISTANCE_CACHE_TTL_MS,
      source: "wialon-unit-get-trips",
      worker_count: MONTHLY_DISTANCE_WORKER_COUNT,
      search: normalizedSearch
    }
  };

  setMonthlyDistanceCacheEntry(cacheKey, payload);
  return payload;
};

const getTruckMonthlyDistanceExportRows = async ({ month, search } = {}) => {
  const period = buildMonthlyDistancePeriod(month);
  const normalizedSearch = String(search || "").trim().toLowerCase();
  const [rows] = await db.query(
    `
      SELECT
        id_truck,
        no_police,
        jenis_kendaraan,
        merk_mobil,
        model,
        type_truck,
        wialon_unit_id
      FROM truck
      ${
        normalizedSearch
          ? `
      WHERE is_active = 1
        AND CONCAT_WS(' ', no_police, merk_mobil, model, type_truck, jenis_kendaraan, wialon_unit_id)
        LIKE ?
      `
          : "WHERE is_active = 1"
      }
      ORDER BY no_police ASC, id_truck ASC
    `,
    normalizedSearch ? [`%${normalizedSearch}%`] : []
  );

  const truckRows = rows.map((row) => ({
    id_truck: Number(row.id_truck),
    no_police: row.no_police || null,
    jenis_kendaraan: row.jenis_kendaraan || null,
    merk_mobil: row.merk_mobil || null,
    model: row.model || null,
    type_truck: row.type_truck || null,
    wialon_unit_id: toPositiveIntString(row.wialon_unit_id),
    vehicle_name: buildTruckDisplayName(row) || null
  }));

  const knownUnitIds = new Set(
    (await fetchWialonUnitCatalog()).map((unit) => String(unit.id))
  );

  const mileageRows = await buildTruckMonthlyDistanceRows(truckRows, period, {
    knownUnitIds
  });

  mileageRows.sort((left, right) => {
    if (right.total_distance_m !== left.total_distance_m) {
      return right.total_distance_m - left.total_distance_m;
    }
    return String(left.no_police || "").localeCompare(String(right.no_police || ""));
  });

  return {
    rows: mileageRows,
    period,
    search: normalizedSearch
  };
};

const fetchOperationalContext = async () => {
  const todayString = toDateString(new Date());

  const repairSql = `
    SELECT
      repair.id_repair,
      repair.id_truck,
      repair.kategori_repair,
      repair.jenis_kerusakan,
      repair.keterangan,
      repair.no_spk_perbaikan,
      repair.status_repair,
      repair.tgl_kerusakan,
      repair.tgl_input,
      repair.tgl_proses,
      repair.tgl_selesai
    FROM repair
    WHERE repair.id_truck IS NOT NULL
      AND (repair.status_repair IS NULL OR repair.status_repair = 'PROSES')
    ORDER BY repair.tgl_input DESC, repair.id_repair DESC
  `;

  const trxSql = `
    SELECT
      sc.id_sales_cost,
      sc.id_truck,
      sc.id_driver,
      sc.departure_datetime,
      sc.arrival_datetime,
      sc.finish_order_datetime,
      sc.trip,
      sc.jenis_trip,
      sc.no_po,
      sc.no_aju,
      sc.no_container,
      d.nama_driver,
      a.nama_area
    FROM sales_cost sc
    LEFT JOIN driver d ON sc.id_driver = d.id_driver
    LEFT JOIN area a ON sc.id_area = a.id_area
    WHERE sc.id_truck IS NOT NULL
      AND (
        (sc.finish_order_datetime IS NOT NULL AND CAST(sc.finish_order_datetime AS CHAR) <> '0000-00-00' AND sc.finish_order_datetime > ?)
        OR
        (
          (sc.finish_order_datetime IS NULL OR CAST(sc.finish_order_datetime AS CHAR) = '0000-00-00')
          AND
          (sc.arrival_datetime IS NULL OR CAST(sc.arrival_datetime AS CHAR) = '0000-00-00' OR sc.arrival_datetime >= ?)
        )
      )
    ORDER BY sc.departure_datetime DESC, sc.id_sales_cost DESC
  `;

  const lastSql = `
    SELECT
      sc.id_sales_cost,
      sc.id_truck,
      sc.id_driver,
      sc.departure_datetime,
      sc.arrival_datetime,
      sc.finish_order_datetime,
      d.nama_driver,
      a.nama_area
    FROM sales_cost sc
    INNER JOIN (
      SELECT id_truck, MAX(departure_datetime) AS max_delivery
      FROM sales_cost
      WHERE id_truck IS NOT NULL
      GROUP BY id_truck
    ) last ON last.id_truck = sc.id_truck AND last.max_delivery = sc.departure_datetime
    LEFT JOIN driver d ON sc.id_driver = d.id_driver
    LEFT JOIN area a ON sc.id_area = a.id_area
    ORDER BY sc.departure_datetime DESC, sc.id_sales_cost DESC
  `;

  const [[repairRows], [trxRows], [lastRows]] = await Promise.all([
    db.query(repairSql),
    db.query(trxSql, [todayString, todayString]),
    db.query(lastSql)
  ]);

  const repairsByTruck = new Map();
  repairRows.forEach((row) => {
    const key = String(row.id_truck || "");
    if (!key || repairsByTruck.has(key)) {
      return;
    }
    repairsByTruck.set(key, row);
  });

  const transaksiByTruck = new Map();
  trxRows.forEach((row) => {
    const key = String(row.id_truck || "");
    if (!key || transaksiByTruck.has(key)) {
      return;
    }
    transaksiByTruck.set(key, row);
  });

  const lastByTruck = new Map();
  lastRows.forEach((row) => {
    const key = String(row.id_truck || "");
    if (!key || lastByTruck.has(key)) {
      return;
    }
    lastByTruck.set(key, row);
  });

  return {
    repairsByTruck,
    transaksiByTruck,
    lastByTruck
  };
};

const buildOperationalDetails = (truck, operationalContext) => {
  const key = String(truck.id_truck || "");
  const repair = operationalContext.repairsByTruck.get(key) || null;
  const transaksi = operationalContext.transaksiByTruck.get(key) || null;
  const last = operationalContext.lastByTruck.get(key) || null;

  const lastTransaction = last
    ? {
        id_sales_cost: last.id_sales_cost ?? null,
        departure_datetime: toDateString(last.departure_datetime),
        arrival_datetime: toDateString(last.arrival_datetime),
        finish_order_datetime: toDateString(last.finish_order_datetime),
        driver_name: last.nama_driver || null,
        route: last.nama_area || null
      }
    : null;

  if (repair) {
    return {
      driver_name: last?.nama_driver || null,
      operational_status: "repair",
      transaksi: null,
      repair: {
        id_repair: repair.id_repair ?? null,
        no_spk_perbaikan: repair.no_spk_perbaikan || null,
        kategori_repair: repair.kategori_repair || null,
        jenis_kerusakan: repair.jenis_kerusakan || null,
        status_repair: repair.status_repair || null,
        tgl_kerusakan:
          toDateString(repair.tgl_kerusakan) || toDateString(repair.tgl_input),
        tgl_input: toDateString(repair.tgl_input),
        tgl_proses: toDateString(repair.tgl_proses),
        tgl_selesai: toDateString(repair.tgl_selesai)
      },
      last_transaction: lastTransaction
    };
  }

  if (transaksi) {
    return {
      driver_name: transaksi.nama_driver || null,
      operational_status: "transaksi",
      transaksi: {
        id_sales_cost: transaksi.id_sales_cost ?? null,
        no_spk: transaksi.id_sales_cost ?? null,
        departure_datetime: toDateString(transaksi.departure_datetime),
        arrival_datetime: toDateString(transaksi.arrival_datetime),
        finish_order_datetime: toDateString(transaksi.finish_order_datetime),
        trip: transaksi.trip || null,
        jenis_trip: transaksi.jenis_trip || null,
        no_po: transaksi.no_po || null,
        no_aju: transaksi.no_aju || null,
        no_container: transaksi.no_container || null,
        route: transaksi.nama_area || null
      },
      repair: null,
      last_transaction: lastTransaction
    };
  }

  return {
    driver_name: last?.nama_driver || null,
    operational_status: "idle",
    transaksi: null,
    repair: null,
    last_transaction: lastTransaction
  };
};

const normalizeTruckLocation = ({
  truck,
  item,
  fetchedAt,
  fallbackStatus,
  operationalDetails
}) => {
  const position = resolvePosition(item);
  const status = resolveStatus(position, fallbackStatus);

  return {
    id_truck: Number(truck.id_truck),
    no_police: truck.no_police || null,
    jenis_kendaraan: truck.jenis_kendaraan || null,
    merk_mobil: truck.merk_mobil || null,
    model: truck.model || null,
    type_truck: truck.type_truck || null,
    wialon_unit_id: truck.wialon_unit_id || null,
    wialon_unit_name: item?.n || truck.no_police || null,
    status,
    gps: {
      lat: position.lat,
      lon: position.lon,
      speed: position.speed,
      heading: position.heading,
      altitude: position.altitude,
      satellites: position.satellites,
      device_time: position.deviceTime,
      fetched_at: fetchedAt
    },
    synced_at: position.deviceTime || fetchedAt,
    driver_name: operationalDetails.driver_name,
    operational_status: operationalDetails.operational_status,
    transaksi: operationalDetails.transaksi,
    repair: operationalDetails.repair,
    last_transaction: operationalDetails.last_transaction
  };
};

const reverseGeocodeCoordinates = async ({ lat, lon }) => {
  const safeLat = ensureFiniteCoordinate(lat);
  const safeLon = ensureFiniteCoordinate(lon);

  if (safeLat === null || safeLon === null) {
    return {
      formatted_address: null,
      cached: false,
      provider: "geoapify",
      coordinates: {
        lat: safeLat,
        lon: safeLon
      },
      error: "Koordinat tidak valid."
    };
  }

  if (!DEFAULT_GEOAPIFY_API_KEY) {
    return {
      formatted_address: null,
      cached: false,
      provider: "geoapify",
      coordinates: {
        lat: safeLat,
        lon: safeLon
      },
      error: "GEOAPIFY_API_KEY belum diatur."
    };
  }

  const cacheKey = buildReverseGeocodeCacheKey(safeLat, safeLon);
  const cachedPayload = getCachedReverseGeocode(cacheKey);
  if (cachedPayload) {
    return {
      ...cachedPayload,
      cached: true
    };
  }

  const url = new URL(DEFAULT_GEOAPIFY_BASE_URL);
  url.searchParams.set("lat", String(safeLat));
  url.searchParams.set("lon", String(safeLon));
  url.searchParams.set("format", "json");
  url.searchParams.set("apiKey", DEFAULT_GEOAPIFY_API_KEY);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEOAPIFY_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json"
      }
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.message || `Geoapify request failed with status ${response.status}`);
    }

    const result =
      Array.isArray(payload?.results) && payload.results.length > 0
        ? payload.results[0]
        : null;

    const normalizedPayload = {
      formatted_address:
        result?.formatted || result?.address_line1 || result?.address_line2 || null,
      cached: false,
      provider: "geoapify",
      coordinates: {
        lat: safeLat,
        lon: safeLon
      },
      error: null
    };

    setCachedReverseGeocode(cacheKey, normalizedPayload);
    return normalizedPayload;
  } catch (error) {
    return {
      formatted_address: null,
      cached: false,
      provider: "geoapify",
      coordinates: {
        lat: safeLat,
        lon: safeLon
      },
      error: error?.message || "Gagal mengambil alamat dari Geoapify."
    };
  } finally {
    clearTimeout(timeout);
  }
};

const getTruckLocations = async () => {
  const [truckRows] = await db.query(
    `
      SELECT
        id_truck,
        jenis_kendaraan,
        no_police,
        merk_mobil,
        model,
        type_truck,
        wialon_unit_id
      FROM truck
      WHERE is_active = 1
      ORDER BY id_truck ASC
    `
  );

  const fetchedAt = new Date().toISOString();
  const operationalContext = await fetchOperationalContext();
  const mappedTrucks = truckRows.filter((truck) => toPositiveIntString(truck.wialon_unit_id));

  const resultsByUnitId = new Map();
  let wialonAvailable = true;
  let wialonError = null;

  if (mappedTrucks.length > 0) {
    try {
      const response = await fetchWialonUnitSnapshot();
      response.forEach((unit) => {
        if (!unit?.id || resultsByUnitId.has(unit.id)) {
          return;
        }
        resultsByUnitId.set(unit.id, unit.item);
      });
    } catch (error) {
      wialonAvailable = false;
      wialonError = error;
      console.error("Wialon location fetch failed", error);
    }
  }

  const trucks = truckRows.map((truck) => {
    const operationalDetails = buildOperationalDetails(truck, operationalContext);
    const unitId = toPositiveIntString(truck.wialon_unit_id);
    if (!unitId) {
      return normalizeTruckLocation({
        truck,
        item: null,
        fetchedAt,
        fallbackStatus: "unlinked",
        operationalDetails
      });
    }

    const item = resultsByUnitId.get(unitId);
    if (!wialonAvailable || !item) {
      return normalizeTruckLocation({
        truck,
        item: null,
        fetchedAt,
        fallbackStatus: "offline",
        operationalDetails
      });
    }

    return normalizeTruckLocation({
      truck,
      item,
      fetchedAt,
      operationalDetails
    });
  });

  const summary = trucks.reduce(
    (accumulator, truck) => {
      accumulator.total += 1;
      if (truck.status === "unlinked") {
        accumulator.unlinked += 1;
        return accumulator;
      }
      if (truck.status === "moving") {
        accumulator.moving += 1;
      } else if (truck.status === "idle") {
        accumulator.idle += 1;
      } else if (truck.status === "offline") {
        accumulator.offline += 1;
      } else if (truck.status === "no_position") {
        accumulator.no_position += 1;
      }
      accumulator.linked += 1;
      return accumulator;
    },
    {
      total: 0,
      linked: 0,
      unlinked: 0,
      moving: 0,
      idle: 0,
      offline: 0,
      no_position: 0
    }
  );

  return {
    summary,
    trucks,
    meta: {
      fetched_at: fetchedAt,
      wialon_available: wialonAvailable,
      wialon_error: wialonError ? String(wialonError.message || wialonError) : null
    }
  };
};

const autoMapTruckWialonUnits = async ({ overwrite = false } = {}) => {
  const [truckRows] = await db.query(
    `
      SELECT
        id_truck,
        jenis_kendaraan,
        no_police,
        merk_mobil,
        model,
        type_truck,
        wialon_unit_id
      FROM truck
      ORDER BY id_truck ASC
    `
  );

  const trucks = truckRows.map((truck) => ({
    ...truck,
    wialon_unit_id: truck.wialon_unit_id || null
  }));

  const catalog = await fetchWialonUnitCatalog();
  const usedUnitIds = new Set(
    overwrite
      ? []
      : trucks.map((truck) => toPositiveIntString(truck.wialon_unit_id)).filter(Boolean)
  );

  const summary = {
    total: trucks.length,
    eligible: 0,
    matched: 0,
    updated: 0,
    kept: 0,
    skipped: 0,
    unmatched: 0,
    ambiguous: 0
  };

  const mappings = [];

  for (const truck of trucks) {
    const currentUnitId = toPositiveIntString(truck.wialon_unit_id);
    if (currentUnitId && !overwrite) {
      summary.kept += 1;
      continue;
    }

    summary.eligible += 1;
    const match = pickBestWialonUnitMatch(truck, catalog, usedUnitIds, overwrite);

    if (match.status === "kept") {
      summary.kept += 1;
      continue;
    }

    if (match.status === "skipped") {
      summary.skipped += 1;
      mappings.push({
        id_truck: Number(truck.id_truck),
        no_police: truck.no_police || null,
        status: match.status,
        reason: match.reason || null
      });
      continue;
    }

    if (match.status === "unmatched" || match.status === "ambiguous") {
      summary[match.status] += 1;
      mappings.push({
        id_truck: Number(truck.id_truck),
        no_police: truck.no_police || null,
        status: match.status,
        reason: match.reason || null
      });
      continue;
    }

    if (!match.matchedUnit) {
      summary.unmatched += 1;
      mappings.push({
        id_truck: Number(truck.id_truck),
        no_police: truck.no_police || null,
        status: "unmatched",
        reason: "unit tidak ditemukan"
      });
      continue;
    }

    const wialonUnitId = match.matchedUnit.id;
    const [updateResult] = await db.query(
      "UPDATE truck SET wialon_unit_id = ? WHERE id_truck = ?",
      [wialonUnitId, truck.id_truck]
    );

    if (updateResult.affectedRows > 0) {
      usedUnitIds.add(wialonUnitId);
      summary.matched += 1;
      summary.updated += 1;
      mappings.push({
        id_truck: Number(truck.id_truck),
        no_police: truck.no_police || null,
        status: "matched",
        wialon_unit_id: wialonUnitId,
        wialon_unit_name: match.matchedUnit.name
      });
      continue;
    }

    summary.skipped += 1;
    mappings.push({
      id_truck: Number(truck.id_truck),
      no_police: truck.no_police || null,
      status: "skipped",
      reason: "gagal update database"
    });
  }

  return {
    summary,
    mappings,
    meta: {
      overwrite,
      catalog_size: catalog.length,
      fetched_at: new Date().toISOString()
    }
  };
};

module.exports = {
  getTruckLocations,
  getTruckMonthlyDistance,
  getTruckMonthlyDistanceExportRows,
  reverseGeocodeCoordinates,
  autoMapTruckWialonUnits,
  fetchWialonGeofences,
  fetchUnitsInZonesByResource,
  getUnitPositionMap,
  clearSession
};
