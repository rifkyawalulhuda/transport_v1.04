const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

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
        "SELECT COALESCE(SUM(CAST(margin AS SIGNED)), 0) AS gross_profit FROM sales_cost WHERE MONTH(delivery_order) = ? AND YEAR(delivery_order) = ?",
        [prevMonth, prevYear]
      )
    ]);
    const current = currentRows[0]?.[0] || {};
    const sales = Number(current.sales || 0);
    const totalCost = Number(current.total_cost || 0);
    const grossProfit = Number(current.gross_profit || 0);
    const prevGrossProfit = Number(prevRows[0]?.[0]?.gross_profit || 0);
    res.json({
      sales,
      totalCost,
      grossProfit,
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
      "SELECT YEAR(delivery_order) AS tahun, DATE_FORMAT(delivery_order, '%b') AS label, MONTH(delivery_order) AS bulan, SUM(price) AS sales_bulan, SUM(CAST(margin AS SIGNED)) AS gross_bulan, SUM(ops_cost) AS ops_bulan, COUNT(*) AS trx_bulan FROM sales_cost GROUP BY tahun, bulan ORDER BY tahun, bulan"
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
      "SELECT YEAR(delivery_date) AS tahun, DATE_FORMAT(delivery_date, '%b') AS label, MONTH(delivery_date) AS bulan, SUM(sales) AS sales_bulan, SUM(gross_profit) AS gross_bulan, SUM(cost) AS cost_bulan, COUNT(*) AS trx_bulan FROM sub_contractor GROUP BY tahun, bulan ORDER BY tahun, bulan"
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
