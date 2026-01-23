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

function buildFilters(query) {
  const startDate = query.start_date || "";
  const endDate = query.end_date || "";
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
      "SELECT sub_contractor.order_date, sub_contractor.delivery_date, sub_contractor.arrival_date, sub_contractor.trip, sub_contractor.truck, sub_contractor.jenis_kendaraan, sub_contractor.tonase, sub_contractor.tujuan_pengiriman, sub_contractor.driver, sub_contractor.no_surat_jalan, sub_contractor.cost, sub_contractor.no_invoice, sub_contractor.billing_customer, sub_contractor.sales, sub_contractor.gross_profit, customer.nama_customer, warehouse.kode_warehouse, warehouse.nm_warehouse, subcont.nama_subcont FROM sub_contractor INNER JOIN customer ON sub_contractor.id_customer = customer.id_customer INNER JOIN warehouse ON sub_contractor.id_warehouse = warehouse.id_warehouse INNER JOIN subcont ON sub_contractor.id_subcont = subcont.id_subcont";

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY sub_contractor.id_subcontractor DESC";

    const [rows] = await db.query(sql, params);

    if (!rows.length) {
      return res.status(404).json({ message: "Tidak ada data untuk diexport." });
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

    worksheet.columns = [
      { header: "No.", key: "no", width: 6 },
      { header: "Order Date", key: "order_date", width: 14 },
      { header: "Delivery Date", key: "delivery_date", width: 14 },
      { header: "Arrival Date", key: "arrival_date", width: 14 },
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

    rows.forEach((row, index) => {
      const excelRow = worksheet.addRow({
        no: index + 1,
        order_date: formatDate(row.order_date),
        delivery_date: formatDate(row.delivery_date),
        arrival_date: formatDate(row.arrival_date),
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
      });

      ["cost", "sales", "gross_profit"].forEach((key) => {
        const cell = excelRow.getCell(key);
        if (typeof cell.value === "number") {
          cell.numFmt = numberFormat;
        }
      });

      excelRow.commit();
    });

    worksheet.commit();
    await workbook.commit();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query(
      "SELECT sub_contractor.*, customer.nama_customer, warehouse.kode_warehouse, warehouse.nm_warehouse, subcont.nama_subcont FROM sub_contractor INNER JOIN customer ON sub_contractor.id_customer = customer.id_customer INNER JOIN warehouse ON sub_contractor.id_warehouse = warehouse.id_warehouse INNER JOIN subcont ON sub_contractor.id_subcont = subcont.id_subcont WHERE sub_contractor.id_subcontractor = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Subcontractor not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body || {};
    const orderDate = body.order_date || null;
    const deliveryDate = body.delivery_date || null;
    const arrivalDate = body.arrival_date || null;
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
    const nikAdmin = req.user.nik_admin || req.user.id_admin || 0;

    const [result] = await db.query(
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

    const [rows] = await db.query(
      "SELECT sub_contractor.*, customer.nama_customer, warehouse.kode_warehouse, warehouse.nm_warehouse, subcont.nama_subcont FROM sub_contractor INNER JOIN customer ON sub_contractor.id_customer = customer.id_customer INNER JOIN warehouse ON sub_contractor.id_warehouse = warehouse.id_warehouse INNER JOIN subcont ON sub_contractor.id_subcont = subcont.id_subcont WHERE sub_contractor.id_subcontractor = ?",
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      data: rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};

    const orderDate = body.order_date || null;
    const deliveryDate = body.delivery_date || null;
    const arrivalDate = body.arrival_date || null;
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
    const nikAdmin = req.user?.nik_admin || req.user?.id_admin || 0;

    const [result] = await db.query(
      "UPDATE sub_contractor SET order_date = ?, delivery_date = ?, arrival_date = ?, id_warehouse = ?, id_customer = ?, id_subcont = ?, no_surat_jalan = ?, trip = ?, truck = ?, jenis_kendaraan = ?, tonase = ?, tujuan_pengiriman = ?, driver = ?, cost = ?, no_invoice = ?, billing_customer = ?, sales = ?, gross_profit = ?, nik_admin = ? WHERE id_subcontractor = ?",
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
        nikAdmin,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Subcontractor not found" });
    }

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

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
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

module.exports = router;
