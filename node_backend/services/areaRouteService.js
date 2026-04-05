const db = require("../db");

const normalizeText = (value) => String(value || "").trim();

const normalizePositiveInt = (value) => {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const parseLegacyAreaName = (namaArea) => {
  const rawName = normalizeText(namaArea);
  if (!rawName) {
    return {
      kode_area: null,
      step_names: []
    };
  }

  const segments = rawName
    .split("-")
    .map((segment) => normalizeText(segment))
    .filter(Boolean);

  if (segments.length === 0) {
    return {
      kode_area: null,
      step_names: []
    };
  }

  const [firstSegment, ...restSegments] = segments;
  const kodeArea = /^[0-9]+$/.test(firstSegment.replace(/\s+/g, ""))
    ? firstSegment.replace(/\s+/g, "")
    : null;

  return {
    kode_area: kodeArea,
    step_names: kodeArea ? restSegments : segments
  };
};

const buildAreaName = ({ kodeArea, routeSteps, fallbackName = "" }) => {
  const normalizedSteps = Array.isArray(routeSteps)
    ? routeSteps
        .map((step) => normalizeText(step?.step_name))
        .filter(Boolean)
    : [];

  if (normalizedSteps.length === 0) {
    return normalizeText(fallbackName);
  }

  const parts = [];
  const safeKodeArea = normalizeText(kodeArea);
  if (safeKodeArea) {
    parts.push(safeKodeArea);
  }

  parts.push(...normalizedSteps);
  return parts.join("-");
};

const normalizeRouteSteps = (routeSteps) => {
  if (!Array.isArray(routeSteps)) {
    return [];
  }

  return routeSteps.map((step, index) => ({
    id_area_route_step: normalizePositiveInt(step?.id_area_route_step),
    step_order: normalizePositiveInt(step?.step_order) || index + 1,
    step_name: normalizeText(step?.step_name),
    wialon_resource_id: normalizePositiveInt(step?.wialon_resource_id),
    wialon_zone_id: normalizePositiveInt(step?.wialon_zone_id),
    wialon_zone_name: normalizeText(step?.wialon_zone_name)
  }));
};

const normalizeFinishGeofence = (finishGeofence) => {
  if (!finishGeofence || typeof finishGeofence !== "object") {
    return {
      finish_geofence_resource_id: null,
      finish_geofence_zone_id: null,
      finish_geofence_zone_name: ""
    };
  }

  return {
    finish_geofence_resource_id: normalizePositiveInt(finishGeofence.finish_geofence_resource_id),
    finish_geofence_zone_id: normalizePositiveInt(finishGeofence.finish_geofence_zone_id),
    finish_geofence_zone_name: normalizeText(finishGeofence.finish_geofence_zone_name)
  };
};

const validateStructuredRouteSteps = (routeSteps) => {
  if (!Array.isArray(routeSteps) || routeSteps.length === 0) {
    return {
      ok: false,
      message: "Minimal 1 langkah rute wajib diisi."
    };
  }

  const orderedSteps = [...routeSteps].sort((a, b) => a.step_order - b.step_order);
  const seenStepOrder = new Set();
  const seenZoneKeys = new Set();

  for (let index = 0; index < orderedSteps.length; index += 1) {
    const step = orderedSteps[index];
    const expectedOrder = index + 1;
    if (step.step_order !== expectedOrder) {
      return {
        ok: false,
        message: "Urutan langkah rute harus berurutan mulai dari 1."
      };
    }

    if (!step.step_name) {
      return {
        ok: false,
        message: `Nama langkah rute ke-${expectedOrder} wajib diisi.`
      };
    }

    if (!step.wialon_resource_id || !step.wialon_zone_id || !step.wialon_zone_name) {
      return {
        ok: false,
        message: `Geofence Wialon pada langkah rute ke-${expectedOrder} wajib dipilih.`
      };
    }

    if (seenStepOrder.has(step.step_order)) {
      return {
        ok: false,
        message: "Urutan langkah rute tidak boleh duplikat."
      };
    }

    const zoneKey = `${step.wialon_resource_id}:${step.wialon_zone_id}`;
    if (seenZoneKeys.has(zoneKey)) {
      return {
        ok: false,
        message: "Geofence yang sama tidak boleh dipakai lebih dari sekali pada satu rute."
      };
    }

    seenStepOrder.add(step.step_order);
    seenZoneKeys.add(zoneKey);
  }

  return {
    ok: true,
    routeSteps: orderedSteps
  };
};

const resolveAreaPayload = (body) => {
  const hasStructuredSteps = Object.prototype.hasOwnProperty.call(body || {}, "route_steps");
  const safeKodeArea = normalizeText(body?.kode_area);
  const normalizedFinishGeofence = normalizeFinishGeofence(body);
  const finishGeofenceIsFilled =
    normalizedFinishGeofence.finish_geofence_resource_id &&
    normalizedFinishGeofence.finish_geofence_zone_id &&
    normalizedFinishGeofence.finish_geofence_zone_name;
  const finishGeofenceIsEmpty =
    !normalizedFinishGeofence.finish_geofence_resource_id &&
    !normalizedFinishGeofence.finish_geofence_zone_id &&
    !normalizedFinishGeofence.finish_geofence_zone_name;

  if (!finishGeofenceIsFilled && !finishGeofenceIsEmpty) {
    return {
      ok: false,
      message: "Finish Order Geofence harus dipilih lengkap."
    };
  }

  if (hasStructuredSteps) {
    const normalizedSteps = normalizeRouteSteps(body?.route_steps);
    const validation = validateStructuredRouteSteps(normalizedSteps);
    if (!validation.ok) {
      return validation;
    }

    return {
      ok: true,
      kodeArea: safeKodeArea || null,
      namaArea: buildAreaName({
        kodeArea: safeKodeArea,
        routeSteps: validation.routeSteps
      }),
      routeSteps: validation.routeSteps,
      finishGeofence: finishGeofenceIsFilled ? normalizedFinishGeofence : null
    };
  }

  const namaArea = normalizeText(body?.nama_area);
  if (!namaArea) {
    return {
      ok: false,
      message: "Nama area wajib diisi."
    };
  }

  const parsedLegacy = parseLegacyAreaName(namaArea);
  return {
    ok: true,
    kodeArea: safeKodeArea || parsedLegacy.kode_area || null,
    namaArea,
    routeSteps: [],
    finishGeofence: finishGeofenceIsFilled ? normalizedFinishGeofence : null
  };
};

const fetchAreaRouteStepsMap = async (areaIds, queryable = db) => {
  if (!Array.isArray(areaIds) || areaIds.length === 0) {
    return new Map();
  }

  const normalizedIds = Array.from(
    new Set(areaIds.map((id) => normalizePositiveInt(id)).filter(Boolean))
  );
  if (normalizedIds.length === 0) {
    return new Map();
  }

  const placeholders = normalizedIds.map(() => "?").join(",");
  const [rows] = await queryable.query(
    `
      SELECT
        id_area_route_step,
        id_area,
        step_order,
        step_name,
        wialon_resource_id,
        wialon_zone_id,
        wialon_zone_name
      FROM area_route_step
      WHERE id_area IN (${placeholders})
      ORDER BY id_area ASC, step_order ASC
    `,
    normalizedIds
  );

  const routeStepsMap = new Map();
  normalizedIds.forEach((id) => {
    routeStepsMap.set(id, []);
  });

  rows.forEach((row) => {
    const key = Number(row.id_area);
    if (!routeStepsMap.has(key)) {
      routeStepsMap.set(key, []);
    }
    routeStepsMap.get(key).push({
      id_area_route_step: Number(row.id_area_route_step),
      step_order: Number(row.step_order),
      step_name: row.step_name || "",
      wialon_resource_id: Number(row.wialon_resource_id),
      wialon_zone_id: Number(row.wialon_zone_id),
      wialon_zone_name: row.wialon_zone_name || ""
    });
  });

  return routeStepsMap;
};

const attachRouteStepsToAreas = async (areas, queryable = db) => {
  if (!Array.isArray(areas) || areas.length === 0) {
    return [];
  }

  const routeStepsMap = await fetchAreaRouteStepsMap(
    areas.map((area) => area.id_area),
    queryable
  );

  return areas.map((area) => ({
    ...area,
    kode_area: area.kode_area || null,
    route_steps: routeStepsMap.get(Number(area.id_area)) || []
  }));
};

module.exports = {
  attachRouteStepsToAreas,
  buildAreaName,
  fetchAreaRouteStepsMap,
  normalizeRouteSteps,
  normalizeFinishGeofence,
  parseLegacyAreaName,
  resolveAreaPayload
};
