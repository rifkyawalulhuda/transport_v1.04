const express = require("express");
const xlsx = require("xlsx");
const { authenticateToken } = require("../middleware/auth");
const {
  getTruckLocations,
  getTruckMonthlyDistance,
  getTruckMonthlyDistanceExportRows,
  reverseGeocodeCoordinates,
  autoMapTruckWialonUnits,
  fetchWialonGeofences
} = require("../services/wialonService");
const { runBackfill } = require("../services/geofenceTrackingService");

const router = express.Router();

router.use(authenticateToken);

router.get("/trucks/location", async (_req, res) => {
  try {
    const payload = await getTruckLocations();
    res.json(payload);
  } catch (error) {
    console.error("Wialon truck location error:", error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
});

router.get("/trucks/monthly-distance", async (req, res) => {
  try {
    const payload = await getTruckMonthlyDistance({
      month: req.query?.month,
      search: req.query?.search,
      page: req.query?.page,
      limit: req.query?.limit
    });
    res.json(payload);
  } catch (error) {
    console.error("Wialon monthly distance error:", error);
    const message = error?.message || "Gagal mengambil KM bulanan truk";
    const isValidationError = /month/i.test(message);
    res.status(isValidationError ? 400 : 500).json({
      message
    });
  }
});

const formatMileageDateTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const resolveMileageStatusLabel = (status) => {
  switch (status) {
    case "has_trip":
      return "Ada Trip";
    case "no_trip":
      return "Tidak Ada Trip";
    case "unlinked":
      return "Belum Terhubung";
    case "missing_unit":
      return "Mapping GPS Tidak Valid";
    case "error":
      return "Error";
    default:
      return String(status || "-");
  }
};

router.get("/trucks/monthly-distance/export", async (req, res) => {
  try {
    const payload = await getTruckMonthlyDistanceExportRows({
      month: req.query?.month,
      search: req.query?.search
    });

    if (!payload.rows.length) {
      return res.status(404).json({
        message: "Tidak ada data untuk diexport."
      });
    }

    const workbook = xlsx.utils.book_new();
    const summaryRows = [
      { Keterangan: "Periode", Nilai: payload.period.month_key },
      { Keterangan: "Pencarian", Nilai: req.query?.search ? String(req.query.search) : "Semua truk" },
      { Keterangan: "Jumlah Truk", Nilai: payload.rows.length },
      {
        Keterangan: "Total KM",
        Nilai: Number(
          (payload.rows.reduce((sum, row) => sum + Number(row.total_distance_km || 0), 0)).toFixed(2)
        )
      },
      {
        Keterangan: "Total Trip",
        Nilai: payload.rows.reduce((sum, row) => sum + Number(row.trips_count || 0), 0)
      }
    ];
    const exportRows = payload.rows.map((row) => ({
      "No Truck": row.no_police || `Truck ${row.id_truck}`,
      Kendaraan: row.vehicle_name || "",
      "Jenis Kendaraan": row.jenis_kendaraan || "",
      Merk: row.merk_mobil || "",
      Model: row.model || "",
      "Type Truck": row.type_truck || "",
      "Wialon Unit ID": row.wialon_unit_id || "",
      "Total KM": Number(row.total_distance_km || 0),
      "Total Meter": Number(row.total_distance_m || 0),
      "Jumlah Trip": Number(row.trips_count || 0),
      "Trip Pertama": formatMileageDateTime(row.first_trip_at),
      "Trip Terakhir": formatMileageDateTime(row.last_trip_at),
      Status: resolveMileageStatusLabel(row.status),
      Catatan: row.error || ""
    }));

    const summarySheet = xlsx.utils.json_to_sheet(summaryRows);
    summarySheet["!cols"] = [{ wch: 20 }, { wch: 24 }];
    const dataSheet = xlsx.utils.json_to_sheet(exportRows);
    dataSheet["!cols"] = [
      { wch: 16 },
      { wch: 26 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 20 },
      { wch: 20 },
      { wch: 24 },
      { wch: 32 }
    ];

    xlsx.utils.book_append_sheet(workbook, summarySheet, "Ringkasan");
    xlsx.utils.book_append_sheet(workbook, dataSheet, "KM Bulanan Truk");

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
    const filename = `KM_Bulanan_Truk_${payload.period.month_key}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(buffer);
  } catch (error) {
    console.error("Wialon monthly distance export error:", error);
    res.status(500).json({
      message: error?.message || "Gagal export data KM bulanan truk"
    });
  }
});

router.get("/reverse-geocode", async (req, res) => {
  try {
    const lat = Number(req.query?.lat);
    const lon = Number(req.query?.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({
        message: "Parameter lat dan lon wajib berupa angka yang valid."
      });
    }

    const payload = await reverseGeocodeCoordinates({ lat, lon });
    res.json(payload);
  } catch (error) {
    console.error("Wialon reverse geocode error:", error);
    res.status(500).json({
      message: "Gagal mengambil alamat lokasi"
    });
  }
});

router.post("/trucks/auto-map", async (req, res) => {
  try {
    const overwrite = req.body?.overwrite === true;
    const payload = await autoMapTruckWialonUnits({ overwrite });
    res.json({
      message: overwrite
        ? "Auto mapping Wialon selesai."
        : "Auto mapping Wialon selesai untuk truck yang belum punya mapping.",
      ...payload
    });
  } catch (error) {
    console.error("Wialon auto-map error:", error);
    res.status(500).json({
      message: "Gagal menjalankan auto mapping Wialon"
    });
  }
});

router.get("/geofences", async (_req, res) => {
  try {
    const geofences = await fetchWialonGeofences();
    res.json({
      rows: geofences,
      total: geofences.length
    });
  } catch (error) {
    console.error("Wialon geofence error:", error);
    res.status(500).json({
      message: "Gagal mengambil daftar geofence Wialon"
    });
  }
});


router.post("/backfill", async (req, res) => {
  try {
    const { from, to } = req.body || {};

    const nowTs = Math.floor(Date.now() / 1000);
    const maxBackfillTs = nowTs - 7 * 24 * 60 * 60; // 7 days ago

    let fromTs;
    let toTs;

    if (from) {
      const fromDate = new Date(from);
      if (Number.isNaN(fromDate.getTime())) {
        return res.status(400).json({ message: "Format 'from' tidak valid. Gunakan ISO 8601, contoh: 2026-07-10T00:00:00" });
      }
      fromTs = Math.floor(fromDate.getTime() / 1000);
      if (fromTs < maxBackfillTs) {
        return res.status(400).json({ message: "Backfill maksimal 7 hari ke belakang." });
      }
    } else {
      fromTs = maxBackfillTs;
    }

    if (to) {
      const toDate = new Date(to);
      if (Number.isNaN(toDate.getTime())) {
        return res.status(400).json({ message: "Format 'to' tidak valid. Gunakan ISO 8601, contoh: 2026-07-17T23:59:59" });
      }
      toTs = Math.floor(toDate.getTime() / 1000);
    } else {
      toTs = nowTs;
    }

    if (fromTs >= toTs) {
      return res.status(400).json({ message: "'from' harus lebih awal dari 'to'." });
    }

    const summary = await runBackfill(fromTs, toTs);
    res.json({
      message: "Backfill selesai.",
      from: new Date(fromTs * 1000).toISOString(),
      to: new Date(toTs * 1000).toISOString(),
      ...summary
    });
  } catch (error) {
    console.error("Wialon backfill error:", error);
    res.status(500).json({ message: "Gagal menjalankan backfill geofence." });
  }
});
module.exports = router;
