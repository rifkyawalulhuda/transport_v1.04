const express = require("express");
const ExcelJS = require("exceljs");
const db = require("../db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { createNotification, getActorFromRequest } = require("../services/notificationService");

const router = express.Router();

const notifySubcontractorChange = async ({ req, type, title, action, identifier, entityId }) => {
  const actor = getActorFromRequest(req);
  if (!actor) {
    return;
  }
  try {
    const actorName = actor.nama_admin || "Admin";
    await createNotification({
      type,
      title,
      message: `${actorName} ${action} Subcontractor (${identifier})`,
      actor,
      entity: "subcontractor",
      entityId,
      meta: { route: "/subcontractor" }
    });
  } catch (error) {
    console.error("Failed to create subcontractor notification", error);
  }
};

function parseNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }
  const str = String(value).replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(str);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** @returns {string|null} YYYY-MM-DD from datetime or date string */
const toDateOnly = (value) => {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return toDateOnly(d);
};

/** Normalize estimated_arrival for MySQL DATETIME */
const toMysqlDateTime = (value) => {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }
  const s = String(value).trim().replace("T", " ");
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
    return s.length === 16 ? `${s}:00` : s.slice(0, 19);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s} 00:00:00`;
  return null;
};

/**
 * Normalize + validate delivery_stops for subcontractor (manual timeline, no GPS).
 * @returns {{ stops: object[], deliveryDate: string|null, arrivalDate: string|null, error: string|null }}
 */
const normalizeDeliveryStops = (rawStops, fallbackDelivery, fallbackArrival) => {
  const list = Array.isArray(rawStops) ? rawStops : [];
  if (list.length === 0) {
    return {
      stops: [],
      deliveryDate: toDateOnly(fallbackDelivery),
      arrivalDate: toDateOnly(fallbackArrival),
      error: null
    };
  }

  const sorted = [...list].sort(
    (a, b) => Number(a.stop_order) - Number(b.stop_order) || 0
  );
  const stops = sorted.map((s, idx) => {
    const isDep = Number(s.is_departure) === 1;
    const isFin = Number(s.is_finish) === 1;
    return {
      stop_order: Number.isFinite(Number(s.stop_order)) ? Number(s.stop_order) : idx,
      stop_name: String(s.stop_name || "").trim() || (isDep ? "Departure" : isFin ? "Finish" : `Tujuan ${idx}`),
      is_departure: isDep ? 1 : 0,
      is_finish: isFin ? 1 : 0,
      estimated_arrival: toMysqlDateTime(s.estimated_arrival)
    };
  });

  const hasDep = stops.some((s) => s.is_departure === 1);
  const hasFin = stops.some((s) => s.is_finish === 1);
  if (!hasDep || !hasFin) {
    return {
      stops: [],
      deliveryDate: null,
      arrivalDate: null,
      error: "Jadwal pengiriman harus memiliki Departure dan Finish."
    };
  }

  for (const s of stops) {
    if (!s.estimated_arrival) {
      return {
        stops: [],
        deliveryDate: null,
        arrivalDate: null,
        error: `Waktu estimasi wajib diisi untuk stop "${s.stop_name}".`
      };
    }
  }

  for (let i = 1; i < stops.length; i++) {
    if (stops[i].estimated_arrival < stops[i - 1].estimated_arrival) {
      return {
        stops: [],
        deliveryDate: null,
        arrivalDate: null,
        error: `Urutan waktu stop tidak valid: "${stops[i].stop_name}" lebih awal dari stop sebelumnya.`
      };
    }
  }

  const dep = stops.find((s) => s.is_departure === 1);
  const fin = stops.find((s) => s.is_finish === 1);
  const middles = stops.filter((s) => s.is_departure !== 1 && s.is_finish !== 1);
  const lastMiddle = middles.length ? middles[middles.length - 1] : null;

  return {
    stops,
    deliveryDate: toDateOnly(dep?.estimated_arrival) || toDateOnly(fallbackDelivery),
    arrivalDate:
      toDateOnly(lastMiddle?.estimated_arrival) ||
      toDateOnly(fin?.estimated_arrival) ||
      toDateOnly(fallbackArrival),
    error: null
  };
};

const fetchStopsForSubcontractor = async (idSubcontractor) => {
  const [rows] = await db.query(
    `SELECT id, id_subcontractor, stop_order, stop_name, is_departure, is_finish, estimated_arrival
     FROM sub_contractor_step_schedule
     WHERE id_subcontractor = ?
     ORDER BY stop_order ASC, id ASC`,
    [idSubcontractor]
  );
  return rows;
};

const replaceStopsForSubcontractor = async (conn, idSubcontractor, stops) => {
  await conn.query(
    "DELETE FROM sub_contractor_step_schedule WHERE id_subcontractor = ?",
    [idSubcontractor]
  );
  for (const s of stops) {
    await conn.query(
      `INSERT INTO sub_contractor_step_schedule
        (id_subcontractor, stop_order, stop_name, is_departure, is_finish, estimated_arrival)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        idSubcontractor,
        s.stop_order,
        s.stop_name,
        s.is_departure,
        s.is_finish,
        s.estimated_arrival
      ]
    );
  }
};

