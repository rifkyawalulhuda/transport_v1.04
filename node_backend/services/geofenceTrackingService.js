const db = require("../db");
const {
  fetchAreaRouteStepsMap
} = require("./areaRouteService");
const {
  fetchWialonGeofences,
  fetchUnitsInZonesByResource,
  getUnitPositionMap
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

const getActiveSalesCostCandidates = async () => {
  const todayString = toDateString(new Date());
  const [rows] = await db.query(
    `
      SELECT
        sc.id_sales_cost,
        sc.id_area,
        sc.id_truck,
        sc.delivery_order,
        sc.arrival_order,
        sc.finish_order,
        t.wialon_unit_id
      FROM sales_cost sc
      INNER JOIN truck t ON sc.id_truck = t.id_truck
      WHERE sc.id_truck IS NOT NULL
        AND t.wialon_unit_id IS NOT NULL
        AND t.wialon_unit_id <> ''
        AND EXISTS (
          SELECT 1
          FROM area_route_step ars
          WHERE ars.id_area = sc.id_area
        )
        AND (
          (
            sc.finish_order IS NOT NULL
            AND sc.finish_order <> '0000-00-00'
            AND sc.finish_order > ?
          )
          OR (
            (sc.finish_order IS NULL OR sc.finish_order = '0000-00-00')
            AND (
              sc.arrival_order IS NULL
              OR sc.arrival_order = '0000-00-00'
              OR sc.arrival_order >= ?
            )
          )
        )
      ORDER BY sc.id_truck ASC, sc.delivery_order DESC, sc.id_sales_cost DESC
    `,
    [todayString, todayString]
  );

  const pickedByTruck = new Map();
  rows.forEach((row) => {
    const truckKey = String(row.id_truck || "");
    if (!truckKey || pickedByTruck.has(truckKey)) {
      return;
    }
    pickedByTruck.set(truckKey, {
      id_sales_cost: Number(row.id_sales_cost),
      id_area: Number(row.id_area),
      id_truck: Number(row.id_truck),
      wialon_unit_id: normalizePositiveIntString(row.wialon_unit_id)
    });
  });

  return Array.from(pickedByTruck.values()).filter(
    (item) => item.id_sales_cost && item.id_area && item.id_truck && item.wialon_unit_id
  );
};

const fetchExistingHistoryKeys = async (salesCostIds) => {
  if (!Array.isArray(salesCostIds) || salesCostIds.length === 0) {
    return new Set();
  }

  const placeholders = salesCostIds.map(() => "?").join(",");
  const [rows] = await db.query(
    `
      SELECT id_sales_cost, id_area_route_step, step_key
      FROM sales_cost_route_history
      WHERE id_sales_cost IN (${placeholders})
    `,
    salesCostIds
  );

  return new Set(
    rows.map((row) => {
      const fallbackKey =
        row.id_area_route_step === null || row.id_area_route_step === undefined
          ? ""
          : `route:${Number(row.id_area_route_step)}`;
      return `${Number(row.id_sales_cost)}:${row.step_key || fallbackKey}`;
    })
  );
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

const buildResourceZoneMap = (activeSalesCosts, routeStepsMap, finishGeofence) => {
  const resourceMap = new Map();

  activeSalesCosts.forEach((salesCost) => {
    const steps = routeStepsMap.get(Number(salesCost.id_area)) || [];
    steps.forEach((step) => {
      const resourceId = normalizePositiveIntString(step.wialon_resource_id);
      const zoneId = normalizePositiveIntString(step.wialon_zone_id);
      if (!resourceId || !zoneId) {
        return;
      }

      if (!resourceMap.has(resourceId)) {
        resourceMap.set(resourceId, new Set());
      }
      resourceMap.get(resourceId).add(zoneId);
    });
  });

  if (finishGeofence?.resource_id && finishGeofence?.zone_id) {
    const resourceId = normalizePositiveIntString(finishGeofence.resource_id);
    const zoneId = normalizePositiveIntString(finishGeofence.zone_id);
    if (resourceId && zoneId) {
      if (!resourceMap.has(resourceId)) {
        resourceMap.set(resourceId, new Set());
      }
      resourceMap.get(resourceId).add(zoneId);
    }
  }

  return resourceMap;
};

const syncGeofenceRouteHistory = async () => {
  const activeSalesCosts = await getActiveSalesCostCandidates();
  if (activeSalesCosts.length === 0) {
    return {
      active: 0,
      inserted: 0
    };
  }

  const routeStepsMap = await fetchAreaRouteStepsMap(
    activeSalesCosts.map((salesCost) => salesCost.id_area)
  );
  const finishGeofence = await findDefaultFinishGeofence();
  const salesCostsWithSteps = activeSalesCosts.filter((salesCost) => {
    const steps = routeStepsMap.get(Number(salesCost.id_area)) || [];
    return steps.length > 0;
  });

  if (salesCostsWithSteps.length === 0) {
    return {
      active: activeSalesCosts.length,
      inserted: 0
    };
  }

  const existingHistoryKeys = await fetchExistingHistoryKeys(
    salesCostsWithSteps.map((salesCost) => salesCost.id_sales_cost)
  );
  const resourceZoneMap = buildResourceZoneMap(
    salesCostsWithSteps,
    routeStepsMap,
    finishGeofence
  );
  const unitIds = salesCostsWithSteps
    .map((salesCost) => salesCost.wialon_unit_id)
    .filter(Boolean);

  const membershipResults = await Promise.all(
    Array.from(resourceZoneMap.entries()).map(async ([resourceId, zoneIdSet]) => {
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

  let inserted = 0;
  for (const salesCost of salesCostsWithSteps) {
    const steps = routeStepsMap.get(Number(salesCost.id_area)) || [];
    const unitId = normalizePositiveIntString(salesCost.wialon_unit_id);
    const position = positionMap.get(unitId) || null;
    const gpsTime =
      toMySqlDateTime(position?.gps_time) || toMySqlDateTime(new Date());

    for (const step of steps) {
      const stepKey = `route:${step.id_area_route_step}`;
      const historyKey = `${salesCost.id_sales_cost}:${stepKey}`;
      if (existingHistoryKeys.has(historyKey)) {
        continue;
      }

      const resourceId = normalizePositiveIntString(step.wialon_resource_id);
      const zoneId = normalizePositiveIntString(step.wialon_zone_id);
      const membershipForResource = membershipByResource.get(resourceId);
      const unitsInZone = membershipForResource?.get(zoneId);
      if (!unitsInZone || !unitsInZone.has(unitId)) {
        continue;
      }

      await db.query(
        `
          INSERT INTO sales_cost_route_history (
            id_sales_cost,
            id_area,
            id_area_route_step,
            step_key,
            system_step_code,
            id_truck,
            step_order_snapshot,
            step_name_snapshot,
            wialon_resource_id,
            wialon_zone_id,
            wialon_zone_name,
            gps_time,
            lat,
            lon
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          salesCost.id_sales_cost,
          salesCost.id_area,
          step.id_area_route_step,
          stepKey,
          null,
          salesCost.id_truck,
          step.step_order,
          step.step_name,
          step.wialon_resource_id,
          step.wialon_zone_id,
          step.wialon_zone_name,
          gpsTime,
          position?.lat ?? null,
          position?.lon ?? null
        ]
      );

      existingHistoryKeys.add(historyKey);
      inserted += 1;
    }

    const allRouteStepsVisited = steps.every((step) =>
      existingHistoryKeys.has(`${salesCost.id_sales_cost}:route:${step.id_area_route_step}`)
    );
    const finishHistoryKey = `${salesCost.id_sales_cost}:${DEFAULT_FINISH_STEP_KEY}`;
    if (!allRouteStepsVisited || existingHistoryKeys.has(finishHistoryKey) || !finishGeofence) {
      continue;
    }

    const finishResourceId = normalizePositiveIntString(finishGeofence.resource_id);
    const finishZoneId = normalizePositiveIntString(finishGeofence.zone_id);
    const finishMembership =
      membershipByResource.get(finishResourceId)?.get(finishZoneId) || null;
    if (!finishMembership || !finishMembership.has(unitId)) {
      continue;
    }

    await db.query(
      `
        INSERT INTO sales_cost_route_history (
          id_sales_cost,
          id_area,
          id_area_route_step,
          step_key,
          system_step_code,
          id_truck,
          step_order_snapshot,
          step_name_snapshot,
          wialon_resource_id,
          wialon_zone_id,
          wialon_zone_name,
          gps_time,
          lat,
          lon
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        salesCost.id_sales_cost,
        salesCost.id_area,
        null,
        DEFAULT_FINISH_STEP_KEY,
        DEFAULT_FINISH_STEP_CODE,
        salesCost.id_truck,
        steps.length + 1,
        "Finish Order",
        finishGeofence.resource_id,
        finishGeofence.zone_id,
        finishGeofence.zone_name,
        gpsTime,
        position?.lat ?? null,
        position?.lon ?? null
      ]
    );

    existingHistoryKeys.add(finishHistoryKey);
    inserted += 1;
  }

  return {
    active: salesCostsWithSteps.length,
    inserted
  };
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

const stopGeofenceTracking = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  started = false;
};

module.exports = {
  startGeofenceTracking,
  stopGeofenceTracking,
  syncGeofenceRouteHistory
};
