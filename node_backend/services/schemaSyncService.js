const db = require("../db");

const getDatabaseName = () => process.env.DB_NAME || "trucking";

const hasColumn = async (tableName, columnName) => {
  const [rows] = await db.query(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.columns
      WHERE table_schema = ?
        AND table_name = ?
        AND column_name = ?
    `,
    [getDatabaseName(), tableName, columnName]
  );

  return Number(rows?.[0]?.total || 0) > 0;
};

const hasIndex = async (tableName, indexName) => {
  const [rows] = await db.query(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.statistics
      WHERE table_schema = ?
        AND table_name = ?
        AND index_name = ?
    `,
    [getDatabaseName(), tableName, indexName]
  );

  return Number(rows?.[0]?.total || 0) > 0;
};

const ensureTruckWialonColumn = async () => {
  const exists = await hasColumn("truck", "wialon_unit_id");
  if (exists) {
    return;
  }

  await db.query(
    "ALTER TABLE truck ADD COLUMN wialon_unit_id varchar(64) NULL DEFAULT NULL AFTER type_truck"
  );
  console.log("Added missing truck.wialon_unit_id column");
};

const ensureAreaRouteSchema = async () => {
  const hasKodeArea = await hasColumn("area", "kode_area");
  if (!hasKodeArea) {
    await db.query(
      "ALTER TABLE area ADD COLUMN kode_area varchar(50) NULL DEFAULT NULL AFTER id_area"
    );
    console.log("Added missing area.kode_area column");
  }

  const hasFinishGeofenceResourceId = await hasColumn(
    "area",
    "finish_geofence_resource_id"
  );
  if (!hasFinishGeofenceResourceId) {
    await db.query(
      "ALTER TABLE area ADD COLUMN finish_geofence_resource_id bigint(20) NULL DEFAULT NULL AFTER nama_area"
    );
    console.log("Added missing area.finish_geofence_resource_id column");
  }

  const hasFinishGeofenceZoneId = await hasColumn("area", "finish_geofence_zone_id");
  if (!hasFinishGeofenceZoneId) {
    await db.query(
      "ALTER TABLE area ADD COLUMN finish_geofence_zone_id bigint(20) NULL DEFAULT NULL AFTER finish_geofence_resource_id"
    );
    console.log("Added missing area.finish_geofence_zone_id column");
  }

  const hasFinishGeofenceZoneName = await hasColumn(
    "area",
    "finish_geofence_zone_name"
  );
  if (!hasFinishGeofenceZoneName) {
    await db.query(
      "ALTER TABLE area ADD COLUMN finish_geofence_zone_name varchar(255) NULL DEFAULT NULL AFTER finish_geofence_zone_id"
    );
    console.log("Added missing area.finish_geofence_zone_name column");
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS area_route_step (
      id_area_route_step int(13) NOT NULL AUTO_INCREMENT,
      id_area int(13) NOT NULL,
      step_order int(11) NOT NULL,
      step_name varchar(100) NOT NULL,
      wialon_resource_id bigint(20) NOT NULL,
      wialon_zone_id bigint(20) NOT NULL,
      wialon_zone_name varchar(255) NOT NULL,
      PRIMARY KEY (id_area_route_step),
      UNIQUE KEY uniq_area_route_step_order (id_area, step_order),
      UNIQUE KEY uniq_area_route_step_zone (id_area, wialon_resource_id, wialon_zone_id),
      KEY idx_area_route_step_area (id_area),
      CONSTRAINT fk_area_route_step_area
        FOREIGN KEY (id_area) REFERENCES area (id_area)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS sales_cost_route_history (
      id_sales_cost_route_history int(13) NOT NULL AUTO_INCREMENT,
      id_sales_cost int(30) NOT NULL,
      id_area int(13) NOT NULL,
      id_area_route_step int(13) DEFAULT NULL,
      step_key varchar(100) NOT NULL,
      system_step_code varchar(50) DEFAULT NULL,
      id_truck int(30) NOT NULL,
      step_order_snapshot int(11) NOT NULL,
      step_name_snapshot varchar(100) NOT NULL,
      wialon_resource_id bigint(20) NOT NULL,
      wialon_zone_id bigint(20) NOT NULL,
      wialon_zone_name varchar(255) NOT NULL,
      gps_time datetime NOT NULL,
      recorded_at datetime NOT NULL DEFAULT current_timestamp(),
      lat decimal(10,6) DEFAULT NULL,
      lon decimal(10,6) DEFAULT NULL,
      PRIMARY KEY (id_sales_cost_route_history),
      UNIQUE KEY uniq_sales_cost_route_step (id_sales_cost, id_area_route_step),
      UNIQUE KEY uniq_sales_cost_step_key (id_sales_cost, step_key),
      KEY idx_sales_cost_route_history_sales_cost (id_sales_cost),
      KEY idx_sales_cost_route_history_area (id_area),
      KEY idx_sales_cost_route_history_truck (id_truck),
      KEY idx_sales_cost_route_history_step (id_area_route_step),
      CONSTRAINT fk_sales_cost_route_history_sales_cost
        FOREIGN KEY (id_sales_cost) REFERENCES sales_cost (id_sales_cost)
        ON DELETE CASCADE,
      CONSTRAINT fk_sales_cost_route_history_area
        FOREIGN KEY (id_area) REFERENCES area (id_area)
        ON DELETE CASCADE,
      CONSTRAINT fk_sales_cost_route_history_step
        FOREIGN KEY (id_area_route_step) REFERENCES area_route_step (id_area_route_step)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci
  `);

  const hasStepKey = await hasColumn("sales_cost_route_history", "step_key");
  if (!hasStepKey) {
    await db.query(
      "ALTER TABLE sales_cost_route_history ADD COLUMN step_key varchar(100) NOT NULL DEFAULT '' AFTER id_area_route_step"
    );
  }

  const hasSystemStepCode = await hasColumn("sales_cost_route_history", "system_step_code");
  if (!hasSystemStepCode) {
    await db.query(
      "ALTER TABLE sales_cost_route_history ADD COLUMN system_step_code varchar(50) NULL DEFAULT NULL AFTER step_key"
    );
  }

  await db.query(
    "ALTER TABLE sales_cost_route_history MODIFY COLUMN id_area_route_step int(13) NULL DEFAULT NULL"
  );

  await db.query(
    "UPDATE sales_cost_route_history SET step_key = CONCAT('route:', id_area_route_step) WHERE (step_key = '' OR step_key IS NULL) AND id_area_route_step IS NOT NULL"
  );

  const hasStepKeyIndex = await hasIndex(
    "sales_cost_route_history",
    "uniq_sales_cost_step_key"
  );
  if (!hasStepKeyIndex) {
    await db.query(
      "ALTER TABLE sales_cost_route_history ADD UNIQUE KEY uniq_sales_cost_step_key (id_sales_cost, step_key)"
    );
  }
};

const ensureTrackingSchema = async () => {
  await ensureTruckWialonColumn();
  await ensureAreaRouteSchema();
};

module.exports = {
  ensureTrackingSchema
};
