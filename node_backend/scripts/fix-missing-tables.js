#!/usr/bin/env node
/**
 * fix-missing-tables.js
 * Jalankan SQL untuk tabel/kolom yang missing setelah import production dump.
 * Script ini idempotent — aman dijalankan berkali-kali.
 */

const mysql = require("mysql2/promise");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const connect = async () => mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || "trucking",
  multipleStatements: false,
});

const run = async (conn, label, sql) => {
  try {
    await conn.query(sql);
    console.log("[OK]", label);
  } catch (e) {
    if (e.code === "ER_TABLE_EXISTS_ERROR" || e.code === "ER_DUP_FIELDNAME" ||
        e.code === "ER_DUP_KEYNAME" || e.message.includes("Duplicate column") ||
        e.message.includes("Duplicate key")) {
      console.log("[SKIP]", label, "(sudah ada)");
    } else {
      console.error("[ERR]", label, "=>", e.message);
    }
  }
};

const mark = async (conn, version) => {
  await conn.query("INSERT IGNORE INTO schema_migrations (version) VALUES (?)", [version]);
  console.log("[MARK]", version, "sebagai applied");
};

const main = async () => {
  const conn = await connect();
  try {
    console.log("\nMembuat tabel dan kolom yang missing...\n");

    // Nonaktifkan strict mode sementara agar ALTER TABLE tidak diblokir
    // oleh ENUM validation issues di kolom lain pada tabel yang sama
    await conn.query("SET SESSION sql_mode = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
    console.log("[OK] sql_mode set (no strict)\n");

    // ── 20260717000000: rename delivery_order → departure_datetime ─────────
    await run(conn, "RENAME delivery_order -> departure_datetime",
      `ALTER TABLE sales_cost CHANGE COLUMN delivery_order departure_datetime DATETIME NOT NULL`
    );
    await run(conn, "RENAME arrival_order -> arrival_datetime",
      `ALTER TABLE sales_cost CHANGE COLUMN arrival_order arrival_datetime DATETIME NULL`
    );
    await run(conn, "RENAME finish_order -> finish_order_datetime",
      `ALTER TABLE sales_cost CHANGE COLUMN finish_order finish_order_datetime DATETIME NULL`
    );
    await mark(conn, "20260717000000");

    // ── 20260717000001: create delivery_notifications ──────────────────────
    await run(conn, "CREATE delivery_notifications",
      `CREATE TABLE IF NOT EXISTS delivery_notifications (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        id_sales_cost     INT NOT NULL,
        notification_type ENUM('arrival_overdue') NOT NULL DEFAULT 'arrival_overdue',
        truck_plate       VARCHAR(20) NOT NULL,
        route_name        VARCHAR(255) NOT NULL,
        scheduled_arrival DATETIME NOT NULL,
        message           TEXT NOT NULL,
        is_read           TINYINT(1) NOT NULL DEFAULT 0,
        is_dismissed      TINYINT(1) NOT NULL DEFAULT 0,
        created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        read_at           DATETIME NULL,
        INDEX idx_dn_unread (is_read, is_dismissed),
        INDEX idx_dn_sales_cost (id_sales_cost)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
    await mark(conn, "20260717000001");

    // ── 20260717000002: create sales_cost_step_schedule ───────────────────
    await run(conn, "CREATE sales_cost_step_schedule",
      `CREATE TABLE IF NOT EXISTS sales_cost_step_schedule (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        id_sales_cost INT NOT NULL,
        stop_order    INT NOT NULL DEFAULT 0,
        stop_name     VARCHAR(255) NOT NULL DEFAULT '',
        wialon_resource_id BIGINT NULL,
        wialon_zone_id     BIGINT NULL,
        wialon_zone_name   VARCHAR(255) NULL,
        is_departure  TINYINT(1) NOT NULL DEFAULT 0,
        is_finish     TINYINT(1) NOT NULL DEFAULT 0,
        estimated_arrival DATETIME NULL,
        created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_sc_stop_order (id_sales_cost, stop_order),
        INDEX idx_scss_sales_cost (id_sales_cost),
        INDEX idx_scss_departure (id_sales_cost, is_departure),
        INDEX idx_scss_finish (id_sales_cost, is_finish),
        FOREIGN KEY (id_sales_cost) REFERENCES sales_cost(id_sales_cost) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
    await mark(conn, "20260717000002");

    // ── 20260717000003: add step_ref columns to delivery_notifications ─────
    await run(conn, "ADD delivery_notifications.id_area_route_step",
      `ALTER TABLE delivery_notifications ADD COLUMN id_area_route_step INT NULL AFTER id_sales_cost`
    );
    await run(conn, "ADD delivery_notifications.step_name",
      `ALTER TABLE delivery_notifications ADD COLUMN step_name VARCHAR(100) NULL AFTER id_area_route_step`
    );
    await mark(conn, "20260717000003");

    // ── 20260717000004: restructure sales_cost_step_schedule ─────────────
    // Drop old columns if they exist, add new columns if they don't
    await run(conn, "DROP old col id_area_route_step",
      `ALTER TABLE sales_cost_step_schedule DROP COLUMN id_area_route_step`
    );
    await run(conn, "DROP old col step_order_snapshot",
      `ALTER TABLE sales_cost_step_schedule DROP COLUMN step_order_snapshot`
    );
    await run(conn, "DROP old col step_name_snapshot",
      `ALTER TABLE sales_cost_step_schedule DROP COLUMN step_name_snapshot`
    );
    await run(conn, "ADD stop_order",
      `ALTER TABLE sales_cost_step_schedule ADD COLUMN stop_order INT NOT NULL DEFAULT 0 AFTER id_sales_cost`
    );
    await run(conn, "ADD stop_name",
      `ALTER TABLE sales_cost_step_schedule ADD COLUMN stop_name VARCHAR(255) NOT NULL DEFAULT '' AFTER stop_order`
    );
    await run(conn, "ADD wialon_resource_id",
      `ALTER TABLE sales_cost_step_schedule ADD COLUMN wialon_resource_id BIGINT NULL AFTER stop_name`
    );
    await run(conn, "ADD wialon_zone_id",
      `ALTER TABLE sales_cost_step_schedule ADD COLUMN wialon_zone_id BIGINT NULL AFTER wialon_resource_id`
    );
    await run(conn, "ADD wialon_zone_name",
      `ALTER TABLE sales_cost_step_schedule ADD COLUMN wialon_zone_name VARCHAR(255) NULL AFTER wialon_zone_id`
    );
    await run(conn, "ADD is_departure",
      `ALTER TABLE sales_cost_step_schedule ADD COLUMN is_departure TINYINT(1) NOT NULL DEFAULT 0 AFTER wialon_zone_name`
    );
    await run(conn, "ADD is_finish",
      `ALTER TABLE sales_cost_step_schedule ADD COLUMN is_finish TINYINT(1) NOT NULL DEFAULT 0 AFTER is_departure`
    );
    await run(conn, "ADD UNIQUE uniq_sc_stop_order",
      `ALTER TABLE sales_cost_step_schedule ADD UNIQUE KEY uniq_sc_stop_order (id_sales_cost, stop_order)`
    );
    await run(conn, "ADD INDEX idx_scss_departure",
      `ALTER TABLE sales_cost_step_schedule ADD INDEX idx_scss_departure (id_sales_cost, is_departure)`
    );
    await run(conn, "ADD INDEX idx_scss_finish",
      `ALTER TABLE sales_cost_step_schedule ADD INDEX idx_scss_finish (id_sales_cost, is_finish)`
    );
    // id_area_route_step may still exist from old structure — make it nullable
    // so INSERT without this column doesn't fail
    await run(conn, "MODIFY id_area_route_step nullable",
      `ALTER TABLE sales_cost_step_schedule MODIFY COLUMN id_area_route_step INT NULL DEFAULT NULL`
    );
    await mark(conn, "20260717000004");

    // ── 20260717000005: add id_sc_stop to route_history ───────────────────
    await run(conn, "ADD sales_cost_route_history.id_sc_stop",
      `ALTER TABLE sales_cost_route_history ADD COLUMN id_sc_stop INT NULL`
    );
    await mark(conn, "20260717000005");

    // ── 20260717000006: add id_sc_stop to delivery_notifications ──────────
    await run(conn, "ADD delivery_notifications.id_sc_stop",
      `ALTER TABLE delivery_notifications ADD COLUMN id_sc_stop INT NULL`
    );
    await mark(conn, "20260717000006");

    // ── 20260717000007: add is_manual to route_history ────────────────────
    await run(conn, "ADD sales_cost_route_history.is_manual",
      `ALTER TABLE sales_cost_route_history ADD COLUMN is_manual TINYINT(1) NOT NULL DEFAULT 0`
    );
    await mark(conn, "20260717000007");

    // ── 20260717000008: add GPS cache columns to truck ────────────────────
    await run(conn, "ADD truck.last_lat",
      `ALTER TABLE truck ADD COLUMN last_lat DECIMAL(10,7) NULL`
    );
    await run(conn, "ADD truck.last_lng",
      `ALTER TABLE truck ADD COLUMN last_lng DECIMAL(10,7) NULL`
    );
    await run(conn, "ADD truck.last_address",
      `ALTER TABLE truck ADD COLUMN last_address TEXT NULL`
    );
    await run(conn, "ADD truck.last_gps_time",
      `ALTER TABLE truck ADD COLUMN last_gps_time DATETIME NULL`
    );
    await mark(conn, "20260717000008");

    // ── 20260720000009: nullable wialon fields in route_history ───────────
    await run(conn, "MODIFY sales_cost_route_history.wialon_resource_id nullable",
      `ALTER TABLE sales_cost_route_history MODIFY COLUMN wialon_resource_id BIGINT NULL DEFAULT NULL`
    );
    await run(conn, "MODIFY sales_cost_route_history.wialon_zone_id nullable",
      `ALTER TABLE sales_cost_route_history MODIFY COLUMN wialon_zone_id BIGINT NULL DEFAULT NULL`
    );
    await run(conn, "MODIFY sales_cost_route_history.wialon_zone_name nullable",
      `ALTER TABLE sales_cost_route_history MODIFY COLUMN wialon_zone_name VARCHAR(255) NULL DEFAULT NULL`
    );
    await mark(conn, "20260720000009");

    // ── 20260720000010: create delivery_notification_read ─────────────────
    await run(conn, "CREATE delivery_notification_read",
      `CREATE TABLE IF NOT EXISTS delivery_notification_read (
        id                          INT AUTO_INCREMENT PRIMARY KEY,
        id_delivery_notification    INT NOT NULL,
        id_admin                    INT NOT NULL,
        read_at                     DATETIME NULL DEFAULT NULL,
        dismissed_at                DATETIME NULL DEFAULT NULL,
        UNIQUE KEY uq_dn_read_admin (id_delivery_notification, id_admin),
        INDEX idx_dn_read_admin     (id_admin),
        INDEX idx_dn_read_notif     (id_delivery_notification)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
    await mark(conn, "20260720000010");

    // ── 20260720000011: extend admin.password to VARCHAR(255) ─────────────
    await run(conn, "MODIFY admin.password to VARCHAR(255)",
      `ALTER TABLE admin MODIFY COLUMN password VARCHAR(255) NOT NULL`
    );
    await mark(conn, "20260720000011");

    // ── 20260723000012: sales_cost.is_manual_mode for ETA auto-hits ───────
    await run(conn, "ADD sales_cost.is_manual_mode",
      `ALTER TABLE sales_cost ADD COLUMN is_manual_mode TINYINT(1) NOT NULL DEFAULT 0 AFTER finish_order_datetime`
    );
    await mark(conn, "20260723000012");

    // ── 20260725000013: sub_contractor multi-stop schedule (manual, no GPS) ─
    await run(conn, "CREATE sub_contractor_step_schedule",
      `CREATE TABLE IF NOT EXISTS sub_contractor_step_schedule (
        id INT NOT NULL AUTO_INCREMENT,
        id_subcontractor INT NOT NULL,
        stop_order INT NOT NULL DEFAULT 0,
        stop_name VARCHAR(100) NOT NULL DEFAULT '',
        is_departure TINYINT(1) NOT NULL DEFAULT 0,
        is_finish TINYINT(1) NOT NULL DEFAULT 0,
        estimated_arrival DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_subc_stop_order (id_subcontractor, stop_order),
        KEY idx_subc_scss_sc (id_subcontractor),
        CONSTRAINT fk_subc_scss_subcontractor
          FOREIGN KEY (id_subcontractor) REFERENCES sub_contractor (id_subcontractor)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
    await mark(conn, "20260725000013");

    // ── 20260728000014: create delivery_template ──────────────────────────
    await run(conn, "CREATE delivery_template",
      `CREATE TABLE IF NOT EXISTS delivery_template (
        id            INT          NOT NULL AUTO_INCREMENT,
        template_name VARCHAR(255) NOT NULL,
        description   VARCHAR(500) NULL,
        is_active     TINYINT(1)   NOT NULL DEFAULT 1,
        created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
    await run(conn, "CREATE delivery_template_stop",
      `CREATE TABLE IF NOT EXISTS delivery_template_stop (
        id                    INT          NOT NULL AUTO_INCREMENT,
        id_delivery_template  INT          NOT NULL,
        stop_order            INT          NOT NULL,
        stop_name             VARCHAR(255) NOT NULL,
        wialon_resource_id    BIGINT       NULL,
        wialon_zone_id        BIGINT       NULL,
        wialon_zone_name      VARCHAR(255) NULL,
        is_departure          TINYINT(1)   NOT NULL DEFAULT 0,
        is_finish             TINYINT(1)   NOT NULL DEFAULT 0,
        time_hhmm             VARCHAR(5)   NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_template_stop (id_delivery_template, stop_order),
        CONSTRAINT fk_dts_template FOREIGN KEY (id_delivery_template)
          REFERENCES delivery_template (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
    await mark(conn, "20260728000014");

    console.log("\nSelesai. Verifikasi dengan: npm run migrate:status");

  } finally {
    await conn.end();
  }
};

main().catch(e => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
