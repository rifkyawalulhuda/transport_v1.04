const express = require("express");
const ExcelJS = require("exceljs");
const multer = require("multer");
const db = require("../db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { logAuditEvent } = require("../services/auditLogger");
const { createNotification, getActorFromRequest } = require("../services/notificationService");
const SalesCostDN = require("../models/SalesCostDN");
const { fetchAreaRouteStepsMap } = require("../services/areaRouteService");

const DEFAULT_FINISH_GEOFENCE_NAME = String(
  process.env.DEFAULT_FINISH_GEOFENCE_NAME || "Sankyu"
).trim();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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

function isValidIsoDate(value) {
  if (typeof value !== "string") {
    return false;
  }
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

function isValidIsoDateTime(value) {
  if (typeof value !== 'string') return false;
  // Accept YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM or YYYY-MM-DD HH:MM
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (!match) return false;
  const d = new Date(value.replace('T', ' '));
  return !Number.isNaN(d.getTime());
}

function parseExcelDate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "object" && value.result !== undefined) {
    return parseExcelDate(value.result);
  }
  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
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

async function getTruckStatus(idTruck) {
  if (!idTruck) {
    return null;
  }
  const [rows] = await db.query(
    "SELECT id_truck, jenis_kendaraan, is_active FROM truck WHERE id_truck = ?",
    [idTruck]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function getDriverStatus(idDriver) {
  if (!idDriver) {
    return null;
  }
  const [rows] = await db.query(
    "SELECT id_driver, nama_driver, is_active FROM driver WHERE id_driver = ?",
    [idDriver]
  );
  return rows.length > 0 ? rows[0] : null;
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

router.get("/import/template", authenticateToken, async (req, res) => {
  try {
    // 1. Fetch Master Data
    const [customers] = await db.query("SELECT id_customer, nama_customer FROM customer ORDER BY nama_customer ASC");
    const [drivers] = await db.query("SELECT id_driver, nama_driver FROM driver WHERE is_active = 1 ORDER BY nama_driver ASC");
    const [areas] = await db.query("SELECT id_area, nama_area FROM area ORDER BY nama_area ASC");
    const [trucks] = await db.query("SELECT id_truck, no_police, jenis_kendaraan FROM truck WHERE is_active = 1 ORDER BY no_police ASC");
    const containerSizes = ["20 Feet", "40 Feet"];

    const workbook = new ExcelJS.Workbook();

    // --- SHEET 1: MASTER (HIDDEN) ---
    const sheetMaster = workbook.addWorksheet("Master");
    sheetMaster.state = "veryHidden";

    // Headers
    sheetMaster.columns = [
      { header: "ID Customer", key: "id_cust" },
      { header: "Nama Customer", key: "nama_cust" },
      { header: "Display Customer", key: "display_cust" }, // Col C
      { header: "ID Driver", key: "id_driver" },
      { header: "Nama Driver", key: "nama_driver" },
      { header: "Display Driver", key: "display_driver" }, // Col F
      { header: "ID Route", key: "id_route" },
      { header: "Nama Route", key: "nama_route" },
      { header: "Display Route", key: "display_route" }, // Col I
      { header: "ID Truck", key: "id_truck" },
      { header: "No Police", key: "no_police" },
      { header: "Jenis Kendaraan", key: "jenis_kendaraan" },
      { header: "Display Truck", key: "display_truck" }, // Col M
      { header: "Container Size", key: "container_size" } // Col N
    ];

    const maxRows = Math.max(
      customers.length,
      drivers.length,
      areas.length,
      trucks.length,
      containerSizes.length
    );

    for (let i = 0; i < maxRows; i++) {
      const row = {};
      
      if (customers[i]) {
        row.id_cust = customers[i].id_customer;
        row.nama_cust = customers[i].nama_customer;
        row.display_cust = `${customers[i].id_customer} - ${customers[i].nama_customer}`;
      }
      
      if (drivers[i]) {
        row.id_driver = drivers[i].id_driver;
        row.nama_driver = drivers[i].nama_driver;
        row.display_driver = `${drivers[i].id_driver} - ${drivers[i].nama_driver}`;
      }

      if (areas[i]) {
        row.id_route = areas[i].id_area;
        row.nama_route = areas[i].nama_area;
        row.display_route = `${areas[i].id_area} - ${areas[i].nama_area}`;
      }

      if (trucks[i]) {
        row.id_truck = trucks[i].id_truck;
        row.no_police = trucks[i].no_police;
        row.jenis_kendaraan = trucks[i].jenis_kendaraan || "";
        row.display_truck = `${trucks[i].id_truck} - ${trucks[i].no_police} - ${trucks[i].jenis_kendaraan || ""}`;
      }

      if (containerSizes[i]) {
        row.container_size = containerSizes[i];
      }
      
      sheetMaster.addRow(row);
    }

    // Defined Names (Workbook Scope)
    // C2:C<last>
    // Note: definedNames.add might accept range as string
    const addName = (name, range) => {
        // ExcelJS expects (location, name)
        if (workbook.definedNames && typeof workbook.definedNames.add === 'function') {
            workbook.definedNames.add(range, name);
        }
    };

    if (customers.length > 0) {
      addName("CUSTOMER_LIST", `Master!$C$2:$C$${customers.length + 1}`);
    }
    if (drivers.length > 0) {
      addName("DRIVER_LIST", `Master!$F$2:$F$${drivers.length + 1}`);
    }
    if (areas.length > 0) {
      addName("ROUTE_LIST", `Master!$I$2:$I$${areas.length + 1}`);
    }
    if (trucks.length > 0) {
      addName("TRUCK_LIST", `Master!$M$2:$M$${trucks.length + 1}`);
    }
    if (containerSizes.length > 0) {
      addName("CONTAINER_SIZE_LIST", `Master!$N$2:$N$${containerSizes.length + 1}`);
    }

    // --- SHEET 2: SalesCost ---
    const sheetSales = workbook.addWorksheet("SalesCost");
    
    // Headers
    const salesHeaders = [
      "Temp ID",
      "Truck (ID - No Police - Jenis Kendaraan)",
      "Driver (ID - Nama)",
      "Route (ID - Nama)",
      "Customer (ID - Nama)",
      "Delivery Order (YYYY-MM-DD)",
      "Arrival Order (YYYY-MM-DD)",
      "Finish Order (YYYY-MM-DD)",
      "Bills",
      "Lift On",
      "Lift Off",
      "Container Depot",
      "No PO",
      "No Aju",
      "No Container",
      "Tax",
      "Admin Charge",
      "Materai",
      "Trip",
      "Jenis Trip",
      "Container Size",
      "Price",
      "Container Repair",
      "Demurrage Chargers",
      "Detention Chargers",
      "Extend Gate Pass",
      "Additional Cost",
      "Ops Cost",
      "ID Print"
    ];
    
    sheetSales.addRow(salesHeaders);
    
    // Data Validation (Rows 2-1000)
    for (let r = 2; r <= 1000; r++) {
      // Truck: Col B (2)
      sheetSales.getCell(`B${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['TRUCK_LIST'],
        showErrorMessage: true,
        errorTitle: 'Invalid Input',
        error: 'Select from dropdown'
      };

      // Driver: Col C (3)
      sheetSales.getCell(`C${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['DRIVER_LIST'],
        showErrorMessage: true,
        errorTitle: 'Invalid Input',
        error: 'Select from dropdown'
      };

      // Route: Col D (4)
      sheetSales.getCell(`D${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['ROUTE_LIST'],
        showErrorMessage: true,
        errorTitle: 'Invalid Input',
        error: 'Select from dropdown'
      };

      // Customer: Col E (5)
      sheetSales.getCell(`E${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['CUSTOMER_LIST'],
        showErrorMessage: true,
        errorTitle: 'Invalid Input',
        error: 'Select from dropdown'
      };

      // Jenis Trip: Col T (20)
      sheetSales.getCell(`T${r}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"Day,Trip"'],
        showErrorMessage: true,
        errorTitle: 'Invalid value',
        error: 'Pilih nilai dari dropdown (Day atau Trip)'
      };

      // Container Size: Col U (21)
      sheetSales.getCell(`U${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['=CONTAINER_SIZE_LIST'],
        showErrorMessage: true,
        errorTitle: 'Invalid value',
        error: 'Pilih nilai dari dropdown (20 Feet atau 40 Feet)'
      };
    }
    
    // Style Header
    const headerRow = sheetSales.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFF00" }
    };
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    });
    sheetSales.columns.forEach(col => { col.width = 25; });
    sheetSales.views = [{ state: "frozen", ySplit: 1 }];
    sheetSales.autoFilter = { from: "A1", to: "AC1" };

    const jenisTripHeaderCell = sheetSales.getCell("T1");
    jenisTripHeaderCell.note = "Jangan ketik manual, pilih dari dropdown\nPilihan: Day, Trip";
    const containerSizeHeaderCell = sheetSales.getCell("U1");
    containerSizeHeaderCell.note = "Jika Truck jenis HB, Container Size wajib diisi\nPilihan: 20 Feet / 40 Feet";

    // --- SHEET 3: DNList ---
    const sheetDN = workbook.addWorksheet("DNList");
    const dnHeaders = [
      "Temp ID", // Link to SalesCost
      "No DN",
      "Pickup Alamat",
      "Drop Alamat",
      "Qty",
      "PKG (IBC/CTN/PIL/DRM)",
      "G.W",
      "No Container",
      "No Aju",
      "Remarks"
    ];
    sheetDN.addRow(dnHeaders);
    
    // PKG Validation
    for (let r = 2; r <= 5000; r++) {
      sheetDN.getCell(`F${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"IBC,CTN,PIL,DRM"'],
        showErrorMessage: true
      };
    }

    const dnHeaderRow = sheetDN.getRow(1);
    dnHeaderRow.font = { bold: true };
    dnHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFF00" }
    };
    sheetDN.columns.forEach(col => { col.width = 20; });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="Template-Sales-Cost.xlsx"');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Error generating template:", error);
    res.status(500).json({ message: "Failed to generate template" });
  }
});

router.post("/import", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const sheetSales = workbook.getWorksheet("SalesCost");
    const sheetDN = workbook.getWorksheet("DNList");

    if (!sheetSales) {
      return res.status(400).json({ message: "Sheet 'SalesCost' not found" });
    }
    const finishOrderHeader = String(sheetSales.getCell("H1").value || "")
      .trim()
      .toLowerCase();
    if (!finishOrderHeader.startsWith("finish order")) {
      return res.status(400).json({
        message:
          "Template tidak sesuai versi terbaru. Silakan download ulang template Sales Cost (kolom Finish Order wajib ada)."
      });
    }

    const parseId = (str, fieldName) => {
      if (!str) return null;
      if (typeof str === 'number') return str;
      const parts = String(str).split(' - ');
      if (parts.length < 2) {
        // If exact match fails, try to see if it's just ID (fallback)
        const id = parseInt(str);
        if (!isNaN(id) && id > 0) return id;
        throw new Error(`Invalid format for ${fieldName}: "${str}". Expected "ID - Name"`);
      }
      const id = parseInt(parts[0].trim());
      if (isNaN(id) || id <= 0) {
        throw new Error(`Invalid ID for ${fieldName}: "${parts[0]}"`);
      }
      return id;
    };

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const salesMap = new Map(); // TempID -> Inserted ID
      const salesRows = [];
      const failures = [];

      sheetSales.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        
        // Skip empty rows (check Temp ID and Truck)
        if (!row.getCell(1).value && !row.getCell(2).value) return;

        salesRows.push({
          rowNumber,
          tempId: row.getCell(1).value,
          truckStr: row.getCell(2).value,
          driverStr: row.getCell(3).value,
          routeStr: row.getCell(4).value,
          custStr: row.getCell(5).value,
          deliveryOrder: row.getCell(6).value,
          arrivalOrder: row.getCell(7).value,
          finishOrder: row.getCell(8).value,
          bills: row.getCell(9).value,
          liftOn: row.getCell(10).value,
          liftOf: row.getCell(11).value,
          containerDepot: row.getCell(12).value,
          noPo: row.getCell(13).value,
          noAju: row.getCell(14).value,
          noContainer: row.getCell(15).value,
          tax: row.getCell(16).value,
          adminCharge: row.getCell(17).value,
          materai: row.getCell(18).value,
          trip: row.getCell(19).value,
          jenisTrip: row.getCell(20).value,
          containerSize: row.getCell(21).value,
          price: row.getCell(22).value,
          containerRepair: row.getCell(23).value,
          demurrage: row.getCell(24).value,
          detention: row.getCell(25).value,
          extendGate: row.getCell(26).value,
          addCost: row.getCell(27).value,
          opsCost: row.getCell(28).value,
          idPrint: row.getCell(29).value,
        });
      });

      const truckIds = new Set();
      for (const row of salesRows) {
        try {
          row.parsedTruckId = parseId(row.truckStr, `Row ${row.rowNumber} Truck`);
          truckIds.add(row.parsedTruckId);
        } catch (err) {
          row.truckParseError = err;
        }
      }

      const truckJenisMap = new Map();
      if (truckIds.size > 0) {
        const truckIdList = Array.from(truckIds);
        const placeholders = truckIdList.map(() => "?").join(",");
        const [truckRows] = await connection.query(
          `SELECT id_truck, jenis_kendaraan FROM truck WHERE is_active = 1 AND id_truck IN (${placeholders})`,
          truckIdList
        );
        for (const truck of truckRows) {
          truckJenisMap.set(Number(truck.id_truck), truck.jenis_kendaraan);
        }
      }

      let successCountSalesCost = 0;
      for (const row of salesRows) {
        try {
          if (row.truckParseError) {
            failures.push({
              sheet: "SalesCost",
              temp_id: row.tempId || null,
              rowNumber: row.rowNumber,
              reasonCode: "TRUCK_INVALID_FORMAT",
              reason: row.truckParseError.message || "Invalid truck format"
            });
            continue;
          }

          const deliveryDate = parseExcelDate(row.deliveryOrder);
          if (!deliveryDate) {
            failures.push({
              sheet: "SalesCost",
              temp_id: row.tempId || null,
              rowNumber: row.rowNumber,
              reasonCode: "INVALID_DELIVERY_ORDER_FORMAT",
              reason: "invalid departure_datetime format"
            });
            continue;
          }

          const finishDate = parseExcelDate(row.finishOrder);
          if (!finishDate) {
            failures.push({
              sheet: "SalesCost",
              temp_id: row.tempId || null,
              rowNumber: row.rowNumber,
              reasonCode: "INVALID_FINISH_ORDER_FORMAT",
              reason: "invalid finish_order_datetime format"
            });
            continue;
          }

          const jenisTripValue = row.jenisTrip === null || row.jenisTrip === undefined
            ? ""
            : String(row.jenisTrip).trim();
          if (jenisTripValue !== "Day" && jenisTripValue !== "Trip") {
            failures.push({
              sheet: "SalesCost",
              temp_id: row.tempId || null,
              rowNumber: row.rowNumber,
              reasonCode: "JENIS_TRIP_INVALID",
              reason: "Jenis Trip must be Day or Trip"
            });
            continue;
          }

          let arrivalDate = null;
          if (row.arrivalOrder !== null && row.arrivalOrder !== undefined && row.arrivalOrder !== "") {
            arrivalDate = parseExcelDate(row.arrivalOrder);
            if (!arrivalDate) {
              failures.push({
                sheet: "SalesCost",
                temp_id: row.tempId || null,
                rowNumber: row.rowNumber,
                reasonCode: "INVALID_ARRIVAL_FORMAT",
                reason: "invalid arrival format"
              });
              continue;
            }
          }

          // Parse IDs
          const idTruck = row.parsedTruckId;
          const idDriver = parseId(row.driverStr, `Row ${row.rowNumber} Driver`);
          const idArea = parseId(row.routeStr, `Row ${row.rowNumber} Route`);
          const idCustomer = parseId(row.custStr, `Row ${row.rowNumber} Customer`);

          const [driverRows] = await connection.query(
            "SELECT id_driver FROM driver WHERE is_active = 1 AND id_driver = ? LIMIT 1",
            [idDriver]
          );
          if (driverRows.length === 0) {
            failures.push({
              sheet: "SalesCost",
              temp_id: row.tempId || null,
              rowNumber: row.rowNumber,
              reasonCode: "DRIVER_INACTIVE_OR_NOT_FOUND",
              reason: "Driver tidak ditemukan atau sudah nonaktif"
            });
            continue;
          }

          if (!truckJenisMap.has(Number(idTruck))) {
            failures.push({
              sheet: "SalesCost",
              temp_id: row.tempId || null,
              rowNumber: row.rowNumber,
              reasonCode: "TRUCK_INACTIVE_OR_NOT_FOUND",
              reason: "Truck tidak ditemukan atau sudah nonaktif"
            });
            continue;
          }

          const containerSizeValue =
            row.containerSize === null || row.containerSize === undefined
              ? ""
              : String(row.containerSize).trim();
          let containerSizeNormalized = containerSizeValue;

          if (
            containerSizeNormalized &&
            containerSizeNormalized !== "20 Feet" &&
            containerSizeNormalized !== "40 Feet"
          ) {
            failures.push({
              sheet: "SalesCost",
              temp_id: row.tempId || null,
              rowNumber: row.rowNumber,
              reasonCode: "CONTAINER_SIZE_INVALID",
              reason: "Container Size must be 20 Feet or 40 Feet"
            });
            continue;
          }

          const jenisKendaraan = String(truckJenisMap.get(Number(idTruck)) || "")
            .trim()
            .toUpperCase();
          if (jenisKendaraan === "HB" && !containerSizeNormalized) {
            failures.push({
              sheet: "SalesCost",
              temp_id: row.tempId || null,
              rowNumber: row.rowNumber,
              reasonCode: "CONTAINER_SIZE_REQUIRED",
              reason: "Tolong Masukan Container Size"
            });
            continue;
          }
          if (jenisKendaraan !== "HB") {
            containerSizeNormalized = null;
          }

          // Calculate
          const liftOn = parseNumber(row.liftOn);
          const liftOf = parseNumber(row.liftOf);
          const containerRepair = parseNumber(row.containerRepair);
          const demurrage = parseNumber(row.demurrage);
          const detention = parseNumber(row.detention);
          const extendGate = parseNumber(row.extendGate);
          const opsCost = parseNumber(row.opsCost);
          const addCost = parseNumber(row.addCost);
          const price = parseNumber(row.price);

          const total = containerRepair + demurrage + detention + extendGate + opsCost + addCost + liftOn + liftOf;
          const margin = price - total;

          const [res] = await connection.query(
            `INSERT INTO sales_cost (
               tgl_order, id_truck, id_driver, id_area, id_customer, id_admin,
               departure_datetime, arrival_datetime, finish_order_datetime, bills, lift_on, lift_of, container_depot,
               no_po, no_aju, no_container, tax, admin_charge, materai,
               trip, jenis_trip, container_size, price, container_repair,
               demurrage_chargers, detention_chargers, extend_gate_pass,
               additional_cost, ops_cost, total, margin, id_print
             ) VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              idTruck, idDriver, idArea, idCustomer, req.user.id_admin,
              deliveryDate, arrivalDate, finishDate, row.bills || "", liftOn, liftOf, row.containerDepot || "",
              row.noPo || "", row.noAju || "", row.noContainer || "", row.tax || "", row.adminCharge || 0, row.materai || 0,
              row.trip || "", jenisTripValue, containerSizeNormalized, price, containerRepair,
              demurrage, detention, extendGate, addCost, opsCost, total, margin, row.idPrint || ""
            ]
          );

          if (row.tempId) {
              salesMap.set(String(row.tempId), res.insertId);
          }
          successCountSalesCost += 1;
        } catch (err) {
          failures.push({
            sheet: "SalesCost",
            temp_id: row.tempId || null,
            rowNumber: row.rowNumber,
            reasonCode: "IMPORT_ERROR",
            reason: err.message || "Import failed"
          });
        }
      }

      // Process DNList
      if (sheetDN) {
        const dnItems = [];
        sheetDN.eachRow((row, rowNumber) => {
           if (rowNumber === 1) return;
           const tempId = row.getCell(1).value;
           if (!tempId) return;

           const salesCostId = salesMap.get(String(tempId));
           if (!salesCostId) return; // Skip if no parent found
           
           dnItems.push({
             salesCostId,
             no_dn: row.getCell(2).value ? String(row.getCell(2).value) : "",
             pickup_alamat: row.getCell(3).value ? String(row.getCell(3).value) : "",
             drop_alamat: row.getCell(4).value ? String(row.getCell(4).value) : "",
             qty: row.getCell(5).value ? String(row.getCell(5).value) : "",
             pkg: row.getCell(6).value ? String(row.getCell(6).value) : "",
             gw: row.getCell(7).value ? String(row.getCell(7).value) : "",
             no_container: row.getCell(8).value ? String(row.getCell(8).value) : "",
             no_aju: row.getCell(9).value ? String(row.getCell(9).value) : "",
             remarks: row.getCell(10).value ? String(row.getCell(10).value) : ""
           });
        });

        // Group and Upsert
        const dnBySales = {};
        for (const item of dnItems) {
            if (!dnBySales[item.salesCostId]) {
                dnBySales[item.salesCostId] = [];
            }
            const { salesCostId, ...dnData } = item;
            dnBySales[salesCostId].push(dnData);
        }

        for (const scId in dnBySales) {
            await SalesCostDN.findOneAndUpdate(
                { salesCostId: Number(scId) },
                { items: dnBySales[scId] },
                { upsert: true, new: true }
            );
        }
      }

      await connection.commit();
      res.json({
        successCountSalesCost,
        failCountSalesCost: failures.length,
        failures
      });

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ message: error.message || "Import failed" });
  }
});