function buildFilters(query) {
  const startDate = query.start_date || "";
  const endDate = query.end_date || "";
  const yearParam = String(query.year || "").trim();
  const year = Number.parseInt(yearParam, 10);
  const keyword = String(query.keyword || "").trim();
  const column = String(query.search_column || "all").trim().toLowerCase();

  const conditions = [];
  const params = [];

  if (startDate) {
    conditions.push("sub_contractor.delivery_date >= ?");
    params.push(startDate);
  }

  if (endDate) {
    conditions.push("sub_contractor.delivery_date <= ?");
    params.push(endDate);
  }

  if (yearParam && Number.isInteger(year) && year >= 1900 && year <= 9999) {
    conditions.push("YEAR(sub_contractor.delivery_date) = ?");
    params.push(year);
  }

  if (keyword) {
    const likeKeyword = `%${keyword}%`;
    const searchableColumns = {
      order_date: "sub_contractor.order_date",
      delivery_date: "sub_contractor.delivery_date",
      arrival_date: "sub_contractor.arrival_date",
      nama_subcont: "subcont.nama_subcont",
      nama_customer: "customer.nama_customer",
      no_surat_jalan: "sub_contractor.no_surat_jalan",
      truck: "sub_contractor.truck",
      jenis_kendaraan: "sub_contractor.jenis_kendaraan",
      tonase: "sub_contractor.tonase",
      tujuan_pengiriman: "sub_contractor.tujuan_pengiriman",
      driver: "sub_contractor.driver",
      no_invoice: "sub_contractor.no_invoice",
      billing_customer: "sub_contractor.billing_customer",
      trip: "sub_contractor.trip",
      sales: "CAST(sub_contractor.sales AS CHAR)",
      gross_profit: "CAST(sub_contractor.gross_profit AS CHAR)"
    };

    if (column && column !== "all") {
      if (column === "warehouse") {
        conditions.push(
          "(warehouse.kode_warehouse LIKE ? OR warehouse.nm_warehouse LIKE ?)"
        );
        params.push(likeKeyword, likeKeyword);
      } else if (searchableColumns[column]) {
        conditions.push(`${searchableColumns[column]} LIKE ?`);
        params.push(likeKeyword);
      }
    } else {
      const expressions = [
        "sub_contractor.order_date",
        "sub_contractor.delivery_date",
        "sub_contractor.arrival_date",
        "subcont.nama_subcont",
        "customer.nama_customer",
        "warehouse.kode_warehouse",
        "warehouse.nm_warehouse",
        "sub_contractor.no_surat_jalan",
        "sub_contractor.trip",
        "sub_contractor.truck",
        "sub_contractor.jenis_kendaraan",
        "sub_contractor.tonase",
        "sub_contractor.tujuan_pengiriman",
        "sub_contractor.driver",
        "sub_contractor.no_invoice",
        "sub_contractor.billing_customer",
        "CAST(sub_contractor.sales AS CHAR)",
        "CAST(sub_contractor.gross_profit AS CHAR)"
      ];
      const orConditions = expressions.map((expression) => `${expression} LIKE ?`);
      conditions.push(`(${orConditions.join(" OR ")})`);
      params.push(...orConditions.map(() => likeKeyword));
    }
  }

  return { conditions, params };
}

