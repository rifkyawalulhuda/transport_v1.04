const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const pad2 = (value) => String(value).padStart(2, "0");

const isZeroDate = (value) => {
  if (value === null || value === undefined) {
    return false;
  }
  const str = String(value);
  return str.startsWith("0000-00-00");
};

const toDateString = (value) => {
  if (!value || isZeroDate(value)) {
    return null;
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
};

const toDateTimeString = (value) => {
  if (!value || isZeroDate(value)) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const parsePositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const resolveMonthYear = (query) => {
  const month = parsePositiveInt(query.month);
  const year = parsePositiveInt(query.year);
  if (!month || !year || month < 1 || month > 12) {
    return { month: null, year: null };
  }
  return { month, year };
};

const resolveLimit = (value) => {
  const parsed = parsePositiveInt(value);
  if (!parsed) {
    return 24;
  }
  return Math.min(parsed, 200);
};

const buildSearchable = (values) =>
  values
    .filter((value) => value !== null && value !== undefined)
    .map((value) => String(value))
    .join(" ")
    .toLowerCase();

const matchesSearch = (item, search) => {
  if (!search) {
    return true;
  }
  const haystack = buildSearchable([
    item.id_truck,
    item.no_police,
    item.merk_mobil,
    item.model,
    item.type_truck,
    item.jenis_kendaraan,
    item.driver_name,
    item.transaksi?.departure_datetime,
    item.transaksi?.route,
    item.repair?.no_spk_perbaikan,
    item.repair?.jenis_kerusakan,
    item.repair?.kategori_repair,
    item.last_transaction?.route,
    item.last_transaction?.id_sales_cost
  ]);
  return haystack.includes(search);
};

router.use(authenticateToken);

router.get("/", async (req, res) => {
  try {
    const search = normalizeText(req.query.search);
    const limit = resolveLimit(req.query.limit);
    const { month, year } = resolveMonthYear(req.query);

    const todayString = toDateString(new Date());

    const [truckRows] = await db.query(
      "SELECT id_truck, no_police, merk_mobil, model, type_truck, jenis_kendaraan, last_lat, last_lng, last_gps_time, last_address FROM truck WHERE is_active = 1"
    );

    const repairConditions = [
      "(repair.status_repair IS NULL OR repair.status_repair = 'PROSES')"
    ];
    const repairParams = [];
    if (month && year) {
      repairConditions.push("MONTH(repair.tgl_input) = ?");
      repairConditions.push("YEAR(repair.tgl_input) = ?");
      repairParams.push(month, year);
    }

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
        repair.tgl_selesai,
        truck.no_police,
        truck.merk_mobil,
        truck.model,
        truck.type_truck,
        truck.jenis_kendaraan
      FROM repair
      INNER JOIN truck ON repair.id_truck = truck.id_truck AND truck.is_active = 1
      WHERE ${repairConditions.join(" AND ")}
      ORDER BY repair.tgl_input DESC, repair.id_repair DESC
    `;

    const [repairRows] = await db.query(repairSql, repairParams);

    const trxConditions = [
      `(
        (sc.finish_order_datetime IS NOT NULL AND CAST(sc.finish_order_datetime AS CHAR) <> '0000-00-00' AND sc.finish_order_datetime > ?)
        OR
        (
          (sc.finish_order_datetime IS NULL OR CAST(sc.finish_order_datetime AS CHAR) = '0000-00-00')
          AND
          (sc.arrival_datetime IS NULL OR CAST(sc.arrival_datetime AS CHAR) = '0000-00-00' OR sc.arrival_datetime >= ?)
        )
      )`
    ];
    const trxParams = [todayString, todayString];
    if (month && year) {
      trxConditions.push("MONTH(sc.departure_datetime) = ?");
      trxConditions.push("YEAR(sc.departure_datetime) = ?");
      trxParams.push(month, year);
    }

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
        t.no_police,
        t.merk_mobil,
        t.model,
        t.type_truck,
        t.jenis_kendaraan,
        d.nama_driver,
        a.nama_area
      FROM sales_cost sc
      LEFT JOIN truck t ON sc.id_truck = t.id_truck
      LEFT JOIN driver d ON sc.id_driver = d.id_driver
      LEFT JOIN area a ON sc.id_area = a.id_area
      WHERE ${trxConditions.join(" AND ")}
      ORDER BY sc.departure_datetime DESC, sc.id_sales_cost DESC
    `;

    const [trxRows] = await db.query(trxSql, trxParams);

    // Query trucks currently on-trip: departed but not yet triggered finish geofence
    const onTripSql = `
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
        t.no_police,
        t.merk_mobil,
        t.model,
        t.type_truck,
        t.jenis_kendaraan,
        d.nama_driver,
        a.nama_area,
        CASE WHEN sc.arrival_datetime IS NOT NULL
             AND sc.arrival_datetime < NOW()
             AND NOT EXISTS (
               SELECT 1 FROM sales_cost_route_history scrh
               WHERE scrh.id_sales_cost = sc.id_sales_cost
                 AND scrh.step_key = 'system:finish_order'
             )
        THEN 1 ELSE 0 END AS is_overdue
      FROM sales_cost sc
      LEFT JOIN truck t ON sc.id_truck = t.id_truck
      LEFT JOIN driver d ON sc.id_driver = d.id_driver
      LEFT JOIN area a ON sc.id_area = a.id_area
      WHERE t.is_active = 1
        AND sc.departure_datetime IS NOT NULL
        AND sc.departure_datetime >= DATE_SUB(NOW(), INTERVAL 60 DAY)
        AND NOT EXISTS (
          SELECT 1 FROM sales_cost_route_history scrh
          WHERE scrh.id_sales_cost = sc.id_sales_cost
            AND scrh.step_key = 'system:finish_order'
        )
        AND EXISTS (
          SELECT 1 FROM sales_cost_step_schedule scss
          WHERE scss.id_sales_cost = sc.id_sales_cost
        )
      ORDER BY sc.departure_datetime DESC, sc.id_sales_cost DESC
    `;
    const [onTripRows] = await db.query(onTripSql);

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
        SELECT sc2.id_truck, MAX(sc2.id_sales_cost) AS max_sc_id
        FROM sales_cost sc2
        INNER JOIN (
          SELECT id_truck, MAX(departure_datetime) AS max_dt
          FROM sales_cost
          GROUP BY id_truck
        ) md ON md.id_truck = sc2.id_truck AND md.max_dt = sc2.departure_datetime
        GROUP BY sc2.id_truck
      ) last_sc ON last_sc.id_truck = sc.id_truck
        AND last_sc.max_sc_id = sc.id_sales_cost
      LEFT JOIN driver d ON sc.id_driver = d.id_driver
      LEFT JOIN area a ON sc.id_area = a.id_area
      ORDER BY sc.departure_datetime DESC, sc.id_sales_cost DESC
    `;

    const [lastRows] = await db.query(lastSql);

    const truckById = new Map();
    truckRows.forEach((truck) => {
      if (truck?.id_truck === null || truck?.id_truck === undefined) {
        return;
      }
      truckById.set(String(truck.id_truck), {
        id_truck: Number(truck.id_truck),
        no_police: truck.no_police || null,
        merk_mobil: truck.merk_mobil || null,
        model: truck.model || null,
        type_truck: truck.type_truck || null,
        jenis_kendaraan: truck.jenis_kendaraan || null,
        last_gps: (truck.last_lat && truck.last_lng) ? {
          lat: Number(truck.last_lat),
          lng: Number(truck.last_lng),
          gps_time: toDateTimeString(truck.last_gps_time),
          address: truck.last_address || null
        } : null
      });
    });

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

    const onTripByTruck = new Map();
    onTripRows.forEach((row) => {
      const key = String(row.id_truck || "");
      if (!key || onTripByTruck.has(key)) {
        return;
      }
      onTripByTruck.set(key, row);
    });

    const lastByTruck = new Map();
    lastRows.forEach((row) => {
      const key = String(row.id_truck || "");
      if (!key || lastByTruck.has(key)) {
        return;
      }
      lastByTruck.set(key, row);
    });

    const repairList = [];
    const onTripList = [];
    const transaksiList = [];
    const idleList = [];

    truckById.forEach((base, key) => {
      const last = lastByTruck.get(key);
      if (repairsByTruck.has(key)) {
        const repair = repairsByTruck.get(key);
        const tglKerusakan =
          toDateString(repair.tgl_kerusakan) || toDateString(repair.tgl_input);
        repairList.push({
          ...base,
          status: "repair",
          driver_name: last?.nama_driver || null,
          repair: {
            id_repair: repair.id_repair,
            no_spk_perbaikan: repair.no_spk_perbaikan || null,
            kategori_repair: repair.kategori_repair || null,
            jenis_kerusakan: repair.jenis_kerusakan || null,
            keterangan: repair.keterangan || null,
            status_repair: repair.status_repair || null,
            tgl_kerusakan: tglKerusakan,
            tgl_input: toDateString(repair.tgl_input),
            tgl_proses: toDateString(repair.tgl_proses),
            tgl_selesai: toDateString(repair.tgl_selesai)
          },
          last_transaction: last
            ? {
                id_sales_cost: last.id_sales_cost,
                departure_datetime: toDateTimeString(last.departure_datetime),
                arrival_datetime: toDateTimeString(last.arrival_datetime),
                finish_order_datetime: toDateTimeString(last.finish_order_datetime),
                driver_name: last.nama_driver || null,
                route: last.nama_area || null
              }
            : null
        });
        return;
      }

      if (onTripByTruck.has(key)) {
        const onTripTrx = onTripByTruck.get(key);
        onTripList.push({
          ...base,
          status: 'on_trip',
          driver_name: onTripTrx.nama_driver || null,
          is_overdue: Boolean(onTripTrx.is_overdue),
          status_duration_minutes: onTripTrx.departure_datetime
            ? Math.floor((Date.now() - new Date(onTripTrx.departure_datetime).getTime()) / 60000)
            : null,
          transaksi: {
            id_sales_cost: onTripTrx.id_sales_cost,
            departure_datetime: toDateTimeString(onTripTrx.departure_datetime),
            arrival_datetime: toDateTimeString(onTripTrx.arrival_datetime),
            finish_order_datetime: toDateTimeString(onTripTrx.finish_order_datetime),
            route: onTripTrx.nama_area || null,
            trip: onTripTrx.trip || null,
            jenis_trip: onTripTrx.jenis_trip || null,
            no_po: onTripTrx.no_po || null,
          }
        });
        return;
      }

      if (transaksiByTruck.has(key)) {
        const trx = transaksiByTruck.get(key);
        transaksiList.push({
          ...base,
          status: "transaksi",
          driver_name: trx.nama_driver || null,
          status_duration_minutes: trx.departure_datetime
            ? Math.floor((Date.now() - new Date(trx.departure_datetime).getTime()) / 60000)
            : null,
          transaksi: {
            id_sales_cost: trx.id_sales_cost,
            no_spk: trx.id_sales_cost,
            departure_datetime: toDateTimeString(trx.departure_datetime),
            arrival_datetime: toDateTimeString(trx.arrival_datetime),
            finish_order_datetime: toDateTimeString(trx.finish_order_datetime),
            trip: trx.trip || null,
            jenis_trip: trx.jenis_trip || null,
            no_po: trx.no_po || null,
            no_aju: trx.no_aju || null,
            no_container: trx.no_container || null,
            route: trx.nama_area || null
          },
          last_transaction: last
            ? {
                id_sales_cost: last.id_sales_cost,
                departure_datetime: toDateTimeString(last.departure_datetime),
                arrival_datetime: toDateTimeString(last.arrival_datetime),
                finish_order_datetime: toDateTimeString(last.finish_order_datetime),
                driver_name: last.nama_driver || null,
                route: last.nama_area || null
              }
            : null
        });
        return;
      }

      idleList.push({
        ...base,
        status: "idle",
        driver_name: last?.nama_driver || null,
        last_transaction: last
          ? {
              id_sales_cost: last.id_sales_cost,
              departure_datetime: toDateTimeString(last.departure_datetime),
              arrival_datetime: toDateTimeString(last.arrival_datetime),
              finish_order_datetime: toDateTimeString(last.finish_order_datetime),
              driver_name: last.nama_driver || null,
              route: last.nama_area || null
            }
          : null
      });
    });

    const filteredRepair = search ? repairList.filter((item) => matchesSearch(item, search)) : repairList;
    const filteredOnTrip = search ? onTripList.filter((item) => matchesSearch(item, search)) : onTripList;
    const filteredTransaksi = search
      ? transaksiList.filter((item) => matchesSearch(item, search))
      : transaksiList;
    const filteredIdle = search ? idleList.filter((item) => matchesSearch(item, search)) : idleList;

    res.json({
      summary: {
        total: filteredRepair.length + filteredOnTrip.length + filteredTransaksi.length + filteredIdle.length,
        on_trip: filteredOnTrip.length,
        transaksi: filteredTransaksi.length,
        repair: filteredRepair.length,
        idle: filteredIdle.length
      },
      on_trip: filteredOnTrip.slice(0, limit),
      transaksi: filteredTransaksi.slice(0, limit),
      repair: filteredRepair.slice(0, limit),
      idle: filteredIdle.slice(0, limit),
      meta: {
        limit,
        search,
        month,
        year
      }
    });
  } catch (error) {
    console.error("Monitoring kendaraan error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