router.get("/", async (req, res) => {
  try {
    const startDate = req.query.start_date || "";
    const endDate = req.query.end_date || "";
    const yearParam = String(req.query.year || "").trim();
    const year = Number.parseInt(yearParam, 10);
    const keyword = String(req.query.q || "").trim();
    const column = String(req.query.column || "all").trim().toLowerCase();

    let sql =
      "SELECT sales_cost.id_sales_cost, sales_cost.tgl_order, sales_cost.departure_datetime, sales_cost.arrival_datetime, sales_cost.price, sales_cost.bills, sales_cost.lift_on, sales_cost.lift_of, sales_cost.ops_cost, sales_cost.additional_cost, sales_cost.total, sales_cost.margin, sales_cost.id_print, customer.nama_customer, area.nama_area, driver.nama_driver, truck.no_police FROM sales_cost LEFT JOIN customer ON sales_cost.id_customer = customer.id_customer LEFT JOIN area ON sales_cost.id_area = area.id_area LEFT JOIN driver ON sales_cost.id_driver = driver.id_driver LEFT JOIN truck ON sales_cost.id_truck = truck.id_truck";

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
      conditions.push("sales_cost.departure_datetime >= ?");
      params.push(startDate);
    }

    if (endDate) {
      conditions.push("sales_cost.departure_datetime <= ?");
      params.push(endDate + " 23:59:59");
    }

    if (yearParam && Number.isInteger(year) && year >= 1900 && year <= 9999) {
      conditions.push("YEAR(sales_cost.departure_datetime) = ?");
      params.push(year);
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
    const yearParam = String(req.query.year || "").trim();
    const year = Number.parseInt(yearParam, 10);
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
      conditions.push("sales_cost.departure_datetime >= ?");
      params.push(startDate);
    }

    if (endDate) {
      conditions.push("sales_cost.departure_datetime <= ?");
      params.push(endDate + " 23:59:59");
    }

    if (yearParam && Number.isInteger(year) && year >= 1900 && year <= 9999) {
      conditions.push("YEAR(sales_cost.departure_datetime) = ?");
      params.push(year);
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
      { header: "Departure", key: "departure_datetime", width: 18 },
      { header: "Arrival", key: "arrival_datetime", width: 18 },
      { header: "Finish Order", key: "finish_order_datetime", width: 18 },
      { header: "Waktu Pengiriman", key: "waktu_pengiriman", width: 18 },
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

    const formatDateTime = (date) => {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const parseDateOnly = (value) => {
      if (!value) return null;
      if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return null;
        return new Date(value.getFullYear(), value.getMonth(), value.getDate());
      }
      const str = String(value).trim();
      const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
      }
      const parsed = new Date(str);
      if (Number.isNaN(parsed.getTime())) return null;
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    };

    const buildShippingDuration = (deliveryOrder, arrivalOrder) => {
      const delivery = parseDateOnly(deliveryOrder);
      const arrival = parseDateOnly(arrivalOrder);
      if (!delivery || !arrival) {
        return "";
      }
      const diffDays = Math.floor((arrival.getTime() - delivery.getTime()) / 86400000);
      if (diffDays < 0) {
        return "";
      }
      return `${diffDays + 1} Hari`;
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
        departure_datetime: formatDateTime(row.departure_datetime),
        arrival_datetime: formatDateTime(row.arrival_datetime),
        finish_order_datetime: formatDateTime(row.finish_order_datetime),
        waktu_pengiriman: buildShippingDuration(row.departure_datetime, row.arrival_datetime),
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
    // 1. Ambil ID Sales Cost yang ada di hasil filter (urutan mengikuti sheet utama)
    const salesCostIds = rows.map((r) => r.id_sales_cost);
    const salesCostOrder = new Map();
    rows.forEach((r, index) => {
      salesCostOrder.set(Number(r.id_sales_cost), index);
    });
    
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
      { header: "Departure", key: "departure_datetime", width: 18 }, // NEW
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

    // Sort by Sales Cost order (newest to oldest mengikuti sheet utama), then no_dn ASC
    allDnItems.sort((a, b) => {
      const orderA = salesCostOrder.get(Number(a.salesCostId)) ?? Number.MAX_SAFE_INTEGER;
      const orderB = salesCostOrder.get(Number(b.salesCostId)) ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) {
        return orderA - orderB;
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
      const parentDeliveryOrder = parent ? formatDateTime(parent.departure_datetime) : "";
      
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
        departure_datetime: parentDeliveryOrder,
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

router.get("/years", async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT YEAR(departure_datetime) AS year
       FROM sales_cost
       WHERE departure_datetime IS NOT NULL
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

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query(
      `
        SELECT
          sales_cost.*,
          truck.no_police,
          truck.jenis_kendaraan,
          driver.nama_driver,
          area.nama_area,
          area.kode_area,
          area.finish_geofence_resource_id,
          area.finish_geofence_zone_id,
          area.finish_geofence_zone_name,
          customer.nama_customer,
          admin.nama_admin AS created_by_name
        FROM sales_cost
        LEFT JOIN truck ON sales_cost.id_truck = truck.id_truck
        LEFT JOIN driver ON sales_cost.id_driver = driver.id_driver
        LEFT JOIN area ON sales_cost.id_area = area.id_area
        LEFT JOIN customer ON sales_cost.id_customer = customer.id_customer
        LEFT JOIN admin ON admin.id_admin = sales_cost.id_admin OR admin.nik_admin = sales_cost.id_admin
        WHERE sales_cost.id_sales_cost = ?
      `,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Sales cost not found" });
    }
    const detail = rows[0];
    const routeStepsMap = await fetchAreaRouteStepsMap([detail.id_area]);
    const plannedSteps = routeStepsMap.get(Number(detail.id_area)) || [];
    const finishGeofenceName = String(
      detail.finish_geofence_zone_name || DEFAULT_FINISH_GEOFENCE_NAME
    ).trim();
    const [historyRows] = await db.query(
      `
        SELECT
          id_sales_cost_route_history,
          id_sales_cost,
          id_area,
          id_area_route_step,
          id_sc_stop,
          is_manual,
          step_key,
          system_step_code,
          id_truck,
          step_order_snapshot,
          step_name_snapshot,
          wialon_resource_id,
          wialon_zone_id,
          wialon_zone_name,
          gps_time,
          recorded_at,
          lat,
          lon
        FROM sales_cost_route_history
        WHERE id_sales_cost = ?
        ORDER BY gps_time ASC, id_sales_cost_route_history ASC
      `,
      [id]
    );

    const [deliveryStopRows] = await db.query(
      `SELECT id, id_sales_cost, stop_order, stop_name,
              wialon_resource_id, wialon_zone_id, wialon_zone_name,
              is_departure, is_finish, estimated_arrival
       FROM sales_cost_step_schedule
       WHERE id_sales_cost = ?
       ORDER BY stop_order ASC`,
      [id]
    );

    res.json({
      ...detail,
        route_steps: plannedSteps,
        finish_step: {
          id_area_route_step: null,
          step_key: "system:finish_order",
          system_step_code: "finish_order",
          step_order: plannedSteps.length + 1,
          step_name: "Finish Order",
          wialon_resource_id: detail.finish_geofence_resource_id
            ? Number(detail.finish_geofence_resource_id)
            : null,
          wialon_zone_id: detail.finish_geofence_zone_id
            ? Number(detail.finish_geofence_zone_id)
            : null,
          wialon_zone_name: finishGeofenceName
        },
      delivery_stops: deliveryStopRows.map(r => ({
        id: Number(r.id),
        id_sales_cost: Number(r.id_sales_cost),
        stop_order: Number(r.stop_order),
        stop_name: r.stop_name || '',
        wialon_resource_id: r.wialon_resource_id ? Number(r.wialon_resource_id) : null,
        wialon_zone_id: r.wialon_zone_id ? Number(r.wialon_zone_id) : null,
        wialon_zone_name: r.wialon_zone_name || null,
        is_departure: Number(r.is_departure),
        is_finish: Number(r.is_finish),
        estimated_arrival: r.estimated_arrival || null
      })),
      route_history: historyRows.map((row) => ({
        id_sales_cost_route_history: Number(row.id_sales_cost_route_history),
        id_sales_cost: Number(row.id_sales_cost),
        id_area: Number(row.id_area),
        id_area_route_step:
          row.id_area_route_step === null || row.id_area_route_step === undefined
            ? null
            : Number(row.id_area_route_step),
        id_sc_stop:
          row.id_sc_stop === null || row.id_sc_stop === undefined
            ? null
            : Number(row.id_sc_stop),
        step_key:
          row.step_key ||
          (row.id_area_route_step === null || row.id_area_route_step === undefined
            ? "system:finish_order"
            : `route:${Number(row.id_area_route_step)}`),
        system_step_code: row.system_step_code || null,
        is_manual: Number(row.is_manual) === 1,
        id_truck: Number(row.id_truck),
        step_order: Number(row.step_order_snapshot),
        step_name: row.step_name_snapshot || "",
        wialon_resource_id: Number(row.wialon_resource_id),
        wialon_zone_id: Number(row.wialon_zone_id),
        wialon_zone_name: row.wialon_zone_name || "",
        gps_time: row.gps_time,
        recorded_at: row.recorded_at,
        lat: row.lat === null || row.lat === undefined ? null : Number(row.lat),
        lon: row.lon === null || row.lon === undefined ? null : Number(row.lon)
      }))
    });
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
    const departureDatetime = body.departure_datetime || null;
    const arrivalDatetime = body.arrival_datetime || null;
    const finishOrderDatetime = body.finish_order_datetime || null;
    const noDn = body.no_dn || "";
    const containerDepot = body.container_depot || "";
    const noPo = body.no_po || "";
    const noAju = body.no_aju || "";
    const noContainer = body.no_container || "";
    const tax = Number(body.tax) || 0;
    const trip = body.trip || "";
    const jenisTrip = body.jenis_trip || "";
    const rawContainerSize =
      typeof body.container_size === "string"
        ? body.container_size.trim()
        : body.container_size;
    let containerSize = rawContainerSize ? rawContainerSize : null;
    const idPrint = body.id_print || "";
    const idAdmin = req.user.id_admin;

    if (!finishOrderDatetime) {
      return res.status(400).json({ message: "Finish Order wajib diisi." });
    }
    if (!isValidIsoDateTime(finishOrderDatetime)) {
      return res.status(400).json({ message: "Format Finish Order harus YYYY-MM-DD HH:MM." });
    }

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

    // Validate date ordering
    if (departureDatetime && arrivalDatetime) {
      if (new Date(arrivalDatetime) < new Date(departureDatetime)) {
        return res.status(400).json({
          message: "Tanggal tiba tidak boleh lebih awal dari tanggal berangkat."
        });
      }
    }
    if (arrivalDatetime && finishOrderDatetime) {
      if (new Date(finishOrderDatetime) < new Date(arrivalDatetime)) {
        return res.status(400).json({
          message: "Tanggal selesai order tidak boleh lebih awal dari tanggal tiba."
        });
      }
    }

    const truckStatus = await getTruckStatus(idTruck);
    if (!truckStatus) {
      return res.status(400).json({ message: "Truck tidak ditemukan." });
    }
    if (Number(truckStatus.is_active) !== 1) {
      return res.status(400).json({ message: "Truck nonaktif tidak bisa dipilih untuk transaksi baru." });
    }

    const driverStatus = await getDriverStatus(idDriver);
    if (!driverStatus) {
      return res.status(400).json({ message: "Driver tidak ditemukan." });
    }
    if (Number(driverStatus.is_active) !== 1) {
      return res.status(400).json({ message: "Driver nonaktif tidak bisa dipilih untuk transaksi baru." });
    }

    const jenisKendaraan = truckStatus.jenis_kendaraan;
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
      "INSERT INTO sales_cost (tgl_order, id_truck, id_driver, id_area, id_customer, id_admin, departure_datetime, arrival_datetime, finish_order_datetime, bills, lift_on, lift_of, container_depot, no_po, no_aju, no_container, tax, admin_charge, materai, trip, jenis_trip, container_size, price, container_repair, demurrage_chargers, detention_chargers, extend_gate_pass, additional_cost, ops_cost, total, margin, id_print) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        tglOrder,
        idTruck,
        idDriver,
        idArea,
        idCustomer,
        idAdmin,
        departureDatetime,
        arrivalDatetime,
        finishOrderDatetime,
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

    // Save delivery stops
    const deliveryStops = Array.isArray(body.delivery_stops) ? body.delivery_stops : [];
    for (const stop of deliveryStops) {
      if (stop.stop_order === undefined || stop.stop_order === null) continue;
      const estimatedArrival = stop.estimated_arrival || null;
      if (estimatedArrival && !isValidIsoDateTime(String(estimatedArrival))) continue;
      await db.query(
        `INSERT INTO sales_cost_step_schedule
          (id_sales_cost, stop_order, stop_name, wialon_resource_id, wialon_zone_id, wialon_zone_name, is_departure, is_finish, estimated_arrival)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          result.insertId,
          Number(stop.stop_order),
          String(stop.stop_name || ''),
          stop.wialon_resource_id ? Number(stop.wialon_resource_id) : null,
          stop.wialon_zone_id ? Number(stop.wialon_zone_id) : null,
          stop.wialon_zone_name || null,
          stop.is_departure ? 1 : 0,
          stop.is_finish ? 1 : 0,
          estimatedArrival || null
        ]
      );
    }

    const [rows] = await db.query(
      "SELECT sales_cost.id_sales_cost, sales_cost.tgl_order, sales_cost.departure_datetime, sales_cost.arrival_datetime, sales_cost.finish_order_datetime, sales_cost.price, sales_cost.ops_cost, sales_cost.margin, sales_cost.id_print, customer.nama_customer FROM sales_cost INNER JOIN customer ON sales_cost.id_customer = customer.id_customer WHERE sales_cost.id_sales_cost = ?",
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

router.post("/:id/check-in", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const idSalesCost = Number(req.params.id);
    const body = req.body || {};
    const idScStop = Number.parseInt(String(body.id_sc_stop || ""), 10);
    const arrivedAt = body.arrived_at;

    if (!Number.isInteger(idScStop) || idScStop <= 0) {
      return res.status(400).json({ message: "Stop pengiriman tidak valid." });
    }
    if (!arrivedAt) {
      return res.status(400).json({ message: "Waktu tiba wajib diisi." });
    }
    if (!isValidIsoDateTime(arrivedAt)) {
      return res.status(400).json({ message: "Format waktu tiba harus YYYY-MM-DD HH:MM." });
    }

    const [stopRows] = await db.query(
      `SELECT
         sc.id_area,
         sc.id_truck,
         stop.id,
         stop.stop_order,
         stop.stop_name,
         stop.wialon_resource_id,
         stop.wialon_zone_id,
         stop.wialon_zone_name,
         stop.is_departure,
         stop.is_finish
       FROM sales_cost_step_schedule stop
       INNER JOIN sales_cost sc ON sc.id_sales_cost = stop.id_sales_cost
       WHERE stop.id = ? AND stop.id_sales_cost = ?
       LIMIT 1`,
      [idScStop, idSalesCost]
    );

    if (stopRows.length === 0) {
      return res.status(404).json({ message: "Stop pengiriman tidak ditemukan." });
    }

    const stop = stopRows[0];

    if (Number(stop.is_departure) === 1) {
      return res.status(400).json({ message: "Stop keberangkatan tidak bisa ditandai tiba manual." });
    }

    const [existingHistoryRows] = await db.query(
      "SELECT 1 FROM sales_cost_route_history WHERE id_sc_stop = ? LIMIT 1",
      [idScStop]
    );

    if (existingHistoryRows.length > 0) {
      return res.status(400).json({ message: "Stop ini sudah ditandai tiba sebelumnya." });
    }

    const arrivedAtDate = new Date(String(arrivedAt).replace("T", " "));
    if (arrivedAtDate.getTime() > Date.now()) {
      return res.status(400).json({ message: "Waktu tiba tidak boleh lebih dari waktu sekarang." });
    }

    const [previousStopRows] = await db.query(
      `SELECT id, stop_order
       FROM sales_cost_step_schedule
       WHERE id_sales_cost = ? AND stop_order < ?
       ORDER BY stop_order DESC
       LIMIT 1`,
      [idSalesCost, Number(stop.stop_order)]
    );

    if (previousStopRows.length > 0) {
      const previousStop = previousStopRows[0];
      const [previousHistoryRows] = await db.query(
        `SELECT gps_time
         FROM sales_cost_route_history
         WHERE id_sc_stop = ? AND gps_time IS NOT NULL
         ORDER BY gps_time DESC, id_sales_cost_route_history DESC
         LIMIT 1`,
        [previousStop.id]
      );

      if (previousHistoryRows.length > 0 && previousHistoryRows[0].gps_time) {
        const previousGpsTime = new Date(previousHistoryRows[0].gps_time);
        if (arrivedAtDate.getTime() < previousGpsTime.getTime()) {
          return res.status(400).json({ message: "Waktu tiba tidak boleh kurang dari stop sebelumnya." });
        }
      }
    }

    await db.query(
      `INSERT INTO sales_cost_route_history
        (
          id_sales_cost,
          id_area,
          id_sc_stop,
          step_key,
          system_step_code,
          id_truck,
          step_order_snapshot,
          step_name_snapshot,
          wialon_resource_id,
          wialon_zone_id,
          wialon_zone_name,
          gps_time,
          is_manual,
          lat,
          lon
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idSalesCost,
        Number(stop.id_area),
        Number(stop.id),
        `stop:${Number(stop.id)}`,
        null,
        Number(stop.id_truck),
        Number(stop.stop_order),
        stop.stop_name || "",
        stop.wialon_resource_id ? Number(stop.wialon_resource_id) : null,
        stop.wialon_zone_id ? Number(stop.wialon_zone_id) : null,
        stop.wialon_zone_name || null,
        arrivedAt,
        1,
        null,
        null
      ]
    );

    // Jika stop ini adalah finish stop (is_finish=1), tulis system:finish_order
    // sebagai sumber kebenaran tunggal untuk "pengiriman selesai" — konsisten dengan geofence tracking
    if (Number(stop.is_finish) === 1) {
      const [finishHistoryRows] = await db.query(
        "SELECT 1 FROM sales_cost_route_history WHERE id_sales_cost = ? AND step_key = 'system:finish_order' LIMIT 1",
        [idSalesCost]
      );

      if (finishHistoryRows.length === 0) {
        // Tulis system:finish_order ke route_history (is_manual=1)
        await db.query(
          `INSERT INTO sales_cost_route_history
            (id_sales_cost, id_area, id_sc_stop, step_key, system_step_code,
             id_truck, step_order_snapshot, step_name_snapshot,
             wialon_resource_id, wialon_zone_id, wialon_zone_name,
             gps_time, is_manual, lat, lon)
           VALUES (?, ?, NULL, 'system:finish_order', 'finish_order',
                   ?, ?, 'Finish Order',
                   NULL, NULL, NULL,
                   ?, 1, NULL, NULL)`,
          [idSalesCost, Number(stop.id_area), Number(stop.id_truck),
           Number(stop.stop_order) + 1, arrivedAt]
        );

        // Update finish_order_datetime di sales_cost (idempotent — hanya jika belum ter-set)
        await db.query(
          `UPDATE sales_cost
             SET finish_order_datetime = ?
           WHERE id_sales_cost = ?
             AND (finish_order_datetime IS NULL
                  OR CAST(finish_order_datetime AS CHAR) = '0000-00-00 00:00:00')`,
          [arrivedAt, idSalesCost]
        );
      }
    }

    res.json({ message: "Check-in manual berhasil disimpan." });
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
        "SELECT departure_datetime FROM sales_cost WHERE id_sales_cost = ?",
        [id]
      );
      if (lockRows.length === 0) {
        return res.status(404).json({ message: "Sales cost not found" });
      }
      const departureDatetime = lockRows[0].departure_datetime;
      if (departureDatetime) {
        const deliveryDate = new Date(departureDatetime);
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
    const departureDatetime = body.departure_datetime || null;
    const arrivalDatetime = body.arrival_datetime || null;
    const finishOrderDatetime = body.finish_order_datetime || null;
    const noDn = body.no_dn || "";
    const containerDepot = body.container_depot || "";
    const noPo = body.no_po || "";
    const noAju = body.no_aju || "";
    const noContainer = body.no_container || "";
    const tax = Number(body.tax) || 0;
    const trip = body.trip || "";
    const jenisTrip = body.jenis_trip || "";
    const rawContainerSize =
      typeof body.container_size === "string"
        ? body.container_size.trim()
        : body.container_size;
    let containerSize = rawContainerSize ? rawContainerSize : null;

    if (finishOrderDatetime && !isValidIsoDateTime(finishOrderDatetime)) {
      return res.status(400).json({ message: "Format Finish Order harus YYYY-MM-DD HH:MM." });
    }
    
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

    // Validate date ordering
    if (departureDatetime && arrivalDatetime) {
      if (new Date(arrivalDatetime) < new Date(departureDatetime)) {
        return res.status(400).json({
          message: "Tanggal tiba tidak boleh lebih awal dari tanggal berangkat."
        });
      }
    }
    if (arrivalDatetime && finishOrderDatetime) {
      if (new Date(finishOrderDatetime) < new Date(arrivalDatetime)) {
        return res.status(400).json({
          message: "Tanggal selesai order tidak boleh lebih awal dari tanggal tiba."
        });
      }
    }

    const [currentRows] = await db.query(
      "SELECT id_truck, id_driver FROM sales_cost WHERE id_sales_cost = ?",
      [id]
    );
    if (currentRows.length === 0) {
      return res.status(404).json({ message: "Sales cost not found" });
    }

    const truckStatus = await getTruckStatus(idTruck);
    if (!truckStatus) {
      return res.status(400).json({ message: "Truck tidak ditemukan." });
    }
    const isKeepingCurrentTruck = String(currentRows[0].id_truck || "") === String(idTruck || "");
    if (Number(truckStatus.is_active) !== 1 && !isKeepingCurrentTruck) {
      return res.status(400).json({ message: "Truck nonaktif tidak bisa dipilih untuk transaksi." });
    }

    const driverStatus = await getDriverStatus(idDriver);
    if (!driverStatus) {
      return res.status(400).json({ message: "Driver tidak ditemukan." });
    }
    const isKeepingCurrentDriver = String(currentRows[0].id_driver || "") === String(idDriver || "");
    if (Number(driverStatus.is_active) !== 1 && !isKeepingCurrentDriver) {
      return res.status(400).json({ message: "Driver nonaktif tidak bisa dipilih untuk transaksi." });
    }

    const jenisKendaraan = truckStatus.jenis_kendaraan;
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
      "UPDATE sales_cost SET id_truck = ?, id_driver = ?, id_area = ?, id_customer = ?, departure_datetime = ?, arrival_datetime = ?, finish_order_datetime = ?, bills = ?, lift_on = ?, lift_of = ?, container_depot = ?, no_po = ?, no_aju = ?, no_container = ?, tax = ?, admin_charge = ?, materai = ?, trip = ?, jenis_trip = ?, container_size = ?, price = ?, container_repair = ?, demurrage_chargers = ?, detention_chargers = ?, extend_gate_pass = ?, additional_cost = ?, ops_cost = ?, total = ?, margin = ? WHERE id_sales_cost = ?",
      [
        idTruck,
        idDriver,
        idArea,
        idCustomer,
        departureDatetime,
        arrivalDatetime,
        finishOrderDatetime,
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

    // Smart upsert delivery stops — preserve existing IDs to avoid orphaning sales_cost_route_history
    const deliveryStopsPut = Array.isArray(body.delivery_stops) ? body.delivery_stops : [];

    // Step 1: Fetch existing stop IDs from DB
    const [existingStopRows] = await db.query(
      'SELECT id FROM sales_cost_step_schedule WHERE id_sales_cost = ?',
      [id]
    );
    const existingIds = new Set(existingStopRows.map(s => Number(s.id)));
    const incomingIds = new Set(
      deliveryStopsPut.filter(s => s.id).map(s => Number(s.id))
    );

    // Step 2: DELETE stops removed from payload, but only if they have no route_history
    const toDelete = [...existingIds].filter(eid => !incomingIds.has(eid));
    if (toDelete.length > 0) {
      // Guard: skip deleting stops that already have route_history records
      const placeholders = toDelete.map(() => '?').join(',');
      const [historyCheck] = await db.query(
        `SELECT DISTINCT id_sc_stop FROM sales_cost_route_history WHERE id_sc_stop IN (${placeholders})`,
        toDelete
      );
      const idsWithHistory = new Set(historyCheck.map(r => Number(r.id_sc_stop)));
      const safeToDelete = toDelete.filter(eid => !idsWithHistory.has(eid));
      if (safeToDelete.length > 0) {
        await db.query(
          `DELETE FROM sales_cost_step_schedule WHERE id IN (${safeToDelete.map(() => '?').join(',')})`,
          safeToDelete
        );
      }
    }

    // Step 3: UPDATE or INSERT each stop from payload
    for (const stop of deliveryStopsPut) {
      if (stop.stop_order === undefined || stop.stop_order === null) continue;
      const estimatedArrival = stop.estimated_arrival || null;
      if (estimatedArrival && !isValidIsoDateTime(String(estimatedArrival))) continue;

      const stopValues = [
        Number(stop.stop_order),
        String(stop.stop_name || ''),
        stop.wialon_resource_id ? Number(stop.wialon_resource_id) : null,
        stop.wialon_zone_id ? Number(stop.wialon_zone_id) : null,
        stop.wialon_zone_name || null,
        stop.is_departure ? 1 : 0,
        stop.is_finish ? 1 : 0,
        estimatedArrival || null
      ];

      if (stop.id && existingIds.has(Number(stop.id))) {
        // UPDATE existing stop — preserves ID so route_history references remain valid
        await db.query(
          `UPDATE sales_cost_step_schedule
             SET stop_order=?, stop_name=?, wialon_resource_id=?,
                 wialon_zone_id=?, wialon_zone_name=?, is_departure=?,
                 is_finish=?, estimated_arrival=?
           WHERE id = ? AND id_sales_cost = ?`,
          [...stopValues, Number(stop.id), Number(id)]
        );
      } else {
        // INSERT new stop
        await db.query(
          `INSERT INTO sales_cost_step_schedule
             (id_sales_cost, stop_order, stop_name, wialon_resource_id,
              wialon_zone_id, wialon_zone_name, is_departure, is_finish, estimated_arrival)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [Number(id), ...stopValues]
        );
      }
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
      "SELECT sales_cost.id_sales_cost, sales_cost.tgl_order, sales_cost.departure_datetime, sales_cost.arrival_datetime, sales_cost.finish_order_datetime, sales_cost.price, sales_cost.ops_cost, sales_cost.margin, sales_cost.id_print, customer.nama_customer FROM sales_cost INNER JOIN customer ON sales_cost.id_customer = customer.id_customer WHERE sales_cost.id_sales_cost = ?",
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

    // Lock check — same rule as PUT: records from past months cannot be deleted
    const [lockRows] = await db.query(
      "SELECT departure_datetime FROM sales_cost WHERE id_sales_cost = ?",
      [id]
    );
    if (lockRows.length === 0) {
      return res.status(404).json({ message: "Sales cost not found" });
    }
    const depDatetime = lockRows[0].departure_datetime;
    if (depDatetime) {
      const deliveryDate = new Date(depDatetime);
      if (!Number.isNaN(deliveryDate.getTime())) {
        const now = new Date();
        const locked =
          now.getFullYear() > deliveryDate.getFullYear() ||
          (now.getFullYear() === deliveryDate.getFullYear() &&
           now.getMonth() > deliveryDate.getMonth());
        if (locked) {
          return res.status(403).json({ message: "Data terkunci. Tidak bisa dihapus." });
        }
      }
    }

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
