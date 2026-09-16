/**
 * Pure summary helpers for the Schedule Pengiriman list & export.
 * No DB / no Wialon — safe to unit test (see scripts/test-schedule-summary.js).
 *
 * Semantics (agreed):
 * - schedule_status is per-SPK, based on the planned finish ETA (per-stop lateness
 *   is surfaced per stop, it does NOT flip the whole SPK to overdue).
 * - "incomplete_finish" is intentionally NOT a status anymore.
 * - finish is detected from a single source of truth: the system:finish_order
 *   history row OR a finish stop that was hit.
 */

const DEFAULT_FINISH_STEP_KEY = "system:finish_order";

const parseDateSafe = (value) => {
  if (value == null || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

/**
 * Per-SPK schedule status.
 * @returns {{ schedule_status: "completed"|"overdue"|"on_trip"|"waiting" }}
 */
const resolveScheduleStatus = ({
  departureDatetime,
  arrivalDatetime,
  finishOrderDatetime,
  plannedFinishDatetime,
  finishHit
}) => {
  const now = new Date();
  const departure = departureDatetime ? new Date(departureDatetime) : null;
  const arrival = arrivalDatetime ? new Date(arrivalDatetime) : null;
  const plannedFinish = plannedFinishDatetime ? new Date(plannedFinishDatetime) : null;
  const finishCol = finishOrderDatetime ? new Date(finishOrderDatetime) : null;

  // Planned finish ETA: prefer finish-stop estimated_arrival, then
  // sc.finish_order_datetime (planned at create), then arrival.
  const overdueDeadline =
    (plannedFinish && !Number.isNaN(plannedFinish.getTime()) ? plannedFinish : null) ||
    (finishCol && !Number.isNaN(finishCol.getTime()) ? finishCol : null) ||
    arrival;

  // Actual completion = system:finish_order (see detectFinishHit)
  if (finishHit) {
    return { schedule_status: "completed" };
  }

  if (overdueDeadline && !Number.isNaN(overdueDeadline.getTime()) && overdueDeadline < now) {
    return { schedule_status: "overdue" };
  }

  if (departure && !Number.isNaN(departure.getTime()) && departure <= now) {
    return { schedule_status: "on_trip" };
  }

  return { schedule_status: "waiting" };
};

/**
 * Single source of truth for "delivery finished".
 * @param {Array} timeline - output of resolveStopTimelineSummary
 * @param {Array} historyRows - sales_cost_route_history rows
 */
const detectFinishHit = (timeline, historyRows) =>
  (Array.isArray(historyRows) && historyRows.some((h) => h.step_key === DEFAULT_FINISH_STEP_KEY)) ||
  (Array.isArray(timeline) && timeline.some((s) => s.is_finish && s.hit));

/**
 * Build per-stop timeline summary with hit / inferred / skipped flags.
 */
const resolveStopTimelineSummary = ({ deliveryStops, historyRows }) => {
  const safeStops = Array.isArray(deliveryStops) ? deliveryStops : [];
  const safeHistory = Array.isArray(historyRows) ? historyRows : [];

  const historyByStopId = new Map(
    safeHistory
      .filter((h) => h.id_sc_stop)
      .map((h) => [Number(h.id_sc_stop), h])
  );

  // system:finish_order is stored with id_sc_stop = NULL — find it via step_key as fallback
  const finishOrderHistory = safeHistory.find((h) => h.step_key === DEFAULT_FINISH_STEP_KEY) || null;

  const now = new Date();

  const baseStops = safeStops.map((stop) => {
    // For is_finish stops, also check system:finish_order history entry as fallback
    const historyEntry = historyByStopId.get(Number(stop.id))
      || (Number(stop.is_finish) === 1 ? finishOrderHistory : null);
    const hit = !!historyEntry;
    const overdue = !hit && !!stop.estimated_arrival && new Date(stop.estimated_arrival) < now;

    return {
      id: Number(stop.id),
      stop_order: Number(stop.stop_order),
      stop_name: stop.stop_name || "",
      wialon_zone_name: stop.wialon_zone_name || null,
      estimated_arrival: stop.estimated_arrival || null,
      is_departure: Number(stop.is_departure) === 1,
      is_finish: Number(stop.is_finish) === 1,
      hit,
      actual_arrival: hit ? historyEntry?.gps_time || null : null,
      is_manual: historyEntry?.is_manual === 1,
      gps_lat: hit ? (historyEntry?.lat || null) : null,
      gps_lon: hit ? (historyEntry?.lon || null) : null,
      inferred_passed: false,
      geofence_skipped: false,
      overdue
    };
  });

  const hasAnyVisitedAfterDeparture = baseStops.some((stop) => !stop.is_departure && stop.hit);
  const finishHit = detectFinishHit(baseStops, safeHistory);

  return baseStops.map((stop) => {
    if (stop.is_departure && !stop.hit && hasAnyVisitedAfterDeparture) {
      return {
        ...stop,
        inferred_passed: true,
        overdue: false
      };
    }

    // Middle stop never GPS-hit after SPK finished (loose finish / skip tujuan)
    if (
      finishHit &&
      !stop.hit &&
      !stop.is_departure &&
      !stop.is_finish
    ) {
      return {
        ...stop,
        geofence_skipped: true,
        overdue: false
      };
    }

    return stop;
  });
};

/**
 * Progress over middle ("tujuan") stops only.
 * A stop counts as reached when hit, or resolved by the loose-finish flow
 * (inferred_passed / geofence_skipped).
 * @returns {{ total_stops: number, visited_stops: number }}
 */
const summarizeStopProgress = (timeline) => {
  const safeTimeline = Array.isArray(timeline) ? timeline : [];
  const middle = safeTimeline.filter((s) => !s.is_departure && !s.is_finish);
  return {
    total_stops: middle.length,
    visited_stops: middle.filter((s) => s.hit || s.geofence_skipped || s.inferred_passed).length
  };
};

module.exports = {
  DEFAULT_FINISH_STEP_KEY,
  parseDateSafe,
  resolveScheduleStatus,
  detectFinishHit,
  resolveStopTimelineSummary,
  summarizeStopProgress
};