router.get("/years", async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT YEAR(delivery_date) AS year
       FROM sub_contractor
       WHERE delivery_date IS NOT NULL
       ORDER BY year DESC`
    );

    const years = rows
      .map((row) => Number.parseInt(String(row.year), 10))
      .filter((year) => Number.isInteger(year) && year >= 1900 && year <= 9999);

    res.json(years);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const isPaginated = req.query.page !== undefined || req.query.pageSize !== undefined;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(parseInt(req.query.pageSize, 10) || 15, 1),
      1000 // Increased max limit
    );

    const { conditions, params } = buildFilters(req.query);

    let baseSql =
      "FROM sub_contractor INNER JOIN customer ON sub_contractor.id_customer = customer.id_customer INNER JOIN warehouse ON sub_contractor.id_warehouse = warehouse.id_warehouse INNER JOIN subcont ON sub_contractor.id_subcont = subcont.id_subcont";

    if (conditions.length > 0) {
      baseSql += " WHERE " + conditions.join(" AND ");
    }

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total ${baseSql}`,
      params
    );
    const total = countRows[0]?.total || 0;

    const offset = (page - 1) * pageSize;
    let sql = `SELECT sub_contractor.id_subcontractor, sub_contractor.order_date, sub_contractor.delivery_date, sub_contractor.arrival_date, sub_contractor.no_surat_jalan, sub_contractor.sales, sub_contractor.gross_profit, sub_contractor.trip, sub_contractor.truck, sub_contractor.jenis_kendaraan, sub_contractor.tonase, sub_contractor.tujuan_pengiriman, sub_contractor.driver, sub_contractor.cost, sub_contractor.no_invoice, sub_contractor.billing_customer, customer.nama_customer, warehouse.kode_warehouse, warehouse.nm_warehouse, subcont.nama_subcont ${baseSql} ORDER BY sub_contractor.id_subcontractor DESC`;

    const queryParams = [...params];
    if (isPaginated && req.query.pageSize !== 'all') {
      sql += " LIMIT ? OFFSET ?";
      queryParams.push(pageSize, offset);
    }

    const [rows] = await db.query(sql, queryParams);

    res.json({
      data: rows,
      total,
      page,
      pageSize
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/export", authenticateToken, async (req, res) => {
  try {
    const { conditions, params } = buildFilters(req.query);

    let sql =
      "SELECT sub_contractor.id_subcontractor, sub_contractor.order_date, sub_contractor.delivery_date, sub_contractor.arrival_date, sub_contractor.trip, sub_contractor.truck, sub_contractor.jenis_kendaraan, sub_contractor.tonase, sub_contractor.tujuan_pengiriman, sub_contractor.driver, sub_contractor.no_surat_jalan, sub_contractor.cost, sub_contractor.no_invoice, sub_contractor.billing_customer, sub_contractor.sales, sub_contractor.gross_profit, customer.nama_customer, warehouse.kode_warehouse, warehouse.nm_warehouse, subcont.nama_subcont FROM sub_contractor INNER JOIN customer ON sub_contractor.id_customer = customer.id_customer INNER JOIN warehouse ON sub_contractor.id_warehouse = warehouse.id_warehouse INNER JOIN subcont ON sub_contractor.id_subcont = subcont.id_subcont";

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY sub_contractor.id_subcontractor DESC";

    const [rows] = await db.query(sql, params);

    if (!rows.length) {
      return res.status(404).json({ message: "Tidak ada data untuk diexport." });
    }

    // Load planned delivery stops (Jadwal Pengiriman) for all exported rows
    const ids = rows.map((r) => Number(r.id_subcontractor)).filter(Boolean);
    const stopsById = new Map();
    if (ids.length > 0) {
      try {
        const placeholders = ids.map(() => "?").join(",");
        const [stopRows] = await db.query(
          `SELECT id_subcontractor, stop_order, stop_name, is_departure, is_finish, estimated_arrival
           FROM sub_contractor_step_schedule
           WHERE id_subcontractor IN (${placeholders})
           ORDER BY id_subcontractor ASC, stop_order ASC, id ASC`,
          ids
        );
        for (const s of stopRows) {
          const scId = Number(s.id_subcontractor);
          if (!stopsById.has(scId)) stopsById.set(scId, []);
          stopsById.get(scId).push(s);
        }
      } catch (stopErr) {
        if (stopErr && stopErr.code !== "ER_NO_SUCH_TABLE") throw stopErr;
      }
    }

    // Load DN items for all exported rows
    const dnById = new Map();
    if (ids.length > 0) {
      try {
        const placeholders = ids.map(() => "?").join(",");
        const [dnRows] = await db.query(
          `SELECT id, id_subcontractor, no_dn, pickup_alamat, drop_alamat,
                  qty, pkg, gw, no_container, no_aju, remarks
           FROM sub_contractor_dn
           WHERE id_subcontractor IN (${placeholders})
           ORDER BY id_subcontractor ASC, id ASC`,
          ids
        );
        for (const d of dnRows) {
          const scId = Number(d.id_subcontractor);
          if (!dnById.has(scId)) dnById.set(scId, []);
          dnById.get(scId).push(d);
        }
      } catch (dnErr) {
        if (dnErr && dnErr.code !== "ER_NO_SUCH_TABLE") throw dnErr;
      }
    }

    const getMiddles = (stops) =>
      (Array.isArray(stops) ? stops : [])
        .filter((s) => Number(s.is_departure) !== 1 && Number(s.is_finish) !== 1)
        .sort((a, b) => Number(a.stop_order) - Number(b.stop_order) || 0);

    let maxMiddle = 0;
    for (const stops of stopsById.values()) {
      maxMiddle = Math.max(maxMiddle, getMiddles(stops).length);
    }

    const filename = "Laporan-Sub-Contractor.xlsx";

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res,
      useStyles: true
    });
    const worksheet = workbook.addWorksheet("Laporan Sub Contractor");

    const scheduleColumns = [
      { header: "Departure (Nama)", key: "dep_name", width: 18 },
      { header: "Departure (Waktu)", key: "dep_time", width: 18 }
    ];
    for (let i = 1; i <= maxMiddle; i++) {
      scheduleColumns.push(
        { header: `Tujuan ${i} (Nama)`, key: `tujuan_${i}_name`, width: 20 },
        { header: `Tujuan ${i} (Waktu)`, key: `tujuan_${i}_time`, width: 18 }
      );
    }
    scheduleColumns.push(
      { header: "Finish (Nama)", key: "fin_name", width: 16 },
      { header: "Finish (Waktu)", key: "fin_time", width: 18 }
    );

    worksheet.columns = [
      { header: "No.", key: "no", width: 6 },
      { header: "Order Date", key: "order_date", width: 14 },
      { header: "Delivery Date", key: "delivery_date", width: 14 },
      { header: "Arrival Date", key: "arrival_date", width: 14 },
      ...scheduleColumns,
      { header: "Warehouse", key: "warehouse", width: 24 },
      { header: "Customer", key: "nama_customer", width: 24 },
      { header: "Sub Cont", key: "nama_subcont", width: 20 },
      { header: "Trip", key: "trip", width: 10 },
      { header: "No. Police", key: "truck", width: 14 },
      { header: "Jenis Kendaraan", key: "jenis_kendaraan", width: 18 },
      { header: "Tonase", key: "tonase", width: 12 },
      { header: "Tujuan Pengiriman", key: "tujuan_pengiriman", width: 22 },
      { header: "Driver", key: "driver", width: 18 },
      { header: "No. Surat Jalan", key: "no_surat_jalan", width: 18 },
      { header: "Cost", key: "cost", width: 14 },
      { header: "Subcont Invoice No.", key: "no_invoice", width: 20 },
      { header: "Billing Customer No.", key: "billing_customer", width: 22 },
      { header: "Sales", key: "sales", width: 14 },
      { header: "Gross Profit", key: "gross_profit", width: 16 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFF00" }
    };
    headerRow.commit();

    const numberFormat = "[$-421] #,##0";
    ["cost", "sales", "gross_profit"].forEach((key) => {
      const column = worksheet.getColumn(key);
      if (column) {
        column.numFmt = numberFormat;
      }
    });

    const formatDate = (date) => {
      if (!date) return "";
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const formatDateTime = (value) => {
      if (!value) return "";
      if (typeof value === "string") {
        const s = value.trim().replace("T", " ");
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) return s.slice(0, 16);
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      }
      const d = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(d.getTime())) return "";
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const cellOrDash = (value) => {
      if (value == null || value === "") return "-";
      return value;
    };

    rows.forEach((row, index) => {
      const scId = Number(row.id_subcontractor);
      const stops = stopsById.get(scId) || [];
      const dep = stops.find((s) => Number(s.is_departure) === 1) || null;
      const fin = stops.find((s) => Number(s.is_finish) === 1) || null;
      const middles = getMiddles(stops);

      const rowData = {
        no: index + 1,
        order_date: formatDate(row.order_date),
        delivery_date: formatDate(row.delivery_date),
        arrival_date: formatDate(row.arrival_date),
        dep_name: cellOrDash(dep?.stop_name),
        dep_time: cellOrDash(formatDateTime(dep?.estimated_arrival)),
        fin_name: cellOrDash(fin?.stop_name),
        fin_time: cellOrDash(formatDateTime(fin?.estimated_arrival)),
        warehouse: `${row.kode_warehouse} - ${row.nm_warehouse}`,
        nama_customer: row.nama_customer,
        nama_subcont: row.nama_subcont,
        trip: row.trip,
        truck: row.truck,
        jenis_kendaraan: row.jenis_kendaraan,
        tonase: row.tonase,
        tujuan_pengiriman: row.tujuan_pengiriman,
        driver: row.driver,
        no_surat_jalan: row.no_surat_jalan,
        cost: row.cost,
        no_invoice: row.no_invoice,
        billing_customer: row.billing_customer,
        sales: row.sales,
        gross_profit: row.gross_profit
      };

      for (let i = 1; i <= maxMiddle; i++) {
        const m = middles[i - 1];
        rowData[`tujuan_${i}_name`] = cellOrDash(m?.stop_name);
        rowData[`tujuan_${i}_time`] = cellOrDash(formatDateTime(m?.estimated_arrival));
      }

      const excelRow = worksheet.addRow(rowData);

      ["cost", "sales", "gross_profit"].forEach((key) => {
        const cell = excelRow.getCell(key);
        if (typeof cell.value === "number") {
          cell.numFmt = numberFormat;
        }
      });

      excelRow.commit();
    });

    worksheet.commit();

    // --- Sheet 2: Delivery Note (DN) ---
    const dnWorksheet = workbook.addWorksheet("Delivery Note (DN)");
    dnWorksheet.columns = [
      { header: "No.",            key: "no",           width: 6  },
      { header: "No. Laporan",    key: "no_laporan",   width: 12 },
      { header: "No. Surat Jalan",key: "no_sj",        width: 20 },
      { header: "No. DN",         key: "no_dn",        width: 18 },
      { header: "Pickup",         key: "pickup_alamat", width: 30 },
      { header: "Drop",           key: "drop_alamat",  width: 30 },
      { header: "Qty",            key: "qty",          width: 8  },
      { header: "Pkg",            key: "pkg",          width: 8  },
      { header: "GW (kg)",        key: "gw",           width: 12 },
      { header: "No. Container",  key: "no_container", width: 18 },
      { header: "No. AJU",        key: "no_aju",       width: 18 },
      { header: "Remarks",        key: "remarks",      width: 28 }
    ];

    const dnHeaderRow = dnWorksheet.getRow(1);
    dnHeaderRow.font = { bold: true };
    dnHeaderRow.alignment = { vertical: "middle", horizontal: "center" };
    dnHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFF00" }
    };
    dnHeaderRow.commit();

    let dnRowNum = 1;
    rows.forEach((row, index) => {
      const scId = Number(row.id_subcontractor);
      const dnList = dnById.get(scId) || [];
      dnList.forEach((dn) => {
        const excelRow = dnWorksheet.addRow({
          no:           dnRowNum++,
          no_laporan:   index + 1,
          no_sj:        cellOrDash(row.no_surat_jalan),
          no_dn:        cellOrDash(dn.no_dn),
          pickup_alamat: cellOrDash(dn.pickup_alamat),
          drop_alamat:  cellOrDash(dn.drop_alamat),
          qty:          dn.qty ?? "-",
          pkg:          cellOrDash(dn.pkg),
          gw:           dn.gw != null ? Number(dn.gw) : "-",
          no_container: cellOrDash(dn.no_container),
          no_aju:       cellOrDash(dn.no_aju),
          remarks:      cellOrDash(dn.remarks)
        });
        const gwCell = excelRow.getCell("gw");
        if (typeof gwCell.value === "number") {
          gwCell.numFmt = "#,##0.00";
        }
        excelRow.commit();
      });
    });

    dnWorksheet.commit();
    await workbook.commit();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    // nik_admin column stores admin.id_admin (INT) of the user who created the row
    const [rows] = await db.query(
      `SELECT sub_contractor.*,
              customer.nama_customer,
              warehouse.kode_warehouse,
              warehouse.nm_warehouse,
              subcont.nama_subcont,
              admin.nama_admin AS created_by_name,
              admin.nik_admin AS created_by_nik
       FROM sub_contractor
       INNER JOIN customer ON sub_contractor.id_customer = customer.id_customer
       INNER JOIN warehouse ON sub_contractor.id_warehouse = warehouse.id_warehouse
       INNER JOIN subcont ON sub_contractor.id_subcont = subcont.id_subcont
       LEFT JOIN admin ON admin.id_admin = sub_contractor.nik_admin
       WHERE sub_contractor.id_subcontractor = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Subcontractor not found" });
    }
    let delivery_stops = [];
    try {
      delivery_stops = await fetchStopsForSubcontractor(id);
    } catch (stopErr) {
      if (stopErr && stopErr.code !== "ER_NO_SUCH_TABLE") throw stopErr;
    }
    res.json({ ...rows[0], delivery_stops });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const body = req.body || {};
  const normalized = normalizeDeliveryStops(
    body.delivery_stops,
    body.delivery_date,
    body.arrival_date
  );
  if (normalized.error) {
    return res.status(400).json({ message: normalized.error });
  }

  const orderDate = body.order_date || null;
  const deliveryDate = normalized.deliveryDate || body.delivery_date || null;
  const arrivalDate = normalized.arrivalDate || body.arrival_date || null;
  const idWarehouse = body.id_warehouse || null;
  const idCustomer = body.id_customer || null;
  const idSubcont = body.id_subcont || null;
  const noSuratJalan = body.no_surat_jalan || "";
  const trip = body.trip || "";
  const truck = body.truck || "";
  const jenisKendaraan = body.jenis_kendaraan || "";
  const tonase = body.tonase || "";
  const tujuanPengiriman = body.tujuan_pengiriman || "";
  const driver = body.driver || "";
  const noInvoice = body.no_invoice || "";
  const billingCustomer = body.billing_customer || "";
  const cost = parseNumber(body.cost);
  const sales = parseNumber(body.sales);
  const grossProfit = sales - cost;
  // Column nik_admin is INT (stores id_admin). Do NOT pass string NIK e.g. "CLC003".
  const nikAdmin = Number(req.user?.id_admin) || 0;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      "INSERT INTO sub_contractor (order_date, delivery_date, arrival_date, id_warehouse, id_customer, id_subcont, no_surat_jalan, trip, truck, jenis_kendaraan, tonase, tujuan_pengiriman, driver, cost, no_invoice, billing_customer, sales, gross_profit, nik_admin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        orderDate,
        deliveryDate,
        arrivalDate,
        idWarehouse,
        idCustomer,
        idSubcont,
        noSuratJalan,
        trip,
        truck,
        jenisKendaraan,
        tonase,
        tujuanPengiriman,
        driver,
        cost,
        noInvoice,
        billingCustomer,
        sales,
        grossProfit,
        nikAdmin
      ]
    );

    if (normalized.stops.length > 0) {
      await replaceStopsForSubcontractor(conn, result.insertId, normalized.stops);
    }

    await conn.commit();

    const [rows] = await db.query(
      "SELECT sub_contractor.*, customer.nama_customer, warehouse.kode_warehouse, warehouse.nm_warehouse, subcont.nama_subcont FROM sub_contractor INNER JOIN customer ON sub_contractor.id_customer = customer.id_customer INNER JOIN warehouse ON sub_contractor.id_warehouse = warehouse.id_warehouse INNER JOIN subcont ON sub_contractor.id_subcont = subcont.id_subcont WHERE sub_contractor.id_subcontractor = ?",
      [result.insertId]
    );
    let delivery_stops = [];
    try {
      delivery_stops = await fetchStopsForSubcontractor(result.insertId);
    } catch {
      /* table may be missing on old envs */
    }

    res.status(201).json({
      success: true,
      id: result.insertId,
      data: { ...rows[0], delivery_stops }
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    conn.release();
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  const id = req.params.id;
  const body = req.body || {};

  const normalized = normalizeDeliveryStops(
    body.delivery_stops,
    body.delivery_date,
    body.arrival_date
  );
  if (normalized.error) {
    return res.status(400).json({ message: normalized.error });
  }

  const orderDate = body.order_date || null;
  const deliveryDate = normalized.deliveryDate || body.delivery_date || null;
  const arrivalDate = normalized.arrivalDate || body.arrival_date || null;
  const idWarehouse = body.id_warehouse || null;
  const idCustomer = body.id_customer || null;
  const idSubcont = body.id_subcont || null;
  const noSuratJalan = body.no_surat_jalan || "";
  const trip = body.trip || "";
  const truck = body.truck || "";
  const jenisKendaraan = body.jenis_kendaraan || "";
  const tonase = body.tonase || "";
  const tujuanPengiriman = body.tujuan_pengiriman || "";
  const driver = body.driver || "";
  const noInvoice = body.no_invoice || "";
  const billingCustomer = body.billing_customer || "";
  const cost = parseNumber(body.cost);
  const sales = parseNumber(body.sales);
  const grossProfit = sales - cost;
  // Do not overwrite nik_admin on edit — it represents the creator (id_admin).

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      "UPDATE sub_contractor SET order_date = ?, delivery_date = ?, arrival_date = ?, id_warehouse = ?, id_customer = ?, id_subcont = ?, no_surat_jalan = ?, trip = ?, truck = ?, jenis_kendaraan = ?, tonase = ?, tujuan_pengiriman = ?, driver = ?, cost = ?, no_invoice = ?, billing_customer = ?, sales = ?, gross_profit = ? WHERE id_subcontractor = ?",
      [
        orderDate,
        deliveryDate,
        arrivalDate,
        idWarehouse,
        idCustomer,
        idSubcont,
        noSuratJalan,
        trip,
        truck,
        jenisKendaraan,
        tonase,
        tujuanPengiriman,
        driver,
        cost,
        noInvoice,
        billingCustomer,
        sales,
        grossProfit,
        id
      ]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Subcontractor not found" });
    }

    // Always replace stops when delivery_stops provided (empty array clears)
    if (Array.isArray(body.delivery_stops)) {
      await replaceStopsForSubcontractor(conn, id, normalized.stops);
    }

    await conn.commit();

    await notifySubcontractorChange({
      req,
      type: "Updated-Subcontractor",
      title: "Subcontractor diperbarui",
      action: "memperbarui",
      identifier: `ID ${id}`,
      entityId: id
    });

    const [rows] = await db.query(
      "SELECT sub_contractor.*, customer.nama_customer, warehouse.kode_warehouse, warehouse.nm_warehouse, subcont.nama_subcont FROM sub_contractor INNER JOIN customer ON sub_contractor.id_customer = customer.id_customer INNER JOIN warehouse ON sub_contractor.id_warehouse = warehouse.id_warehouse INNER JOIN subcont ON sub_contractor.id_subcont = subcont.id_subcont WHERE sub_contractor.id_subcontractor = ?",
      [id]
    );
    let delivery_stops = [];
    try {
      delivery_stops = await fetchStopsForSubcontractor(id);
    } catch {
      /* ignore */
    }

    res.json({ ...rows[0], delivery_stops });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* ignore */
    }
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    conn.release();
  }
});

router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const [result] = await db.query(
      "DELETE FROM sub_contractor WHERE id_subcontractor = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Subcontractor not found" });
    }
    await notifySubcontractorChange({
      req,
      type: "Deleted-Subcontractor",
      title: "Subcontractor dihapus",
      action: "menghapus",
      identifier: `ID ${id}`,
      entityId: id
    });
    res.json({ message: "Subcontractor deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─── DN (Delivery Note) helpers ───────────────────────────────────────────────

const replaceDNForSubcontractor = async (conn, idSubcontractor, items) => {
  await conn.query(
    "DELETE FROM sub_contractor_dn WHERE id_subcontractor = ?",
    [idSubcontractor]
  );
  for (const item of items) {
    const gwRaw = item.gw;
    const gwVal = (gwRaw !== null && gwRaw !== undefined && gwRaw !== "")
      ? parseFloat(String(gwRaw).replace(",", ".")) || 0
      : 0;
    await conn.query(
      `INSERT INTO sub_contractor_dn
        (id_subcontractor, no_dn, pickup_alamat, drop_alamat, qty, pkg, gw, no_container, no_aju, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idSubcontractor,
        item.no_dn != null ? String(item.no_dn) : "",
        item.pickup_alamat != null ? String(item.pickup_alamat) : "",
        item.drop_alamat != null ? String(item.drop_alamat) : "",
        parseInt(item.qty, 10) || 0,
        item.pkg || "",
        gwVal,
        item.no_container != null ? String(item.no_container) : "",
        item.no_aju != null ? String(item.no_aju) : "",
        item.remarks != null ? String(item.remarks) : ""
      ]
    );
  }
};

// GET /api/subcontractor/:id/dn — ambil daftar DN milik subcontractor
router.get("/:id/dn", authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ message: "Invalid ID" });
  try {
    const [rows] = await db.query(
      `SELECT id, no_dn, pickup_alamat, drop_alamat, qty, pkg, gw, no_container, no_aju, remarks
       FROM sub_contractor_dn
       WHERE id_subcontractor = ?
       ORDER BY id ASC`,
      [id]
    );
    res.json({ items: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/subcontractor/:id/dn — simpan (replace) daftar DN milik subcontractor
router.post("/:id/dn", authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ message: "Invalid ID" });
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  let conn;
  try {
    conn = await db.getConnection();
    await replaceDNForSubcontractor(conn, id, items);
    res.json({ message: "DN saved", count: items.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
