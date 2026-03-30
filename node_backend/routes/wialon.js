const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const {
  getTruckLocations,
  reverseGeocodeCoordinates,
  autoMapTruckWialonUnits
} = require("../services/wialonService");

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

module.exports = router;
