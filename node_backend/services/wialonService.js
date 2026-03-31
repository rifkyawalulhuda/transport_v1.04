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
  process.env.REVERSE_GEOCODE_CACHE_TTL_MS || `${12 * 60 * 60 * 1000}`,
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
  : 12 * 60 * 60 * 1000;

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

const getCachedReverseGeocode = (cacheKey) => {
  if (!cacheKey) {
    return null;
  }

  const entry = reverseGeocodeCache.get(cacheKey);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    reverseGeocodeCache.delete(cacheKey);
    return null;
  }

  return entry.payload;
};

const setCachedReverseGeocode = (cacheKey, payload) => {
  if (!cacheKey) {
    return;
  }

  reverseGeocodeCache.set(cacheKey, {
    payload,
    expiresAt: Date.now() + REVERSE_GEOCODE_CACHE_TTL_MS
  });

  if (reverseGeocodeCache.size > 1000) {
    const oldestKey = reverseGeocodeCache.keys().next().value;
    if (oldestKey) {
      reverseGeocodeCache.delete(oldestKey);
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

const toDateString = (value) => {
  if (!value || value === "0000-00-00") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value.toISOString().slice(0, 10);
  }

  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime())
    ? null
    : parsed.toISOString().slice(0, 10);
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
      sc.delivery_order,
      sc.arrival_order,
      sc.finish_order,
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
        (sc.finish_order IS NOT NULL AND sc.finish_order <> '0000-00-00' AND sc.finish_order > ?)
        OR
        (
          (sc.finish_order IS NULL OR sc.finish_order = '0000-00-00')
          AND
          (sc.arrival_order IS NULL OR sc.arrival_order = '0000-00-00' OR sc.arrival_order >= ?)
        )
      )
    ORDER BY sc.delivery_order DESC, sc.id_sales_cost DESC
  `;

  const lastSql = `
    SELECT
      sc.id_sales_cost,
      sc.id_truck,
      sc.id_driver,
      sc.delivery_order,
      sc.arrival_order,
      sc.finish_order,
      d.nama_driver,
      a.nama_area
    FROM sales_cost sc
    INNER JOIN (
      SELECT id_truck, MAX(delivery_order) AS max_delivery
      FROM sales_cost
      WHERE id_truck IS NOT NULL
      GROUP BY id_truck
    ) last ON last.id_truck = sc.id_truck AND last.max_delivery = sc.delivery_order
    LEFT JOIN driver d ON sc.id_driver = d.id_driver
    LEFT JOIN area a ON sc.id_area = a.id_area
    ORDER BY sc.delivery_order DESC, sc.id_sales_cost DESC
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
        delivery_order: toDateString(last.delivery_order),
        arrival_order: toDateString(last.arrival_order),
        finish_order: toDateString(last.finish_order),
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
        delivery_order: toDateString(transaksi.delivery_order),
        arrival_order: toDateString(transaksi.arrival_order),
        finish_order: toDateString(transaksi.finish_order),
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
  reverseGeocodeCoordinates,
  autoMapTruckWialonUnits,
  clearSession
};
