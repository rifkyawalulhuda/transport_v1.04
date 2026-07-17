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

    const todayString = toLocalDateString(new Date());
    if (todayString) {
      conditions.push("sc.arrival_datetime >= ?");
      params.push(todayString);
    }

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

      return {
        id_sales_cost: salesCostId,
        departure_datetime: formatDateValue(row.departure_datetime),
        arrival: formatDateValue(row.arrival_datetime),
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
        detailUrl: `/sales-cost/${salesCostId}`
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
