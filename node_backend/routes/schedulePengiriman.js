const express = require("express");
const db = require("../db");
const ExcelJS = require("exceljs");
const SalesCostDN = require("../models/SalesCostDN");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const pad2 = (value) => String(value).padStart(2, "0");

const toLocalDateString = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const formatDateValue = (value) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return toLocalDateString(value);
  }
  const str = String(value);
  return str.includes("T") ? str.split("T")[0] : str;
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveScheduleStatus = ({
  departureDatetime,
  arrivalDatetime,
  finishOrderDatetime,
  plannedFinishDatetime,
  finishHit,
  visitedStops,
  totalStops
}) => {
  const now = new Date();
  const departure = departureDatetime ? new Date(departureDatetime) : null;
  const arrival = arrivalDatetime ? new Date(arrivalDatetime) : null;
  const plannedFinish = plannedFinishDatetime ? new Date(plannedFinishDatetime) : null;
  const finishCol = finishOrderDatetime ? new Date(finishOrderDatetime) : null;

  // Planned finish ETA: prefer finish-stop estimated_arrival, then sc.finish_order_datetime (often planned at create), then arrival
  const overdueDeadline =
    (plannedFinish && !Number.isNaN(plannedFinish.getTime()) ? plannedFinish : null) ||
    (finishCol && !Number.isNaN(finishCol.getTime()) ? finishCol : null) ||
    arrival;

  // Actual completion = system:finish_order only (not sc.finish_order_datetime)
  if (finishHit) {
    return {
      schedule_status: "completed",
      has_incomplete_finish: false
    };
  }

  // Overdue: planned finish ETA passed and not GPS/manual finished yet
  if (overdueDeadline && !Number.isNaN(overdueDeadline.getTime()) && overdueDeadline < now && !finishHit) {
    return {
      schedule_status: "overdue",
      has_incomplete_finish: false
    };
  }

  if (departure && !Number.isNaN(departure.getTime()) && departure <= now) {
    return {
      schedule_status: "on_trip",
      has_incomplete_finish: false
    };
  }

  return {
    schedule_status: "waiting",
    has_incomplete_finish: false
  };
};

