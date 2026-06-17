const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");
const DataTruck = require("../models/DataTruck");
const DataChasis = require("../models/DataChasis");
const DataSupir = require("../models/DataSupir");

const router = express.Router();

const parseMonthYear = (req) => {
  const now = new Date();
  const month = Number.parseInt(req.query.month, 10);
  const year = Number.parseInt(req.query.year, 10);
  return {
    month: Number.isNaN(month) ? now.getMonth() + 1 : month,
    year: Number.isNaN(year) ? now.getFullYear() : year
  };
};

const getMonthRange = (month, year) => {
  const start = new Date(year, month - 1, 1, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0);
  return { start, end };
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
};

const parseNonNegativeInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 0 ? fallback : parsed;
};

const parseDateOnly = (value) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      const day = Number(match[3]);
      return new Date(year, month, day);
    }
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const formatDateOnly = (date) => {
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

router.get("/truck-monthly-avg", authenticateToken, async (req, res) => {
  try {
    const { month, year } = parseMonthYear(req);
    const { start, end } = getMonthRange(month, year);
    const [rows] = await db.query(
      `SELECT sc.id_truck, t.no_police, COUNT(*) AS transaction_count
       FROM sales_cost sc
       JOIN truck t ON t.id_truck = sc.id_truck
       WHERE sc.delivery_order >= ? AND sc.delivery_order < ?
       GROUP BY sc.id_truck, t.no_police
       ORDER BY transaction_count DESC`,
      [start, end]
    );
    const data = rows.map((row) => {
      const transactionCount = Number(row.transaction_count) || 0;
      const percent =
        transactionCount > 0
          ? Math.round((transactionCount / 21) * 100)
          : 0;
      return {
        id_truck: Number(row.id_truck),
        no_police: row.no_police,
        transaction_count: transactionCount,
        percent
      };
    });
    const avgPercent =
      data.length > 0
        ? Math.round(
            data.reduce((sum, item) => sum + (Number(item.percent) || 0), 0) /
              data.length
          )
        : 0;
    res.json({ items: data, avg_percent: avgPercent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/metrics/sales-cost", authenticateToken, async (req, res) => {
  try {
    const { month, year } = parseMonthYear(req);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const [currentRows, prevRows] = await Promise.all([
      db.query(
        "SELECT COUNT(*) AS count FROM sales_cost WHERE MONTH(delivery_order) = ? AND YEAR(delivery_order) = ?",
        [month, year]
      ),
      db.query(
        "SELECT COUNT(*) AS count FROM sales_cost WHERE MONTH(delivery_order) = ? AND YEAR(delivery_order) = ?",
        [prevMonth, prevYear]
      )
    ]);
    const currentCount = Number(currentRows[0]?.[0]?.count || 0);
    const prevCount = Number(prevRows[0]?.[0]?.count || 0);
    let percent = null;
    if (prevCount === 0) {
      percent = currentCount === 0 ? 0 : null;
    } else {
      percent = Math.round(((currentCount - prevCount) / prevCount) * 10000) / 100;
    }
    res.json({ count: currentCount, prevCount, percent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/metrics/subcontractor", authenticateToken, async (req, res) => {
  try {
    const { month, year } = parseMonthYear(req);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const [currentRows, prevRows] = await Promise.all([
      db.query(
        "SELECT COUNT(*) AS count FROM sub_contractor WHERE MONTH(delivery_date) = ? AND YEAR(delivery_date) = ?",
        [month, year]
      ),
      db.query(
        "SELECT COUNT(*) AS count FROM sub_contractor WHERE MONTH(delivery_date) = ? AND YEAR(delivery_date) = ?",
        [prevMonth, prevYear]
      )
    ]);
    const currentCount = Number(currentRows[0]?.[0]?.count || 0);
    const prevCount = Number(prevRows[0]?.[0]?.count || 0);
    let percent = null;
    if (prevCount === 0) {
      percent = currentCount === 0 ? 0 : null;
    } else {
      percent = Math.round(((currentCount - prevCount) / prevCount) * 10000) / 100;
    }
    res.json({ count: currentCount, prevCount, percent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/metrics/sales-cost/summary", authenticateToken, async (req, res) => {
  try {
    const { month, year } = parseMonthYear(req);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const [currentRows, prevRows] = await Promise.all([
      db.query(
        "SELECT COALESCE(SUM(CAST(price AS SIGNED)), 0) AS sales, COALESCE(SUM(CAST(total AS SIGNED)), 0) AS total_cost, COALESCE(SUM(CAST(margin AS SIGNED)), 0) AS gross_profit FROM sales_cost WHERE MONTH(delivery_order) = ? AND YEAR(delivery_order) = ?",
        [month, year]
      ),
      db.query(
        "SELECT COALESCE(SUM(CAST(price AS SIGNED)), 0) AS sales, COALESCE(SUM(CAST(margin AS SIGNED)), 0) AS gross_profit FROM sales_cost WHERE MONTH(delivery_order) = ? AND YEAR(delivery_order) = ?",
        [prevMonth, prevYear]
      )
    ]);
    const current = currentRows[0]?.[0] || {};
    const sales = Number(current.sales || 0);
    const totalCost = Number(current.total_cost || 0);
    const grossProfit = Number(current.gross_profit || 0);
    const prevSales = Number(prevRows[0]?.[0]?.sales || 0);
    const prevGrossProfit = Number(prevRows[0]?.[0]?.gross_profit || 0);
    res.json({
      sales,
      totalCost,
      grossProfit,
      prevSales,
      prevGrossProfit
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/charts/monthly-transactions", authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const year = Number.parseInt(req.query.year, 10);
    const selectedYear = Number.isNaN(year) ? now.getFullYear() : year;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const [salesRows, subRows] = await Promise.all([
      db.query(
        "SELECT MONTH(delivery_order) AS m, COUNT(*) AS c FROM sales_cost WHERE YEAR(delivery_order) = ? GROUP BY m",
        [selectedYear]
      ),
      db.query(
        "SELECT MONTH(delivery_date) AS m, COUNT(*) AS c FROM sub_contractor WHERE YEAR(delivery_date) = ? GROUP BY m",
        [selectedYear]
      )
    ]);
    const salesCost = Array(12).fill(0);
    const subcontractor = Array(12).fill(0);
    salesRows[0].forEach((row) => {
      const idx = Number(row.m) - 1;
      if (idx >= 0 && idx < 12) {
        salesCost[idx] = Number(row.c) || 0;
      }
    });
    subRows[0].forEach((row) => {
      const idx = Number(row.m) - 1;
      if (idx >= 0 && idx < 12) {
        subcontractor[idx] = Number(row.c) || 0;
      }
    });
    res.json({ months, salesCost, subcontractor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/charts/sales-cost-statistics", authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const range = String(req.query.range || "monthly").toLowerCase();
    const yearParam = Number.parseInt(req.query.year, 10);
    const selectedYear = Number.isNaN(yearParam) ? now.getFullYear() : yearParam;
    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const costExpression =
      "COALESCE(total, COALESCE(ops_cost,0) + COALESCE(additional_cost,0) + COALESCE(container_repair,0) + COALESCE(demurrage_chargers,0) + COALESCE(detention_chargers,0) + COALESCE(extend_gate_pass,0) + COALESCE(tax,0) + COALESCE(admin_charge,0) + COALESCE(materai,0))";
    let categories = [];
    let sales = [];
    let totalCost = [];
    let grossProfit = [];

    if (range === "quarterly") {
      categories = ["Q1", "Q2", "Q3", "Q4"];
      sales = Array(4).fill(0);
      totalCost = Array(4).fill(0);
      grossProfit = Array(4).fill(0);
      const [rows] = await db.query(
        `SELECT QUARTER(delivery_order) AS period, COALESCE(SUM(CAST(price AS SIGNED)), 0) AS sales, COALESCE(SUM(${costExpression}), 0) AS total_cost, COALESCE(SUM(CAST(margin AS SIGNED)), 0) AS gross_profit FROM sales_cost WHERE YEAR(delivery_order) = ? GROUP BY period`,
        [selectedYear]
      );
      rows.forEach((row) => {
        const idx = Number(row.period) - 1;
        if (idx >= 0 && idx < 4) {
          sales[idx] = Number(row.sales) || 0;
          totalCost[idx] = Number(row.total_cost) || 0;
          grossProfit[idx] = Number(row.gross_profit) || 0;
        }
      });
    } else if (range === "annually") {
      const endYear = now.getFullYear();
      const startYear = endYear - 4;
      categories = Array.from({ length: 5 }, (_, index) => String(startYear + index));
      sales = Array(5).fill(0);
      totalCost = Array(5).fill(0);
      grossProfit = Array(5).fill(0);
      const [rows] = await db.query(
        `SELECT YEAR(delivery_order) AS period, COALESCE(SUM(CAST(price AS SIGNED)), 0) AS sales, COALESCE(SUM(${costExpression}), 0) AS total_cost, COALESCE(SUM(CAST(margin AS SIGNED)), 0) AS gross_profit FROM sales_cost WHERE YEAR(delivery_order) BETWEEN ? AND ? GROUP BY period ORDER BY period`,
        [startYear, endYear]
      );
      rows.forEach((row) => {
        const idx = Number(row.period) - startYear;
        if (idx >= 0 && idx < 5) {
          sales[idx] = Number(row.sales) || 0;
          totalCost[idx] = Number(row.total_cost) || 0;
          grossProfit[idx] = Number(row.gross_profit) || 0;
        }
      });
    } else {
      categories = monthLabels;
      sales = Array(12).fill(0);
      totalCost = Array(12).fill(0);
      grossProfit = Array(12).fill(0);
      const [rows] = await db.query(
        `SELECT MONTH(delivery_order) AS period, COALESCE(SUM(CAST(price AS SIGNED)), 0) AS sales, COALESCE(SUM(${costExpression}), 0) AS total_cost, COALESCE(SUM(CAST(margin AS SIGNED)), 0) AS gross_profit FROM sales_cost WHERE YEAR(delivery_order) = ? GROUP BY period`,
        [selectedYear]
      );
      rows.forEach((row) => {
        const idx = Number(row.period) - 1;
        if (idx >= 0 && idx < 12) {
          sales[idx] = Number(row.sales) || 0;
          totalCost[idx] = Number(row.total_cost) || 0;
          grossProfit[idx] = Number(row.gross_profit) || 0;
        }
      });
    }

    res.json({
      categories,
      series: {
        sales,
        totalCost,
        grossProfit
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/monthly-target", authenticateToken, async (req, res) => {
  try {
    const { month, year } = parseMonthYear(req);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const [currentRows, prevRows] = await Promise.all([
      db.query(
        "SELECT COALESCE(SUM(CAST(price AS SIGNED)), 0) AS sales, COALESCE(SUM(CAST(total AS SIGNED)), 0) AS total, COALESCE(SUM(CAST(margin AS SIGNED)), 0) AS gross_profit FROM sales_cost WHERE MONTH(delivery_order) = ? AND YEAR(delivery_order) = ?",
        [month, year]
      ),
      db.query(
        "SELECT COALESCE(SUM(CAST(margin AS SIGNED)), 0) AS gross_profit FROM sales_cost WHERE MONTH(delivery_order) = ? AND YEAR(delivery_order) = ?",
        [prevMonth, prevYear]
      )
    ]);
    const current = currentRows[0]?.[0] || {};
    const sales = Number(current.sales || 0);
    const total = Number(current.total || 0);
    const grossProfit = Number(current.gross_profit || 0);
    const prevGrossProfit = Number(prevRows[0]?.[0]?.gross_profit || 0);
    let percent = null;
    if (prevGrossProfit === 0) {
      percent = grossProfit === 0 ? 0 : null;
    } else {
      percent = Math.round(((grossProfit - prevGrossProfit) / prevGrossProfit) * 10000) / 100;
    }
    res.json({
      sales,
      total,
      grossProfit,
      prevGrossProfit,
      percent
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/expiry-alerts", authenticateToken, async (req, res) => {
  try {
    const days = parsePositiveInt(req.query.days, 30);
    const limit = parseNonNegativeInt(req.query.limit, 10);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msPerDay = 24 * 60 * 60 * 1000;

    const [truckRows, driverRows, truckDocs, chasisDocs, driverDocs] = await Promise.all([
      db.query("SELECT id_truck, no_police, merk_mobil, model, type_truck FROM truck"),
      db.query("SELECT id_driver, no_polisi, nama_driver, no_ktp FROM driver"),
      DataTruck.find({}).lean(),
      DataChasis.find({}).lean(),
      DataSupir.find({}).lean()
    ]);

    const truckMasterRows = truckRows[0] || [];
    const driverMasterRows = driverRows[0] || [];

    const truckByPlate = new Map();
    truckMasterRows.forEach((row) => {
      if (row?.no_police) {
        truckByPlate.set(row.no_police, row);
      }
    });

    const driverById = new Map();
    const driverByPlate = new Map();
    driverMasterRows.forEach((row) => {
      if (row?.id_driver !== undefined && row?.id_driver !== null) {
        driverById.set(String(row.id_driver), row);
      }
      if (row?.no_polisi) {
        driverByPlate.set(row.no_polisi, row);
      }
    });

    const items = [];

    const buildSubtitle = (parts) => parts.filter(Boolean).join(" / ");

    const pushItem = (payload) => {
      const dueDate = parseDateOnly(payload?.dueValue);
      if (!dueDate) {
        return;
      }
      const daysLeft = Math.round((dueDate.getTime() - today.getTime()) / msPerDay);
      let status = null;
      if (daysLeft <= 0) {
        status = "red";
      } else if (daysLeft <= days) {
        status = "yellow";
      }
      if (!status) {
        return;
      }
      items.push({
        entityType: payload.entityType,
        entityId: payload.entityId,
        title: payload.title,
        subtitle: payload.subtitle || "",
        fieldKey: payload.fieldKey,
        fieldLabel: payload.fieldLabel,
        dueDate: formatDateOnly(dueDate),
        status,
        daysLeft,
        routeName: payload.routeName,
        routeParams: payload.routeParams || {},
        routePath: payload.routePath
      });
    };

    const truckFields = [
      { key: "masa_berlaku_stnk", label: "Masa Berlaku STNK" },
      { key: "masa_berlaku_pajak_stnk", label: "Masa Berlaku Pajak STNK" },
      { key: "masa_berlaku_keur_head_truck", label: "Masa Berlaku KIR" },
      { key: "masa_berlaku_uji_emisi", label: "Masa Berlaku Uji Emisi" },
      { key: "iuran_aptrindo", label: "Iuran Aptrindo" }
    ];

    (truckDocs || []).forEach((doc) => {
      if (!doc?.truck_no) {
        return;
      }
      const master = truckByPlate.get(doc.truck_no) || {};
      const title = master.no_police || doc.truck_no;
      const subtitle = buildSubtitle([master.merk_mobil, master.model, master.type_truck]);
      truckFields.forEach((field) => {
        pushItem({
          entityType: "truck",
          entityId: doc.truck_no,
          title,
          subtitle,
          fieldKey: field.key,
          fieldLabel: field.label,
          dueValue: doc[field.key],
          routeName: "Detail Data Truck",
          routeParams: { id: doc.truck_no },
          routePath: `/data-transport/data-truck/detail/${encodeURIComponent(String(doc.truck_no))}`
        });
      });
    });

    (chasisDocs || []).forEach((doc) => {
      if (!doc?.chasis_no || !doc?._id) {
        return;
      }
      const chasisId = String(doc._id);
      const title = doc.chasis_no;
      const subtitle = buildSubtitle([doc.maker_merk, doc.type]);
      pushItem({
        entityType: "chasis",
        entityId: chasisId,
        title,
        subtitle,
        fieldKey: "masa_berlaku_keur_chassis",
        fieldLabel: "Masa Berlaku Keur Chassis",
        dueValue: doc.masa_berlaku_keur_chassis,
        routeName: "Detail Data Chasis",
        routeParams: { id: chasisId },
        routePath: `/data-transport/data-chasis/detail/${chasisId}`
      });
    });

    (driverDocs || []).forEach((doc) => {
      const master =
        (doc?.id_driver !== undefined && doc?.id_driver !== null
          ? driverById.get(String(doc.id_driver))
          : null) ||
        (doc?.no_polisi ? driverByPlate.get(doc.no_polisi) : null) ||
        {};
      const driverId = master?.id_driver ?? doc?.id_driver;
      if (!driverId) {
        return;
      }
      const title = master?.nama_driver || doc?.no_polisi || `Driver ${driverId}`;
      const nikValue = doc?.nik || master?.no_ktp || "";
      const subtitle = nikValue
        ? `NIK: ${nikValue}`
        : master?.no_polisi || doc?.no_polisi
          ? `No. Police: ${master?.no_polisi || doc?.no_polisi}`
          : "";
      const lisensiList = Array.isArray(doc?.lisensi) ? doc.lisensi : [];
      lisensiList.forEach((lisensi, index) => {
        if (!lisensi) {
          return;
        }
        const fieldLabel = lisensi.jenis_lisensi
          ? `Masa Berlaku ${lisensi.jenis_lisensi}`
          : "Masa Berlaku Lisensi";
        const fieldKey = lisensi._id ? `lisensi_${lisensi._id}` : `lisensi_${index}`;
        pushItem({
          entityType: "driver",
          entityId: driverId,
          title,
          subtitle,
          fieldKey,
          fieldLabel,
          dueValue: lisensi.masa_berlaku,
          routeName: "Detail Data Supir",
          routeParams: { id: driverId },
          routePath: `/data-transport/data-supir/detail/${driverId}`
        });
      });
    });

    const statusOrder = { red: 0, yellow: 1 };
    items.sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) {
        return statusDiff;
      }
      if (a.daysLeft !== b.daysLeft) {
        return a.daysLeft - b.daysLeft;
      }
      return String(a.dueDate).localeCompare(String(b.dueDate));
    });

    const upcoming = items.slice(0, 5).map((item) => ({
      entityType: item.entityType,
      entityId: item.entityId,
      title: item.title,
      subtitle: item.subtitle || "",
      fieldLabel: item.fieldLabel,
      dueDate: item.dueDate,
      status: item.status,
      daysLeft: item.daysLeft,
      routeName: item.routeName,
      routeParams: item.routeParams || {},
      routePath: item.routePath
    }));

    const counts = items.reduce(
      (acc, item) => {
        if (item.status === "red") {
          acc.red += 1;
        } else if (item.status === "yellow") {
          acc.yellow += 1;
        }
        acc.total += 1;
        return acc;
      },
      { red: 0, yellow: 0, total: 0 }
    );

    const breakdown = {
      truck: { red: 0, yellow: 0, total: 0 },
      chasis: { red: 0, yellow: 0, total: 0 },
      driver: { red: 0, yellow: 0, total: 0 }
    };

    items.forEach((item) => {
      const bucket = breakdown[item.entityType];
      if (!bucket) {
        return;
      }
      if (item.status === "red") {
        bucket.red += 1;
      } else if (item.status === "yellow") {
        bucket.yellow += 1;
      }
      bucket.total += 1;
    });

    const redRatio = counts.total ? counts.red / counts.total : 0;
    const redPercent = Math.round(redRatio * 100);
    let level = "LOW";
    if (redRatio >= 0.6) {
      level = "HIGH";
    } else if (redRatio >= 0.3) {
      level = "MEDIUM";
    }

    res.json({
      meta: {
        days,
        limit,
        generated_at: new Date().toISOString()
      },
      counts,
      breakdown,
      upcoming,
      risk: {
        level,
        redRatio,
        redPercent
      },
      items: limit === 0 ? items : items.slice(0, limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const [
      [adminRows],
      [truckRows],
      [driverRows],
      [customerRows],
      [areaRows],
      [warehouseRows],
      [subcontRows],
      [salesCostRows],
      [subContractorRows],
      [repairRows]
    ] = await Promise.all([
      db.query("SELECT COUNT(*) AS total FROM admin"),
      db.query("SELECT COUNT(*) AS total FROM truck"),
      db.query("SELECT COUNT(*) AS total FROM driver"),
      db.query("SELECT COUNT(*) AS total FROM customer"),
      db.query("SELECT COUNT(*) AS total FROM area"),
      db.query("SELECT COUNT(*) AS total FROM warehouse"),
      db.query("SELECT COUNT(*) AS total FROM subcont"),
      db.query("SELECT COUNT(*) AS total FROM sales_cost"),
      db.query("SELECT COUNT(*) AS total FROM sub_contractor"),
      db.query("SELECT COUNT(*) AS total FROM repair")
    ]);

    const counters = {
      admin: adminRows[0].total,
      truck: truckRows[0].total,
      driver: driverRows[0].total,
      customer: customerRows[0].total,
      area: areaRows[0].total,
      warehouse: warehouseRows[0].total,
      subcont: subcontRows[0].total,
      sales_cost: salesCostRows[0].total,
      sub_contractor: subContractorRows[0].total,
      repair: repairRows[0].total
    };

    const [topTruckRows] = await db.query(
      "SELECT YEAR(sales_cost.delivery_order) AS tahun, truck.no_police AS no_police, COUNT(*) AS total_order FROM sales_cost INNER JOIN truck ON sales_cost.id_truck = truck.id_truck GROUP BY tahun, sales_cost.id_truck, truck.no_police ORDER BY tahun, total_order DESC"
    );

    const transactionDataByYear = {};
    topTruckRows.forEach(row => {
      const year = String(row.tahun);
      if (!transactionDataByYear[year]) {
        transactionDataByYear[year] = { labels: [], counts: [] };
      }
      if (transactionDataByYear[year].labels.length < 5) {
        transactionDataByYear[year].labels.push(row.no_police);
        transactionDataByYear[year].counts.push(Number(row.total_order));
      }
    });

    const [salesMonthlyRows] = await db.query(
      "SELECT YEAR(delivery_order) AS tahun, DATE_FORMAT(delivery_order, '%b') AS label, MONTH(delivery_order) AS bulan, SUM(price) AS sales_bulan, SUM(CAST(margin AS SIGNED)) AS gross_bulan, SUM(ops_cost) AS ops_bulan, COUNT(*) AS trx_bulan FROM sales_cost GROUP BY tahun, bulan, DATE_FORMAT(delivery_order, '%b') ORDER BY tahun, bulan"
    );

    const chartData = {};
    salesMonthlyRows.forEach(row => {
      const year = String(row.tahun);
      if (!chartData[year]) {
        chartData[year] = {
          labels: [],
          sales: [],
          gross: [],
          ops: [],
          count: []
        };
      }
      chartData[year].labels.push(row.label);
      chartData[year].sales.push(Number(row.sales_bulan));
      chartData[year].gross.push(Number(row.gross_bulan));
      chartData[year].ops.push(Number(row.ops_bulan));
      chartData[year].count.push(Number(row.trx_bulan));
    });

    const [subcontMonthlyRows] = await db.query(
      "SELECT YEAR(delivery_date) AS tahun, DATE_FORMAT(delivery_date, '%b') AS label, MONTH(delivery_date) AS bulan, SUM(sales) AS sales_bulan, SUM(gross_profit) AS gross_bulan, SUM(cost) AS cost_bulan, COUNT(*) AS trx_bulan FROM sub_contractor GROUP BY tahun, bulan, DATE_FORMAT(delivery_date, '%b') ORDER BY tahun, bulan"
    );

    const chartDataSubcont = {};
    subcontMonthlyRows.forEach(row => {
      const year = String(row.tahun);
      if (!chartDataSubcont[year]) {
        chartDataSubcont[year] = {
          labels: [],
          sales: [],
          gross: [],
          cost: [],
          count: []
        };
      }
      chartDataSubcont[year].labels.push(row.label);
      chartDataSubcont[year].sales.push(Number(row.sales_bulan));
      chartDataSubcont[year].gross.push(Number(row.gross_bulan));
      chartDataSubcont[year].cost.push(Number(row.cost_bulan));
      chartDataSubcont[year].count.push(Number(row.trx_bulan));
    });

    const [topSubcontRows] = await db.query(
      "SELECT YEAR(sub_contractor.delivery_date) AS tahun, subcont.nama_subcont AS nama_subcont, COUNT(*) AS total_trx FROM sub_contractor INNER JOIN subcont ON sub_contractor.id_subcont = subcont.id_subcont GROUP BY tahun, sub_contractor.id_subcont, subcont.nama_subcont ORDER BY tahun, total_trx DESC"
    );

    const subcontDataByYear = {};
    topSubcontRows.forEach(row => {
      const year = String(row.tahun);
      if (!subcontDataByYear[year]) {
        subcontDataByYear[year] = { labels: [], counts: [] };
      }
      if (subcontDataByYear[year].labels.length < 5) {
        subcontDataByYear[year].labels.push(row.nama_subcont);
        subcontDataByYear[year].counts.push(Number(row.total_trx));
      }
    });

    res.json({
      counters,
      chartData,
      chartDataSubcont,
      transactionDataByYear,
      subcontDataByYear
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
