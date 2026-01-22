const express = require("express");
const ExcelJS = require("exceljs");
const db = require("../db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { logAuditEvent } = require("../services/auditLogger");
const { createNotification, getActorFromRequest } = require("../services/notificationService");

const router = express.Router();

function parseNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }
  const str = String(value).replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(str);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return parsed;
}

async function getTruckJenisKendaraan(idTruck) {
  if (!idTruck) {
    return null;
  }
  const [rows] = await db.query(
    "SELECT jenis_kendaraan FROM truck WHERE id_truck = ?",
    [idTruck]
  );
  return rows.length > 0 ? rows[0].jenis_kendaraan : null;
}

const notifySalesCostChange = async ({ req, type, title, action, identifier, entityId }) => {
  const actor = getActorFromRequest(req);
  if (!actor) {
    return;
  }
  try {
    const actorName = actor.nama_admin || "Admin";
    await createNotification({
      type,
      title,
      message: `${actorName} ${action} Sales Cost (${identifier})`,
      actor,
      entity: "sales_cost",
      entityId,
      meta: { route: "/sales-cost" }
    });
  } catch (error) {
    console.error("Failed to create sales cost notification", error);
  }
};

router.get("/", async (req, res) => {
  try {
    const startDate = req.query.start_date || "";
    const endDate = req.query.end_date || "";
    const keyword = String(req.query.q || "").trim();
    const column = String(req.query.column || "all").trim().toLowerCase();

    let sql =
      "SELECT sales_cost.id_sales_cost, sales_cost.tgl_order, sales_cost.delivery_order, sales_cost.arrival_order, sales_cost.price, sales_cost.bills, sales_cost.lift_on, sales_cost.lift_of, sales_cost.ops_cost, sales_cost.additional_cost, sales_cost.total, sales_cost.margin, sales_cost.id_print, customer.nama_customer, area.nama_area, driver.nama_driver, truck.no_police FROM sales_cost LEFT JOIN customer ON sales_cost.id_customer = customer.id_customer LEFT JOIN area ON sales_cost.id_area = area.id_area LEFT JOIN driver ON sales_cost.id_driver = driver.id_driver LEFT JOIN truck ON sales_cost.id_truck = truck.id_truck";

    const conditions = [];
    const params = [];

    const searchableColumns = {
      id_sales_cost: "CAST(sales_cost.id_sales_cost AS CHAR)",
      nama_customer: "customer.nama_customer",
      nama_area: "area.nama_area",
      nama_driver: "driver.nama_driver",
      no_police: "truck.no_police",
      route: "area.nama_area",
      route_name: "area.nama_area",
      driver: "driver.nama_driver",
      driver_name: "driver.nama_driver",
      nopol: "truck.no_police",
      plate_number: "truck.no_police"
    };

    if (startDate) {
      conditions.push("sales_cost.delivery_order >= ?");
      params.push(startDate);
    }

    if (endDate) {
      conditions.push("sales_cost.delivery_order <= ?");
      params.push(endDate + " 23:59:59");
    }

    if (keyword) {
      const likeKeyword = `%${keyword}%`;
      if (column !== "all" && searchableColumns[column]) {
        conditions.push(`${searchableColumns[column]} LIKE ?`);
        params.push(likeKeyword);
      } else {
        const uniqueExpressions = Array.from(
          new Set(Object.values(searchableColumns))
        );
        const orConditions = uniqueExpressions.map(
          (expression) => `${expression} LIKE ?`
        );
        conditions.push(`(${orConditions.join(" OR ")})`);
        params.push(...orConditions.map(() => likeKeyword));
      }
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY sales_cost.id_sales_cost DESC";

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/export", authenticateToken, async (req, res) => {
  try {
    const startDate = req.query.start_date || "";
    const endDate = req.query.end_date || "";
    const keyword = String(req.query.q || "").trim();
    const column = String(req.query.column || "all").trim().toLowerCase();

    // Kolom & urutan mengikuti admin/cetak_excel.php (legacy).
    let sql =
      "SELECT sales_cost.*, customer.nama_customer, area.nama_area, truck.no_police, truck.jenis_kendaraan, driver.nama_driver FROM sales_cost LEFT JOIN customer ON sales_cost.id_customer = customer.id_customer LEFT JOIN area ON sales_cost.id_area = area.id_area LEFT JOIN truck ON sales_cost.id_truck = truck.id_truck LEFT JOIN driver ON sales_cost.id_driver = driver.id_driver";

    const conditions = [];
    const params = [];

    const searchableColumns = {
      id_sales_cost: "CAST(sales_cost.id_sales_cost AS CHAR)",
      nama_customer: "customer.nama_customer",
      nama_area: "area.nama_area",
      nama_driver: "driver.nama_driver",
      no_police: "truck.no_police",
      route: "area.nama_area",
      route_name: "area.nama_area",
      driver: "driver.nama_driver",
      driver_name: "driver.nama_driver",
      nopol: "truck.no_police",
      plate_number: "truck.no_police"
    };

    if (startDate) {
      conditions.push("sales_cost.delivery_order >= ?");
      params.push(startDate);
    }

    if (endDate) {
      conditions.push("sales_cost.delivery_order <= ?");
      params.push(endDate + " 23:59:59");
    }

    if (keyword) {
      const likeKeyword = `%${keyword}%`;
      if (column !== "all" && searchableColumns[column]) {
        conditions.push(`${searchableColumns[column]} LIKE ?`);
        params.push(likeKeyword);
      } else {
        const uniqueExpressions = Array.from(
          new Set(Object.values(searchableColumns))
        );
        const orConditions = uniqueExpressions.map(
          (expression) => `${expression} LIKE ?`
        );
        conditions.push(`(${orConditions.join(" OR ")})`);
        params.push(...orConditions.map(() => likeKeyword));
      }
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY sales_cost.id_sales_cost DESC";

    const [rows] = await db.query(sql, params);

    if (!rows.length) {
      return res.status(404).json({ message: "Tidak ada data untuk diexport." });
    }

    const filename = "Laporan-Sales-Cost.xlsx";

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res,
      useStyles: true
    });
    const worksheet = workbook.addWorksheet("Laporan Sales Cost");

    worksheet.columns = [
      { header: "No.", key: "no", width: 6 },
      { header: "Tanggal Order", key: "tgl_order", width: 16 },
      { header: "Delivery Order", key: "delivery_order", width: 16 },
      { header: "Arrival Order", key: "arrival_order", width: 16 },
      { header: "No. SPK", key: "no_spk", width: 18 },
      { header: "Area", key: "nama_area", width: 20 },
      { header: "Customer", key: "nama_customer", width: 24 },
      { header: "Trip", key: "trip", width: 10 },
      { header: "Jenis", key: "jenis_trip", width: 10 },
      { header: "Container Size", key: "container_size", width: 16 },
      { header: "No. Police", key: "no_police", width: 14 },
      { header: "Jenis Kendaraan", key: "jenis_kendaraan", width: 20 },
      { header: "Driver", key: "nama_driver", width: 20 },
      { header: "Container Repair", key: "container_repair", width: 18 },
      { header: "Demurrage Chargers", key: "demurrage_chargers", width: 20 },
      { header: "Detention Chargers", key: "detention_chargers", width: 20 },
      { header: "Extend Gate Pass", key: "extend_gate_pass", width: 18 },
      { header: "Bills", key: "bills", width: 18 },
      { header: "Lift On", key: "lift_on", width: 14 },
      { header: "Lift Off", key: "lift_of", width: 14 },
      { header: "Container Depot", key: "container_depot", width: 18 },
      { header: "No. PO", key: "no_po", width: 12 },
      { header: "No. Aju", key: "no_aju", width: 12 },
      { header: "No. Container", key: "no_container", width: 16 },
      { header: "TAX", key: "tax", width: 10 },
      { header: "Admin Charge", key: "admin_charge", width: 14 },
      { header: "Allowance Cost", key: "materai", width: 16 },
      { header: "Additional Cost", key: "additional_cost", width: 16 },
      { header: "OPS Cost", key: "ops_cost", width: 16 },
      { header: "Total", key: "total", width: 14 },
      { header: "Sales", key: "price", width: 16 },
      { header: "Gross Profit", key: "margin", width: 16 }
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

    const toNumber = (value) => {
      if (value === null || value === undefined || value === "") {
        return 0;
      }
      if (typeof value === "number") {
        return value;
      }
      const normalized = String(value).replace(/\./g, "").replace(/,/g, ".");
      const parsed = Number(normalized);
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    const formatDate = (date) => {
      if (!date) return "";
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const numberFormat = "[$-421] #,##0";
    const numericKeys = [
      "lift_on",
      "lift_of",
      "container_repair",
      "demurrage_chargers",
      "detention_chargers",
      "extend_gate_pass",
      "admin_charge",
      "materai",
      "additional_cost",
      "ops_cost",
      "total",
      "price",
      "margin"
    ];

    numericKeys.forEach((key) => {
      const column = worksheet.getColumn(key);
      if (column) {
        column.numFmt = numberFormat;
      }
    });

    rows.forEach((row, index) => {
      const excelRow = worksheet.addRow({
        no: index + 1,
        tgl_order: formatDate(row.tgl_order),
        delivery_order: formatDate(row.delivery_order),
        arrival_order: formatDate(row.arrival_order),
        no_spk: `${row.id_sales_cost} /SPK/CLC`,
        nama_area: row.nama_area,
        nama_customer: row.nama_customer,
        trip: row.trip,
        jenis_trip: row.jenis_trip,
        container_size: row.container_size,
        no_police: row.no_police,
        jenis_kendaraan: row.jenis_kendaraan,
        nama_driver: row.nama_driver,
        container_repair: toNumber(row.container_repair),
        demurrage_chargers: toNumber(row.demurrage_chargers),
        detention_chargers: toNumber(row.detention_chargers),
        extend_gate_pass: toNumber(row.extend_gate_pass),
        bills: row.bills,
        lift_on: toNumber(row.lift_on),
        lift_of: toNumber(row.lift_of),
        container_depot: row.container_depot,
        no_po: row.no_po,
        no_aju: row.no_aju,
        no_container: row.no_container,
        tax: row.tax,
        admin_charge: toNumber(row.admin_charge),
        materai: toNumber(row.materai),
        additional_cost: toNumber(row.additional_cost),
        ops_cost: toNumber(row.ops_cost),
        total: toNumber(row.total),
        price: toNumber(row.price),
        margin: toNumber(row.margin)
      });

      numericKeys.forEach((key) => {
        const cell = excelRow.getCell(key);
        if (typeof cell.value === "number") {
          cell.numFmt = numberFormat;
        }
      });

      excelRow.commit();
    });

    worksheet.commit();

    // --- SHEET 2: DN LIST ---
    // 1. Ambil ID Sales Cost yang ada di hasil filter
    const salesCostIds = rows.map((r) => r.id_sales_cost);
    
    // 2. Buat Map SalesCost untuk lookup No. PO, SPK, dll
    const salesCostMap = new Map();
    rows.forEach((r) => {
      salesCostMap.set(Number(r.id_sales_cost), r);
    });

    // 3. Fetch data DN dari MongoDB
    let dnDocs = [];
    if (salesCostIds.length > 0) {
      // Cast to Number to match Schema
      const numericIds = salesCostIds.map(id => Number(id)).filter(n => !Number.isNaN(n));
      // console.log(`Export SalesCost: Found ${numericIds.length} IDs. Fetching DNs...`);
      
      dnDocs = await SalesCostDN.find({ salesCostId: { $in: numericIds } }).lean();
      // console.log(`Export SalesCost: Found ${dnDocs.length} DN documents.`);
    }

    const sheetDN = workbook.addWorksheet("DN List");
    
    // Definisi Kolom DN List
    sheetDN.columns = [
      { header: "ID Sales Cost", key: "id_sales_cost", width: 12 },
      { header: "No. SPK", key: "no_spk", width: 18 },
      { header: "No. PO", key: "no_po", width: 16 },
      { header: "No. Police", key: "no_police", width: 14 },
      { header: "Jenis Kendaraan", key: "jenis_kendaraan", width: 20 }, // NEW
      { header: "Customer", key: "customer", width: 24 },
      { header: "No. DN", key: "no_dn", width: 18 },
      { header: "Pickup Alamat", key: "pickup_alamat", width: 25 },
      { header: "Drop Alamat", key: "drop_alamat", width: 25 },
      { header: "Qty", key: "qty", width: 10 },
      { header: "PKG", key: "pkg", width: 10 },
      { header: "G.W", key: "gw", width: 10 },
      { header: "No. Container", key: "no_container", width: 16 },
      { header: "No. Aju", key: "no_aju", width: 16 },
      { header: "Remarks", key: "remarks", width: 25 },
      { header: "Sales", key: "sales", width: 16 } // NEW
    ];

    // Style Header Sheet 2
    const headerRowDN = sheetDN.getRow(1);
    headerRowDN.font = { bold: true };
    headerRowDN.alignment = { vertical: "middle", horizontal: "center" };
    headerRowDN.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFF00" } // Kuning sama seperti Sheet 1
    };
    headerRowDN.commit();

    // Flatten & Sort Data DN
    let allDnItems = [];
    dnDocs.forEach((doc) => {
      if (doc.items && Array.isArray(doc.items)) {
        doc.items.forEach((item) => {
          allDnItems.push({
            salesCostId: doc.salesCostId,
            ...item
          });
        });
      }
    });

    // Sort by salesCostId ASC, then no_dn ASC
    allDnItems.sort((a, b) => {
      if (a.salesCostId !== b.salesCostId) {
        return a.salesCostId - b.salesCostId;
      }
      const dnA = (a.no_dn || "").toLowerCase();
      const dnB = (b.no_dn || "").toLowerCase();
      if (dnA < dnB) return -1;
      if (dnA > dnB) return 1;
      return 0;
    });

    // Track written Sales values to prevent duplicates per group
    const salesWritten = new Set();

    // Populate Data DN
    allDnItems.forEach((item) => {
      const parent = salesCostMap.get(Number(item.salesCostId));
      const parentNoPO = parent ? (parent.no_po || "") : "";
      const parentSPK = parent ? `${parent.id_sales_cost} /SPK/CLC` : "";
      const parentPolice = parent ? (parent.no_police || "") : "";
      const parentCustomer = parent ? (parent.nama_customer || "") : "";
      
      // Jenis Kendaraan Logic
      let parentVehicle = parent ? (parent.jenis_kendaraan || "") : "";
      if (parent && parent.container_size) {
          parentVehicle += ` ${parent.container_size}`;
      }

      // Sales (Price) Logic - ONLY ONCE PER GROUP
      let finalSales = "";
      if (!salesWritten.has(item.salesCostId)) {
        finalSales = parent ? toNumber(parent.price) : 0;
        salesWritten.add(item.salesCostId);
      }

      const row = sheetDN.addRow({
        id_sales_cost: item.salesCostId,
        no_spk: parentSPK,
        no_po: parentNoPO,
        no_police: parentPolice,
        jenis_kendaraan: parentVehicle,
        customer: parentCustomer,
        no_dn: item.no_dn || "",
        pickup_alamat: item.pickup_alamat || "",
        drop_alamat: item.drop_alamat || "",
        qty: item.qty || "",
        pkg: item.pkg || "",
        gw: item.gw || "",
        no_container: item.no_container || "",
        no_aju: item.no_aju || "",
        remarks: item.remarks || "",
        sales: finalSales
      });

      // Format Sales Column if it has value
      if (finalSales !== "") {
        const salesCell = row.getCell("sales");
        salesCell.numFmt = numberFormat;
      }

      row.commit();
    });

    sheetDN.commit();

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
      "SELECT sales_cost.*, truck.no_police, truck.jenis_kendaraan, driver.nama_driver, area.nama_area, customer.nama_customer, admin.nama_admin AS created_by_name FROM sales_cost LEFT JOIN truck ON sales_cost.id_truck = truck.id_truck LEFT JOIN driver ON sales_cost.id_driver = driver.id_driver LEFT JOIN area ON sales_cost.id_area = area.id_area LEFT JOIN customer ON sales_cost.id_customer = customer.id_customer LEFT JOIN admin ON admin.id_admin = sales_cost.id_admin OR admin.nik_admin = sales_cost.id_admin WHERE sales_cost.id_sales_cost = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Sales cost not found" });
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
    if (!req.user.id_admin) {
      console.error("JWT missing id_admin");
      return res.status(500).json({ message: "Konfigurasi autentikasi tidak valid." });
    }

    const body = req.body || {};

    const tglOrder = body.tgl_order || null;
    const idTruck = body.id_truck || null;
    const idDriver = body.id_driver || null;
    const idArea = body.id_area || null;
    const idCustomer = body.id_customer || null;
    const deliveryOrder = body.delivery_order || null;
    const arrivalOrder = body.arrival_order || null;
    const noDn = body.no_dn || "";
    const containerDepot = body.container_depot || "";
    const noPo = body.no_po || "";
    const noAju = body.no_aju || "";
    const noContainer = body.no_container || "";
    const tax = body.tax || "";
    const trip = body.trip || "";
    const jenisTrip = body.jenis_trip || "";
    const rawContainerSize =
      typeof body.container_size === "string"
        ? body.container_size.trim()
        : body.container_size;
    let containerSize = rawContainerSize ? rawContainerSize : null;
    const idPrint = body.id_print || "";
    const idAdmin = req.user.id_admin;

    // Alamat pickup & drop sekarang adalah TEXT, bukan angka.
    const almtPickup = body.almt_pickup || "";
    const almtDrop = body.almt_drop || "";

    const bills = body.bills || "";
    const liftOn = parseNumber(body.lift_on);
    const liftOf = parseNumber(body.lift_of);

    const adminCharge = parseNumber(body.admin_charge);
    const materai = parseNumber(body.materai);
    const containerRepair = parseNumber(body.container_repair);
    const demurrageChargers = parseNumber(body.demurrage_chargers);
    const detentionChargers = parseNumber(body.detention_chargers);
    const extendGatePass = parseNumber(body.extend_gate_pass);
    const additionalCost = parseNumber(body.additional_cost);
    const opsCost = parseNumber(body.ops_cost);
    const price = parseNumber(body.price);

    // Total cost sekarang menyertakan liftOn/liftOf kembali.
    const total =
      containerRepair +
      demurrageChargers +
      detentionChargers +
      extendGatePass +
      opsCost +
      additionalCost +
      liftOn +
      liftOf;

    const margin = price - total;

    const jenisKendaraan = await getTruckJenisKendaraan(idTruck);
    if (jenisKendaraan === "HB") {
      if (!containerSize) {
        return res.status(400).json({
          message: "Container Size wajib diisi untuk kendaraan HB"
        });
      }
    } else {
      containerSize = null;
    }

    const [result] = await db.query(
      "INSERT INTO sales_cost (tgl_order, id_truck, id_driver, id_area, id_customer, id_admin, delivery_order, arrival_order, bills, lift_on, lift_of, container_depot, no_po, no_aju, no_container, tax, admin_charge, materai, trip, jenis_trip, container_size, price, container_repair, demurrage_chargers, detention_chargers, extend_gate_pass, additional_cost, ops_cost, total, margin, id_print) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        tglOrder,
        idTruck,
        idDriver,
        idArea,
        idCustomer,
        idAdmin,
        deliveryOrder,
        arrivalOrder,
        bills,
        liftOn,
        liftOf,
        containerDepot,
        noPo,
        noAju,
        noContainer,
        tax,
        adminCharge,
        materai,
        trip,
        jenisTrip,
        containerSize,
        price,
        containerRepair,
        demurrageChargers,
        detentionChargers,
        extendGatePass,
        additionalCost,
        opsCost,
        total,
        margin,
        idPrint
      ]
    );

    const [rows] = await db.query(
      "SELECT sales_cost.id_sales_cost, sales_cost.tgl_order, sales_cost.delivery_order, sales_cost.arrival_order, sales_cost.price, sales_cost.ops_cost, sales_cost.margin, sales_cost.id_print, customer.nama_customer FROM sales_cost INNER JOIN customer ON sales_cost.id_customer = customer.id_customer WHERE sales_cost.id_sales_cost = ?",
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

    if (req.user && req.user.level === "user") {
      const [lockRows] = await db.query(
        "SELECT delivery_order FROM sales_cost WHERE id_sales_cost = ?",
        [id]
      );
      if (lockRows.length === 0) {
        return res.status(404).json({ message: "Sales cost not found" });
      }
      const deliveryOrder = lockRows[0].delivery_order;
      if (deliveryOrder) {
        const deliveryDate = new Date(deliveryOrder);
        if (!Number.isNaN(deliveryDate.getTime())) {
          const now = new Date();
          const deliveryYear = deliveryDate.getFullYear();
          const deliveryMonth = deliveryDate.getMonth();
          const locked =
            now.getFullYear() > deliveryYear ||
            (now.getFullYear() === deliveryYear && now.getMonth() > deliveryMonth);
          if (locked) {
            return res
              .status(403)
              .json({ message: "Data terkunci. Tidak bisa diedit." });
          }
        }
      }
    }

    const idTruck = body.id_truck || null;
    const idDriver = body.id_driver || null;
    const idArea = body.id_area || null;
    const idCustomer = body.id_customer || null;
    const deliveryOrder = body.delivery_order || null;
    const arrivalOrder = body.arrival_order || null;
    const noDn = body.no_dn || "";
    const containerDepot = body.container_depot || "";
    const noPo = body.no_po || "";
    const noAju = body.no_aju || "";
    const noContainer = body.no_container || "";
    const tax = body.tax || "";
    const trip = body.trip || "";
    const jenisTrip = body.jenis_trip || "";
    const rawContainerSize =
      typeof body.container_size === "string"
        ? body.container_size.trim()
        : body.container_size;
    let containerSize = rawContainerSize ? rawContainerSize : null;
    
    // Alamat pickup & drop (Text)
    const almtPickup = body.almt_pickup || "";
    const almtDrop = body.almt_drop || "";

    const bills = body.bills || "";
    const liftOn = parseNumber(body.lift_on);
    const liftOf = parseNumber(body.lift_of);

    const adminCharge = parseNumber(body.admin_charge);
    const materai = parseNumber(body.materai);
    const containerRepair = parseNumber(body.container_repair);
    const demurrageChargers = parseNumber(body.demurrage_chargers);
    const detentionChargers = parseNumber(body.detention_chargers);
    const extendGatePass = parseNumber(body.extend_gate_pass);
    const additionalCost = parseNumber(body.additional_cost);
    const opsCost = parseNumber(body.ops_cost);
    const price = parseNumber(body.price);

    // Total cost sekarang menyertakan liftOn/liftOf kembali.
    const total =
      containerRepair +
      demurrageChargers +
      detentionChargers +
      extendGatePass +
      opsCost +
      additionalCost +
      liftOn +
      liftOf;

    const margin = price - total;

    const jenisKendaraan = await getTruckJenisKendaraan(idTruck);
    if (jenisKendaraan === "HB") {
      if (!containerSize) {
        return res.status(400).json({
          message: "Container Size wajib diisi untuk kendaraan HB"
        });
      }
    } else {
      containerSize = null;
    }

    const [result] = await db.query(
      "UPDATE sales_cost SET id_truck = ?, id_driver = ?, id_area = ?, id_customer = ?, delivery_order = ?, arrival_order = ?, bills = ?, lift_on = ?, lift_of = ?, container_depot = ?, no_po = ?, no_aju = ?, no_container = ?, tax = ?, admin_charge = ?, materai = ?, trip = ?, jenis_trip = ?, container_size = ?, price = ?, container_repair = ?, demurrage_chargers = ?, detention_chargers = ?, extend_gate_pass = ?, additional_cost = ?, ops_cost = ?, total = ?, margin = ? WHERE id_sales_cost = ?",
      [
        idTruck,
        idDriver,
        idArea,
        idCustomer,
        deliveryOrder,
        arrivalOrder,
        bills,
        liftOn,
        liftOf,
        containerDepot,
        noPo,
        noAju,
        noContainer,
        tax,
        adminCharge,
        materai,
        trip,
        jenisTrip,
        containerSize,
        price,
        containerRepair,
        demurrageChargers,
        detentionChargers,
        extendGatePass,
        additionalCost,
        opsCost,
        total,
        margin,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Sales cost not found" });
    }

    logAuditEvent("sales_cost_update", {
      id_sales_cost: id,
      id_admin: req.user?.id_admin,
      nik_admin: req.user?.nik_admin,
      level: req.user?.level
    });

    await notifySalesCostChange({
      req,
      type: "Updated-SalesCost",
      title: "Sales Cost diperbarui",
      action: "memperbarui",
      identifier: `ID ${id}`,
      entityId: id
    });

    const [rows] = await db.query(
      "SELECT sales_cost.id_sales_cost, sales_cost.tgl_order, sales_cost.delivery_order, sales_cost.arrival_order, sales_cost.price, sales_cost.ops_cost, sales_cost.margin, sales_cost.id_print, customer.nama_customer FROM sales_cost INNER JOIN customer ON sales_cost.id_customer = customer.id_customer WHERE sales_cost.id_sales_cost = ?",
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
      "DELETE FROM sales_cost WHERE id_sales_cost = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Sales cost not found" });
    }
    await notifySalesCostChange({
      req,
      type: "Deleted-SalesCost",
      title: "Sales Cost dihapus",
      action: "menghapus",
      identifier: `ID ${id}`,
      entityId: id
    });
    res.json({ message: "Sales cost deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

const SalesCostDN = require("../models/SalesCostDN");

router.get("/:id/dn", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const dnDoc = await SalesCostDN.findOne({ salesCostId: Number(id) });

    if (!dnDoc) {
      return res.json({ items: [] });
    }

    res.json({ items: dnDoc.items });
  } catch (error) {
    console.error("Error fetching DN list:", error);
    res.status(500).json({ message: "Failed to fetch DN list" });
  }
});

router.put("/:id/dn", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "Items must be an array" });
    }

    const dnDoc = await SalesCostDN.findOneAndUpdate(
      { salesCostId: Number(id) },
      { items: items },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ message: "DN list saved successfully", items: dnDoc.items });
  } catch (error) {
    console.error("Error saving DN list:", error);
    res.status(500).json({ message: "Failed to save DN list", error: error.message });
  }
});

module.exports = router;
