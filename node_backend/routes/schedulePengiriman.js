const express = require("express");
const db = require("../db");
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

const resolveScheduleStatus = ({ departureDatetime, arrivalDatetime, finishOrderDatetime, finishHit, visitedStops, totalStops }) => {
  const now = new Date();
  const departure = departureDatetime ? new Date(departureDatetime) : null;
  const arrival = arrivalDatetime ? new Date(arrivalDatetime) : null;

  // Use finish_order_datetime as the overdue deadline if available,
  // fallback to arrival_datetime for backwards compatibility
  const overdueDeadline = finishOrderDatetime
    ? new Date(finishOrderDatetime)
    : arrival;

  const completed = finishHit && visitedStops >= totalStops && totalStops > 0;
  const incompleteFinish = finishHit && visitedStops < totalStops;

  if (completed) {
    return {
      schedule_status: "completed",
      has_incomplete_finish: false
    };
  }

  if (incompleteFinish) {
    return {
      schedule_status: "incomplete_finish",
      has_incomplete_finish: true
    };
  }

  // Only flag overdue if the finish deadline has passed AND delivery not finished yet
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

  const now = new Date();

  const baseStops = deliveryStops.map((stop) => {
    const historyEntry = historyByStopId.get(Number(stop.id));
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
      inferred_passed: false,
      incomplete_finish: false,
      overdue
    };
  });

  const hasAnyVisitedAfterDeparture = baseStops.some((stop) => !stop.is_departure && stop.hit);
  const missingMiddleStops = baseStops.filter((stop) => !stop.is_departure && !stop.is_finish && !stop.hit);

  return baseStops.map((stop) => {
    if (stop.is_departure && !stop.hit && hasAnyVisitedAfterDeparture) {
      return {
        ...stop,
        inferred_passed: true
      };
    }

    if (stop.is_finish && stop.hit && missingMiddleStops.length > 0) {
      return {
        ...stop,
        incomplete_finish: true
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
    const { startDate, endDate } = resolveDateRange(
      req.query.start_date,
      req.query.end_date
    );

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
    const totalItems = Number(countRows?.[0]?.totalItems || 0);
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;

    const dataSql = `
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
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(dataSql, [...params, pageSize, offset]);

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

    const responseRows = rows.map((row) => {
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

      const statusSummary = resolveScheduleStatus({
        departureDatetime: row.departure_datetime,
        arrivalDatetime: row.arrival_datetime,
        finishOrderDatetime: row.finish_order_datetime,
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

    res.json({
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages,
        start_date: startDate,
        end_date: endDate,
        search
      },
      rows: responseRows
    });
  } catch (error) {
    console.error("Schedule pengiriman error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
