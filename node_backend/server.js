require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const db = require("./db");
const dashboardRouter = require("./routes/dashboard");
const truckRouter = require("./routes/truck");
const driverRouter = require("./routes/driver");
const customerRouter = require("./routes/customer");
const areaRouter = require("./routes/area");
const warehouseRouter = require("./routes/warehouse");
const subcontRouter = require("./routes/subcont");
const adminRouter = require("./routes/admin");
const salesCostRouter = require("./routes/salesCost");
const repairRouter = require("./routes/repair");
const subcontractorRouter = require("./routes/subcontractor");
const masterImportRouter = require("./routes/masterImport");
const authRouter = require("./routes/auth");
const notificationsRouter = require("./routes/notifications");
const dataTruckRouter = require("./routes/dataTruck");
const dataChasisRouter = require("./routes/dataChasis");
const dataSupirRouter = require("./routes/dataSupir");
const schedulePengirimanRouter = require("./routes/schedulePengiriman");
const wialonRouter = require("./routes/wialon");
const { restrictCsAccess } = require("./middleware/rbac");
const addressBookRouter = require("./routes/addressBook");
const monitoringKendaraanRouter = require("./routes/monitoringKendaraan");

const app = express();

app.use(
  cors({
    origin: true, // terima semua origin (dev only)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors());
app.use(express.json());
app.use("/api", restrictCsAccess);
app.use("/img", express.static(path.join(__dirname, "img")));
app.use(
  "/doc-data-truck",
  express.static(path.join(__dirname, "upload", "doc-data-truck"))
);
app.use(
  "/doc-data-chasis",
  express.static(path.join(__dirname, "upload", "doc-data-chasis"))
);
app.use(
  "/doc-supir",
  express.static(path.join(__dirname, "upload", "doc-supir"))
);

app.use("/api/dashboard", dashboardRouter);
app.use("/api/trucks", truckRouter);
app.use("/api/drivers", driverRouter);
app.use("/api/customers", customerRouter);
app.use("/api/areas", areaRouter);
app.use("/api/warehouses", warehouseRouter);
app.use("/api/subconts", subcontRouter);
app.use("/api/admins", adminRouter);
app.use("/api/sales-costs", salesCostRouter);
app.use("/api/repairs", repairRouter);
app.use("/api/subcontractor", subcontractorRouter);
app.use("/api/master", masterImportRouter);
app.use("/api/auth", authRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/data-trucks", dataTruckRouter);
app.use("/api/data-chasis", dataChasisRouter);
app.use("/api/data-supir", dataSupirRouter);
app.use("/api/schedule-pengiriman", schedulePengirimanRouter);
app.use("/api/wialon", wialonRouter);
app.use("/api/address-book", addressBookRouter);
app.use("/api/monitoring-kendaraan", monitoringKendaraanRouter);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const ensureTruckWialonColumn = async () => {
  const databaseName = process.env.DB_NAME || "trucking";
  const [rows] = await db.query(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.columns
      WHERE table_schema = ?
        AND table_name = 'truck'
        AND column_name = 'wialon_unit_id'
    `,
    [databaseName]
  );

  const total = Number(rows?.[0]?.total || 0);
  if (total > 0) {
    return;
  }

  await db.query(
    "ALTER TABLE truck ADD COLUMN wialon_unit_id varchar(64) NULL DEFAULT NULL AFTER type_truck"
  );
  console.log("Added missing truck.wialon_unit_id column");
};

const startServer = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (mongoUri) {
      await mongoose.connect(mongoUri);
      console.log("MongoDB connected");
    } else {
      console.error("MONGO_URI belum dikonfigurasi");
    }

    try {
      await ensureTruckWialonColumn();
    } catch (schemaError) {
      console.error("Failed to ensure truck.wialon_unit_id column", schemaError);
    }

    app.listen(PORT, HOST, () => {
      console.log(`Node backend listening on ${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend server", error);
    process.exitCode = 1;
  }
};

void startServer();
