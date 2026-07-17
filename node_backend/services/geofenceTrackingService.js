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
            sc.finish_order_datetime IS NOT NULL
            AND CAST(sc.finish_order_datetime AS CHAR) <> '0000-00-00'
            AND sc.finish_order_datetime > ?
          )
          OR (
            (sc.finish_order_datetime IS NULL OR CAST(sc.finish_order_datetime AS CHAR) = '0000-00-00')
            AND (
              sc.arrival_datetime IS NULL
              OR CAST(sc.arrival_datetime AS CHAR) = '0000-00-00'
              OR sc.arrival_datetime >= ?
            )
          )
        )
      ORDER BY sc.id_truck ASC, sc.departure_datetime DESC, sc.id_sales_cost DESC
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
        AND sc.finish_order_datetime IS NULL
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
        scss.id_area_route_step,
        scss.step_name_snapshot,
        scss.estimated_arrival,
        t.no_police,
        a.nama_area
      FROM sales_cost_step_schedule scss
      INNER JOIN sales_cost sc ON scss.id_sales_cost = sc.id_sales_cost
      INNER JOIN truck t ON sc.id_truck = t.id_truck
      INNER JOIN area a ON sc.id_area = a.id_area
      WHERE scss.estimated_arrival < NOW()
        AND sc.finish_order_datetime IS NULL
        AND sc.departure_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND NOT EXISTS (
          SELECT 1 FROM sales_cost_route_history scrh
          WHERE scrh.id_sales_cost = scss.id_sales_cost
            AND scrh.id_area_route_step = scss.id_area_route_step
        )
        AND NOT EXISTS (
          SELECT 1 FROM delivery_notifications dn
          WHERE dn.id_sales_cost = scss.id_sales_cost
            AND dn.id_area_route_step = scss.id_area_route_step
            AND dn.is_dismissed = 0
        )
    `);

    for (const row of stepOverdueRows) {
      const arrivalStr = toMySqlDateTime(row.estimated_arrival);
      const message = `Truk ${row.no_police} seharusnya sudah tiba di ${row.step_name_snapshot} pada ${arrivalStr}. Truk belum trigger Geofence Area tersebut. Harap verifikasi posisi truk.`;
      await db.query(
        `INSERT INTO delivery_notifications
          (id_sales_cost, id_area_route_step, step_name, notification_type, truck_plate, route_name, scheduled_arrival, message)
         VALUES (?, ?, ?, 'arrival_overdue', ?, ?, ?, ?)`,
        [row.id_sales_cost, row.id_area_route_step, row.step_name_snapshot,
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

const resolveFinishGeofenceForSalesCost = (salesCost, fallbackFinishGeofence) => {
  const resourceId = normalizePositiveIntString(salesCost.finish_geofence_resource_id);
  const zoneId = normalizePositiveIntString(salesCost.finish_geofence_zone_id);
  const zoneName = String(salesCost.finish_geofence_zone_name || "").trim();

  if (resourceId && zoneId && zoneName) {
    return {
      resource_id: Number(resourceId),
      zone_id: Number(zoneId),
      zone_name: zoneName
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

const buildResourceZoneMap = (activeSalesCosts, routeStepsMap, fallbackFinishGeofence) => {
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

    const finishGeofence = resolveFinishGeofenceForSalesCost(
      salesCost,
      fallbackFinishGeofence
    );
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
  });

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
  const fallbackFinishGeofence = await findDefaultFinishGeofence();
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
    fallbackFinishGeofence
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
    const finishGeofence = resolveFinishGeofenceForSalesCost(
      salesCost,
      fallbackFinishGeofence
    );

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
    await checkArrivalDelays();
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


// ============================================================
// HISTORICAL BACKFILL
// ============================================================

const {
  fetchRawMessagesForUnit,
  fetchZonePolygons,
  pointInPolygon,
  loginIsolatedSession,
  logoutIsolatedSession
} = require("./wialonService");

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

  const areaIds = [...new Set(salesCosts.map(sc => Number(sc.id_area)))];
  const routeStepsMap = await fetchAreaRouteStepsMap(areaIds);

  const salesCostIds = salesCosts.map(sc => Number(sc.id_sales_cost));
  const placeholders = salesCostIds.map(() => '?').join(',');
  const [existingRows] = await db.query(
    `SELECT id_sales_cost, step_key FROM sales_cost_route_history WHERE id_sales_cost IN (${placeholders})`,
    salesCostIds
  );
  const existingKeys = new Set(existingRows.map(r => `${r.id_sales_cost}:${r.step_key}`));

  const zonePolygonCache = new Map();
  const getZonePolygon = async (resourceId, zoneId, sid) => {
    const cKey = String(resourceId);
    if (!zonePolygonCache.has(cKey)) {
      zonePolygonCache.set(cKey, await fetchZonePolygons(resourceId, sid));
    }
    return zonePolygonCache.get(cKey)?.get(String(zoneId)) || null;
  };

  let sid = null;
  try {
    sid = await loginIsolatedSession();
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

        const steps = routeStepsMap.get(Number(sc.id_area)) || [];
        if (steps.length === 0) { summary.skipped += 1; continue; }

        const scFrom = Math.max(fromTs, Math.floor(new Date(sc.departure_datetime).getTime() / 1000));
        const scTo = sc.finish_order_datetime
          ? Math.min(toTs, Math.floor(new Date(sc.finish_order_datetime).getTime() / 1000))
          : toTs;
        if (scFrom >= scTo) { summary.skipped += 1; continue; }

        const messages = await fetchRawMessagesForUnit({ sid, unitId, timeFrom: scFrom, timeTo: scTo });
        if (messages.length === 0) { summary.skipped += 1; continue; }

        for (const step of steps) {
          const stepKey = `route:${step.id_area_route_step}`;
          if (existingKeys.has(`${sc.id_sales_cost}:${stepKey}`)) continue;
          const resId = normalizePositiveIntString(step.wialon_resource_id);
          const zId = normalizePositiveIntString(step.wialon_zone_id);
          if (!resId || !zId) continue;
          const zoneData = await getZonePolygon(resId, zId, sid);
          if (!zoneData || zoneData.points.length < 3) continue;
          const hit = messages.find(m => pointInPolygon({ x: m.lon, y: m.lat }, zoneData.points));
          if (!hit) continue;
          const gpsTime = toMySqlDateTime(new Date(hit.t * 1000));
          await db.query(`
            INSERT IGNORE INTO sales_cost_route_history
              (id_sales_cost, id_area, id_area_route_step, step_key, system_step_code,
               id_truck, step_order_snapshot, step_name_snapshot,
               wialon_resource_id, wialon_zone_id, wialon_zone_name, gps_time, recorded_at, lat, lon)
            VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
          `, [sc.id_sales_cost, sc.id_area, step.id_area_route_step, stepKey,
             sc.id_truck, step.step_order, step.step_name,
             step.wialon_resource_id, step.wialon_zone_id, step.wialon_zone_name,
             gpsTime, hit.lat, hit.lon]);
          existingKeys.add(`${sc.id_sales_cost}:${stepKey}`);
          summary.inserted += 1;
        }

        const finishKey = DEFAULT_FINISH_STEP_KEY;
        if (!existingKeys.has(`${sc.id_sales_cost}:${finishKey}`)) {
          const fResId = normalizePositiveIntString(sc.finish_geofence_resource_id);
          const fZId = normalizePositiveIntString(sc.finish_geofence_zone_id);
          if (fResId && fZId) {
            const fZone = await getZonePolygon(fResId, fZId, sid);
            if (fZone && fZone.points.length >= 3) {
              const hit = messages.find(m => pointInPolygon({ x: m.lon, y: m.lat }, fZone.points));
              if (hit) {
                const gpsTime = toMySqlDateTime(new Date(hit.t * 1000));
                await db.query(`
                  INSERT IGNORE INTO sales_cost_route_history
                    (id_sales_cost, id_area, id_area_route_step, step_key, system_step_code,
                     id_truck, step_order_snapshot, step_name_snapshot,
                     wialon_resource_id, wialon_zone_id, wialon_zone_name, gps_time, recorded_at, lat, lon)
                  VALUES (?, ?, NULL, ?, ?, ?, ?, 'Finish Order', ?, ?, ?, ?, NOW(), ?, ?)
                `, [sc.id_sales_cost, sc.id_area, finishKey, DEFAULT_FINISH_STEP_CODE,
                   sc.id_truck, steps.length + 1,
                   sc.finish_geofence_resource_id, sc.finish_geofence_zone_id, sc.finish_geofence_zone_name,
                   gpsTime, hit.lat, hit.lon]);
                existingKeys.add(`${sc.id_sales_cost}:${finishKey}`);
                summary.inserted += 1;
              }
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
  detectAndRunStartupBackfill
};