const resolveStopTimelineSummary = ({ deliveryStops, historyRows }) => {
  const historyByStopId = new Map(
    historyRows
      .filter((h) => h.id_sc_stop)
      .map((h) => [Number(h.id_sc_stop), h])
  );

  // system:finish_order is stored with id_sc_stop = NULL — find it via step_key as fallback
  const finishOrderHistory = historyRows.find((h) => h.step_key === 'system:finish_order') || null;

  const now = new Date();

  const baseStops = deliveryStops.map((stop) => {
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
      incomplete_finish: false,
      geofence_skipped: false,
      overdue
    };
  });

  const hasAnyVisitedAfterDeparture = baseStops.some((stop) => !stop.is_departure && stop.hit);
  const finishHit = !!finishOrderHistory || baseStops.some((stop) => stop.is_finish && stop.hit);

  return baseStops.map((stop) => {
    if (stop.is_departure && !stop.hit && hasAnyVisitedAfterDeparture) {
      return {
        ...stop,
        inferred_passed: true
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

const resolveDateRange = (startParam, endParam) => {
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  let endDate = endParam ? new Date(endParam) : null;
  if (!endDate || Number.isNaN(endDate.getTime())) {
    endDate = todayDate;
  }

  let startDate = startParam ? new Date(startParam) : null;
  if (!startDate || Number.isNaN(startDate.getTime())) {
    startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);
  }

  if (startDate.getTime() > endDate.getTime()) {
    const temp = startDate;
    startDate = endDate;
    endDate = temp;
  }

  return {
    startDate: toLocalDateString(startDate),
    endDate: toLocalDateString(endDate)
  };
};

router.get("/export", authenticateToken, async (req, res) => {
  try {
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;

    // Build WHERE conditions
    const conditions = [];
    const params = [];
    if (startDate) {
      conditions.push("sc.departure_datetime >= ?");
      params.push(startDate);
    }
    if (endDate) {
      conditions.push("sc.departure_datetime <= ?");
      params.push(`${endDate} 23:59:59`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // Fetch all matching sales cost rows (no pagination)
    const sql = `
      SELECT
        sc.id_sales_cost, sc.departure_datetime, sc.arrival_datetime,
        sc.finish_order_datetime, sc.no_po, sc.jenis_trip, sc.trip,
        t.no_police, d.nama_driver, c.nama_customer, a.nama_area
      FROM sales_cost sc
      LEFT JOIN truck t ON sc.id_truck = t.id_truck
      LEFT JOIN driver d ON sc.id_driver = d.id_driver
      LEFT JOIN customer c ON sc.id_customer = c.id_customer
      LEFT JOIN area a ON sc.id_area = a.id_area
      ${whereClause}
      ORDER BY sc.departure_datetime DESC, sc.id_sales_cost DESC
    `;
    const [rows] = await db.query(sql, params);

    if (!rows.length) {
      return res.status(404).json({ message: "Tidak ada data untuk periode ini." });
    }

    // Fetch delivery stops and route history for all matching IDs
    const ids = rows.map((r) => r.id_sales_cost);
    const placeholders = ids.map(() => "?").join(",");

    const [stopRows] = await db.query(
      `SELECT id, id_sales_cost, stop_order, stop_name,
              wialon_zone_name, is_departure, is_finish, estimated_arrival
       FROM sales_cost_step_schedule
       WHERE id_sales_cost IN (${placeholders})
       ORDER BY id_sales_cost ASC, stop_order ASC`,
      ids
    );

    const [historyRows] = await db.query(
      `SELECT id_sc_stop, id_sales_cost, step_key, gps_time, recorded_at, is_manual, lat, lon
       FROM sales_cost_route_history
       WHERE id_sales_cost IN (${placeholders})
       ORDER BY id_sales_cost ASC, recorded_at ASC`,
      ids
    );

    // Group stops and history by sales_cost id
    const stopsBySC = new Map();
    for (const stop of stopRows) {
      const key = Number(stop.id_sales_cost);
      if (!stopsBySC.has(key)) stopsBySC.set(key, []);
      stopsBySC.get(key).push(stop);
    }

    const historyBySC = new Map();
    for (const h of historyRows) {
      const key = Number(h.id_sales_cost);
      if (!historyBySC.has(key)) historyBySC.set(key, []);
      historyBySC.get(key).push(h);
    }

    // Format datetime helper
    const fmtDt = (val) => {
      if (!val) return "-";
      const d = val instanceof Date ? val : new Date(val);
      if (isNaN(d.getTime())) return String(val);
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    // Build Excel workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Schedule Pengiriman");

    sheet.columns = [
      { header: "No.", key: "no", width: 6 },
      { header: "No. SPK", key: "spk", width: 12 },
      { header: "No. Polisi", key: "nopol", width: 14 },
      { header: "Driver", key: "driver", width: 22 },
      { header: "Customer", key: "customer", width: 24 },
      { header: "Rute", key: "rute", width: 24 },
      { header: "Trip", key: "trip", width: 10 },
      { header: "Jenis Trip", key: "jenis_trip", width: 14 },
      { header: "No. PO", key: "no_po", width: 16 },
      { header: "Status SPK", key: "status_spk", width: 16 },
      { header: "Stop", key: "stop_name", width: 20 },
      { header: "Nama Geofence", key: "geofence_name", width: 24 },
      { header: "Estimasi Tiba", key: "est_arrival", width: 20 },
      { header: "Aktual Tiba", key: "actual_arrival", width: 20 },
      { header: "Status Stop", key: "stop_status", width: 14 },
      { header: "Sumber Aktual", key: "source", width: 16 },
      { header: "Koordinat GPS", key: "gps_coords", width: 28 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    const statusLabel = (s) => {
      if (s === "completed") return "Selesai";
      if (s === "overdue") return "Terlambat";
      if (s === "on_trip") return "Dalam Perjalanan";
      if (s === "waiting") return "Menunggu";
      if (s === "incomplete_finish") return "Belum Lengkap";
      return s || "-";
    };

    let rowNo = 1;
    let excelRow = 2; // Excel row index (1=header)
    let groupIndex = 0; // alternating group color counter
    const mergeGroups = []; // { startRow, endRow } per SPK dengan >1 stop

    // Two alternating group colors: white and light blue-gray
    const GROUP_COLORS = ["FFFFFFFF", "FFEBF3FB"];

    for (const sc of rows) {
      const scId = Number(sc.id_sales_cost);
      const stops = stopsBySC.get(scId) || [];
      const history = historyBySC.get(scId) || [];

      // Compute schedule_status using resolveStopTimelineSummary
      const timeline = resolveStopTimelineSummary({ deliveryStops: stops, historyRows: history });
      const finishHit = timeline.some((s) => s.is_finish && s.hit);
      const visitedStops = timeline.filter((s) => !s.is_departure && !s.is_finish && s.hit).length;
      const totalStops = timeline.filter((s) => !s.is_departure && !s.is_finish).length;
      const plannedFinish =
        timeline.find((s) => s.is_finish)?.estimated_arrival ||
        stops.find((s) => Number(s.is_finish) === 1)?.estimated_arrival ||
        null;
      const { schedule_status } = resolveScheduleStatus({
        departureDatetime: sc.departure_datetime,
        arrivalDatetime: sc.arrival_datetime,
        finishOrderDatetime: sc.finish_order_datetime,
        plannedFinishDatetime: plannedFinish,
        finishHit,
        visitedStops,
        totalStops,
      });

      const groupColor = GROUP_COLORS[groupIndex % 2];
      groupIndex++;

      if (stops.length === 0) {
        // No stops — one row only
        const r = sheet.addRow({
          no: rowNo++,
          spk: scId,
          nopol: sc.no_police || "-",
          driver: sc.nama_driver || "-",
          customer: sc.nama_customer || "-",
          rute: sc.nama_area || "-",
          trip: sc.trip || "-",
          jenis_trip: sc.jenis_trip || "-",
          no_po: sc.no_po || "-",
          status_spk: statusLabel(schedule_status),
          stop_name: "-",
          geofence_name: "-",
          est_arrival: "-",
          actual_arrival: "-",
          stop_status: "-",
          source: "-",
          gps_coords: "-",
        });
        r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: groupColor } };
        r.alignment = { vertical: "middle" };
        excelRow++;
      } else {
        const groupStartRow = excelRow;
        const stopCount = timeline.length;

        for (let si = 0; si < timeline.length; si++) {
          const stop = timeline[si];
          const stopStatus = stop.hit
            ? "Tercapai"
            : stop.geofence_skipped
              ? "Geofence dilewati"
              : stop.inferred_passed
                ? "Terlewati (Otomatis)"
                : stop.overdue
                  ? "Terlambat"
                  : "Pending";
          const source = stop.hit
            ? (stop.is_manual ? "Manual" : "GPS")
            : "-";

          const rowData = {
            // Only fill SPK info on the first stop row; leave blank for subsequent rows
            no: si === 0 ? rowNo : "",
            spk: si === 0 ? scId : "",
            nopol: si === 0 ? (sc.no_police || "-") : "",
            driver: si === 0 ? (sc.nama_driver || "-") : "",
            customer: si === 0 ? (sc.nama_customer || "-") : "",
            rute: si === 0 ? (sc.nama_area || "-") : "",
            trip: si === 0 ? (sc.trip || "-") : "",
            jenis_trip: si === 0 ? (sc.jenis_trip || "-") : "",
            no_po: si === 0 ? (sc.no_po || "-") : "",
            status_spk: si === 0 ? statusLabel(schedule_status) : "",
            // Stop-specific columns always filled
            stop_name: stop.stop_name || "-",
            geofence_name: stop.wialon_zone_name || "-",
            est_arrival: fmtDt(stop.estimated_arrival),
            actual_arrival: fmtDt(stop.actual_arrival),
            stop_status: stopStatus,
            source,
            gps_coords: (stop.gps_lat && stop.gps_lon)
              ? `${Number(stop.gps_lat).toFixed(6)}, ${Number(stop.gps_lon).toFixed(6)}`
              : "-",
          };

          const r = sheet.addRow(rowData);
          r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: groupColor } };
          // First row of group: align top so merged cell text appears at top
          r.alignment = { vertical: si === 0 ? "top" : "middle" };
          excelRow++;
        }

        rowNo++;

        // Track groups with >1 stop for merging
        if (stopCount > 1) {
          mergeGroups.push({ startRow: groupStartRow, endRow: groupStartRow + stopCount - 1 });
        }
      }
    }

    // Apply cell merging for columns 1–10 on multi-stop groups
    // Must be done AFTER all rows are written and fills applied
    for (const { startRow, endRow } of mergeGroups) {
      for (let col = 1; col <= 10; col++) {
        sheet.mergeCells(startRow, col, endRow, col);
        // Re-apply alignment on merged cell (merge resets it)
        const cell = sheet.getCell(startRow, col);
        cell.alignment = { vertical: "top", wrapText: false };
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const filename = `schedule-pengiriman_${today}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export schedule pengiriman error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", authenticateToken, async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    let pageSize = parsePositiveInt(req.query.pageSize, 10);
    pageSize = Math.min(pageSize, 100);

    const sortableColumns = {
      departure_datetime: "sc.departure_datetime",
      no_police: "t.no_police",
      driver: "d.nama_driver",
      customer: "c.nama_customer",
      route: "a.nama_area",
      arrival: "sc.arrival_datetime",
      no_po: "sc.no_po",
      jenis_pengiriman: "sc.jenis_trip",
      trip: "sc.trip"
    };
    const sortBy = String(req.query.sort_by || "departure_datetime").trim().toLowerCase();
    const sortDirRaw = String(req.query.sort_dir || "asc").trim().toLowerCase();
    const sortDir = sortDirRaw === "desc" ? "DESC" : "ASC";
    const sortColumn = sortableColumns[sortBy] || sortableColumns.departure_datetime;

    const search = String(req.query.search || "").trim();
    const statusFilter = String(req.query.status || "").trim().toLowerCase();
    const validStatuses = ["waiting", "on_trip", "overdue", "completed", "incomplete_finish"];
    const useStatusFilter = validStatuses.includes(statusFilter);
    // Parse spk_ids param — comma-separated list of sales cost IDs from Monitoring Kendaraan
    const spkIds = req.query.spk_ids
      ? String(req.query.spk_ids).split(',')
          .map(id => parseInt(id.trim(), 10))
          .filter(id => Number.isFinite(id) && id > 0)
      : [];
    const { startDate, endDate } = resolveDateRange(
      req.query.start_date,
      req.query.end_date
    );

    const conditions = [];
    const params = [];

    if (spkIds.length === 0) {
      if (startDate) {
        conditions.push("sc.departure_datetime >= ?");
        params.push(startDate);
      }

      if (endDate) {
        conditions.push("sc.departure_datetime <= ?");
        params.push(`${endDate} 23:59:59`);
      }
    }

    if (spkIds.length > 0) {
      const placeholders = spkIds.map(() => '?').join(',');
      conditions.push(`sc.id_sales_cost IN (${placeholders})`);
      params.push(...spkIds);
    }

    if (search) {
      const like = `%${search}%`;
      const searchConditions = [
        "CAST(sc.id_sales_cost AS CHAR) LIKE ?",
        "CONCAT(sc.id_sales_cost, ' /SPK/CLC') LIKE ?",
        "sc.no_po LIKE ?",
        "sc.no_aju LIKE ?",
        "t.no_police LIKE ?",
        "d.nama_driver LIKE ?",
        "c.nama_customer LIKE ?"
      ];
      const searchParams = searchConditions.map(() => like);
      const dnSearch = escapeRegExp(search);
      const dnDocs = await SalesCostDN.find(
        {
          $or: [
            { "items.no_dn": { $regex: dnSearch, $options: "i" } },
            { "items.no_aju": { $regex: dnSearch, $options: "i" } }
          ]
        },
        { salesCostId: 1 }
      ).lean();
      const dnIdSet = new Set(
        dnDocs
          .map((doc) => Number(doc.salesCostId))
          .filter((id) => Number.isFinite(id))
      );
      if (dnIdSet.size > 0) {
        const dnIds = Array.from(dnIdSet);
        const placeholders = dnIds.map(() => "?").join(",");
        searchConditions.push(`sc.id_sales_cost IN (${placeholders})`);
        searchParams.push(...dnIds);
      }
      conditions.push(`(${searchConditions.join(" OR ")})`);
      params.push(...searchParams);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // Shared helper: given a set of DB rows, fetch all related data and build response objects
    const buildResponseRows = async (rows) => {
      const ids = rows
        .map((row) => Number(row.id_sales_cost))
        .filter((id) => Number.isFinite(id));
      let dnDocs = [];
      if (ids.length > 0) {
        dnDocs = await SalesCostDN.find({ salesCostId: { $in: ids } }).lean();
      }

      const dnMap = new Map();
      dnDocs.forEach((doc) => {
        const items = Array.isArray(doc.items) ? doc.items : [];
        dnMap.set(Number(doc.salesCostId), items);
      });

      const stopSummaryMap = new Map();
      if (ids.length > 0) {
        const placeholders = ids.map(() => "?").join(",");
        const [stopRows] = await db.query(
          `
            SELECT
              id_sales_cost,
              SUM(CASE WHEN is_departure = 0 AND is_finish = 0 THEN 1 ELSE 0 END) AS total_stops,
              SUM(CASE WHEN is_finish = 1 THEN 1 ELSE 0 END) AS finish_defined
            FROM sales_cost_step_schedule
            WHERE id_sales_cost IN (${placeholders})
            GROUP BY id_sales_cost
          `,
          ids
        );

        stopRows.forEach((row) => {
          stopSummaryMap.set(Number(row.id_sales_cost), {
            total_stops: Number(row.total_stops || 0),
            finish_defined: Number(row.finish_defined || 0) > 0
          });
        });
      }

      const historySummaryMap = new Map();
      if (ids.length > 0) {
        const placeholders = ids.map(() => "?").join(",");
        const [historyRows] = await db.query(
          `
            SELECT
              id_sales_cost,
              SUM(CASE WHEN id_sc_stop IS NOT NULL THEN 1 ELSE 0 END) AS visited_stops,
              SUM(CASE WHEN step_key = 'system:finish_order' THEN 1 ELSE 0 END) AS finish_hit
            FROM sales_cost_route_history
            WHERE id_sales_cost IN (${placeholders})
            GROUP BY id_sales_cost
          `,
          ids
        );

        historyRows.forEach((row) => {
          historySummaryMap.set(Number(row.id_sales_cost), {
            visited_stops: Number(row.visited_stops || 0),
            finish_hit: Number(row.finish_hit || 0) > 0
          });
        });
      }

      const deliveryStopsMap = new Map();
      if (ids.length > 0) {
        const placeholders = ids.map(() => "?").join(",");
        const [deliveryStopRows] = await db.query(
          `
            SELECT
              id,
              id_sales_cost,
              stop_order,
              stop_name,
              wialon_zone_name,
              estimated_arrival,
              is_departure,
              is_finish
            FROM sales_cost_step_schedule
            WHERE id_sales_cost IN (${placeholders})
            ORDER BY id_sales_cost ASC, stop_order ASC
          `,
          ids
        );

        deliveryStopRows.forEach((row) => {
          const salesCostId = Number(row.id_sales_cost);
          if (!deliveryStopsMap.has(salesCostId)) {
            deliveryStopsMap.set(salesCostId, []);
          }
          deliveryStopsMap.get(salesCostId).push(row);
        });
      }

      const routeHistoryMap = new Map();
      if (ids.length > 0) {
        const placeholders = ids.map(() => "?").join(",");
        const [routeHistoryRows] = await db.query(
          `
            SELECT
              id_sales_cost,
              id_sc_stop,
              gps_time,
              is_manual,
              step_key
            FROM sales_cost_route_history
            WHERE id_sales_cost IN (${placeholders})
            ORDER BY gps_time ASC, id_sales_cost_route_history ASC
          `,
          ids
        );

        routeHistoryRows.forEach((row) => {
          const salesCostId = Number(row.id_sales_cost);
          if (!routeHistoryMap.has(salesCostId)) {
            routeHistoryMap.set(salesCostId, []);
          }
          routeHistoryMap.get(salesCostId).push(row);
        });
      }

      return rows.map((row) => {
        const salesCostId = Number(row.id_sales_cost);
        const dnItemsRaw = dnMap.get(salesCostId) || [];
        const dnItems = dnItemsRaw.map((item) => ({
          _id: item?._id ? String(item._id) : "",
          no_dn: item?.no_dn ?? null,
          almt_pickup: item?.pickup_alamat ?? null,
          almt_drop: item?.drop_alamat ?? null,
          qty: item?.qty ?? null,
          pkg: item?.pkg ?? null,
          gw: item?.gw ?? null,
          no_container: item?.no_container ?? null,
          no_aju: item?.no_aju ?? null,
          remarks: item?.remarks ?? null
        }));

        const stopSummary = stopSummaryMap.get(salesCostId) || {
          total_stops: 0,
          finish_defined: false
        };

        const historySummary = historySummaryMap.get(salesCostId) || {
          visited_stops: 0,
          finish_hit: false
        };

        const deliveryStops = deliveryStopsMap.get(salesCostId) || [];
        const routeHistory = routeHistoryMap.get(salesCostId) || [];
        const plannedFinish =
          deliveryStops.find((s) => Number(s.is_finish) === 1)?.estimated_arrival || null;

        const statusSummary = resolveScheduleStatus({
          departureDatetime: row.departure_datetime,
          arrivalDatetime: row.arrival_datetime,
          finishOrderDatetime: row.finish_order_datetime,
          plannedFinishDatetime: plannedFinish,
          finishHit: historySummary.finish_hit,
          visitedStops: historySummary.visited_stops,
          totalStops: stopSummary.total_stops
        });

        return {
          id_sales_cost: salesCostId,
          departure_datetime: formatDateValue(row.departure_datetime),
          arrival: formatDateValue(row.arrival_datetime),
          finish_order_datetime: formatDateValue(row.finish_order_datetime),
          no_spk: row.no_spk || salesCostId,
          no_po: row.no_po || null,
          jenis_pengiriman: row.jenis_trip || null,
          trip: row.trip || null,
          truck: {
            id: row.id_truck ?? null,
            no_police: row.no_police ?? null,
            jenis_kendaraan: row.jenis_kendaraan ?? null
          },
          driver: {
            id: row.id_driver ?? null,
            name: row.nama_driver ?? null
          },
          customer: {
            id: row.id_customer ?? null,
            name: row.nama_customer ?? null
          },
          route: {
            id: row.id_area ?? null,
            name: row.nama_area ?? null
          },
          dnCount: dnItems.length,
          dnItems,
          detailUrl: `/sales-cost/${salesCostId}`,

          schedule_status: statusSummary.schedule_status,
          visited_stops: historySummary.visited_stops,
          total_stops: stopSummary.total_stops,
          finish_hit: historySummary.finish_hit,
          has_incomplete_finish: statusSummary.has_incomplete_finish,
          delivery_stops_summary: resolveStopTimelineSummary({
            deliveryStops,
            historyRows: routeHistory
          })
        };
      });
    };

    const baseDataSql = `
      SELECT
        sc.id_sales_cost,
        sc.departure_datetime,
        sc.arrival_datetime,
        sc.finish_order_datetime,
        sc.no_po,
        sc.jenis_trip,
        sc.trip,
        sc.id_truck,
        sc.id_driver,
        sc.id_customer,
        sc.id_area,
        t.no_police,
        t.jenis_kendaraan,
        d.nama_driver,
        c.nama_customer,
        a.nama_area
      FROM sales_cost sc
      LEFT JOIN truck t ON sc.id_truck = t.id_truck
      LEFT JOIN driver d ON sc.id_driver = d.id_driver
      LEFT JOIN customer c ON sc.id_customer = c.id_customer
      LEFT JOIN area a ON sc.id_area = a.id_area
      ${whereSql}
      ORDER BY ${sortColumn} ${sortDir}, sc.id_sales_cost ASC
    `;

    let totalItems, totalPages, responseRows;

    if (!useStatusFilter) {
      // Original path: SQL-level pagination
      const countSql = `
        SELECT COUNT(*) AS totalItems
        FROM sales_cost sc
        LEFT JOIN truck t ON sc.id_truck = t.id_truck
        LEFT JOIN driver d ON sc.id_driver = d.id_driver
        LEFT JOIN customer c ON sc.id_customer = c.id_customer
        LEFT JOIN area a ON sc.id_area = a.id_area
        ${whereSql}
      `;
      const [countRows] = await db.query(countSql, params);
      totalItems = Number(countRows?.[0]?.totalItems || 0);
      totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / pageSize);
      const offset = (page - 1) * pageSize;

      const [rows] = await db.query(`${baseDataSql} LIMIT ? OFFSET ?`, [...params, pageSize, offset]);
      responseRows = await buildResponseRows(rows);
    } else {
      // Status-filter path: fetch ALL rows, compute status, filter, then paginate in-memory
      const [allRows] = await db.query(baseDataSql, params);
      const allResponseRows = await buildResponseRows(allRows);
      const filtered = allResponseRows.filter((r) => r.schedule_status === statusFilter);

      totalItems = filtered.length;
      totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / pageSize);
      const offset = (page - 1) * pageSize;
      responseRows = filtered.slice(offset, offset + pageSize);
    }

    res.json({
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages,
        start_date: startDate,
        end_date: endDate,
        search,
        status: statusFilter || null
      },
      rows: responseRows
    });
  } catch (error) {
    console.error("Schedule pengiriman error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
