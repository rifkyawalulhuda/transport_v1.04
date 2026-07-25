/**
 * Production Migration Script — Juli 2026
 * =========================================
 * Idempotent: aman dijalankan berulang kali.
 * Setiap step dicek dulu sebelum dijalankan.
 *
 * Usage:
 *   cd node_backend
 *   node migrate-production.js
 *
 * Atau dengan dry-run (cek tanpa apply):
 *   node migrate-production.js --dry-run
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const DRY_RUN = process.argv.includes('--dry-run');

if (DRY_RUN) {
  console.log('=== DRY RUN MODE — tidak ada perubahan yang diterapkan ===\n');
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const log = (msg) => console.log(`  ${msg}`);
const ok  = (msg) => console.log(`  ✓ ${msg}`);
const skip = (msg) => console.log(`  – ${msg} (sudah ada, dilewati)`);
const warn = (msg) => console.log(`  ! ${msg}`);

async function columnExists(c, table, column) {
  const [rows] = await c.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
}

async function tableExists(c, table) {
  const [rows] = await c.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return rows.length > 0;
}

async function indexExists(c, table, indexName) {
  const [rows] = await c.query(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [table, indexName]
  );
  return rows.length > 0;
}

async function columnType(c, table, column) {
  const [rows] = await c.query(
    `SELECT DATA_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0 ? rows[0].DATA_TYPE : null;
}

async function run(c, sql, desc) {
  if (DRY_RUN) {
    log(`[dry-run] WOULD RUN: ${desc}`);
    return;
  }
  await c.query("SET SESSION sql_mode = ''");
  await c.query(sql);
  ok(desc);
}

// ─── migrations ──────────────────────────────────────────────────────────────

async function migration1_renameSalesCostTimeline(c) {
  console.log('\n[Migration 1] Rename sales_cost timeline columns DATE → DATETIME');

  // delivery_order → departure_datetime
  if (await columnExists(c, 'sales_cost', 'delivery_order')) {
    await run(c,
      `ALTER TABLE sales_cost
         CHANGE COLUMN delivery_order  departure_datetime    DATETIME NOT NULL,
         CHANGE COLUMN arrival_order   arrival_datetime      DATETIME NULL,
         CHANGE COLUMN finish_order    finish_order_datetime DATETIME NULL`,
      'Renamed delivery_order → departure_datetime, arrival_order → arrival_datetime, finish_order → finish_order_datetime'
    );
  } else if (await columnExists(c, 'sales_cost', 'departure_datetime')) {
    // Pastikan tipenya DATETIME bukan DATE
    const t = await columnType(c, 'sales_cost', 'departure_datetime');
    if (t && t.toLowerCase() === 'date') {
      await run(c,
        `ALTER TABLE sales_cost
           MODIFY COLUMN departure_datetime    DATETIME NOT NULL,
           MODIFY COLUMN arrival_datetime      DATETIME NULL,
           MODIFY COLUMN finish_order_datetime DATETIME NULL`,
        'Converted departure_datetime/arrival_datetime/finish_order_datetime from DATE to DATETIME'
      );
    } else {
      skip('sales_cost timeline columns sudah DATETIME');
    }
  } else {
    warn('Kolom departure_datetime tidak ditemukan dan delivery_order juga tidak ada — periksa schema secara manual');
  }
}

async function migration2_createDeliveryNotifications(c) {
  console.log('\n[Migration 2] Create table delivery_notifications');

  if (await tableExists(c, 'delivery_notifications')) {
    skip('Tabel delivery_notifications sudah ada');

    // Pastikan kolom id_area_route_step dan step_name ada
    if (!(await columnExists(c, 'delivery_notifications', 'id_area_route_step'))) {
      await run(c,
        `ALTER TABLE delivery_notifications
           ADD COLUMN id_area_route_step INT NULL AFTER id_sales_cost,
           ADD COLUMN step_name          VARCHAR(100) NULL AFTER id_area_route_step`,
        'Ditambahkan kolom id_area_route_step dan step_name ke delivery_notifications'
      );
    } else {
      skip('Kolom id_area_route_step sudah ada di delivery_notifications');
    }

    if (!(await columnExists(c, 'delivery_notifications', 'id_sc_stop'))) {
      await run(c,
        `ALTER TABLE delivery_notifications
           ADD COLUMN id_sc_stop INT NULL AFTER id_area_route_step`,
        'Ditambahkan kolom id_sc_stop ke delivery_notifications'
      );
    } else {
      skip('Kolom id_sc_stop sudah ada di delivery_notifications');
    }
    return;
  }

  await run(c,
    `CREATE TABLE delivery_notifications (
       id                INT AUTO_INCREMENT PRIMARY KEY,
       id_sales_cost     INT NOT NULL,
       id_area_route_step INT NULL,
       step_name         VARCHAR(100) NULL,
       id_sc_stop        INT NULL,
       notification_type ENUM('arrival_overdue') NOT NULL DEFAULT 'arrival_overdue',
       truck_plate       VARCHAR(20) NOT NULL,
       route_name        VARCHAR(255) NOT NULL,
       scheduled_arrival DATETIME NOT NULL,
       message           TEXT NOT NULL,
       is_read           TINYINT(1) NOT NULL DEFAULT 0,
       is_dismissed      TINYINT(1) NOT NULL DEFAULT 0,
       created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
       read_at           DATETIME NULL,
       FOREIGN KEY (id_sales_cost) REFERENCES sales_cost(id_sales_cost) ON DELETE CASCADE,
       INDEX idx_dn_unread (is_read, is_dismissed),
       INDEX idx_dn_sales_cost (id_sales_cost)
     )`,
    'Tabel delivery_notifications dibuat'
  );
}

async function migration3_restructureSalesCostStepSchedule(c) {
  console.log('\n[Migration 3] Restructure sales_cost_step_schedule');

  if (!(await tableExists(c, 'sales_cost_step_schedule'))) {
    await run(c,
      `CREATE TABLE sales_cost_step_schedule (
         id                   INT AUTO_INCREMENT PRIMARY KEY,
         id_sales_cost        INT NOT NULL,
         stop_order           INT NOT NULL DEFAULT 0,
         stop_name            VARCHAR(255) NOT NULL DEFAULT '',
         wialon_resource_id   BIGINT NULL,
         wialon_zone_id       BIGINT NULL,
         wialon_zone_name     VARCHAR(255) NULL,
         is_departure         TINYINT(1) NOT NULL DEFAULT 0,
         is_finish            TINYINT(1) NOT NULL DEFAULT 0,
         estimated_arrival    DATETIME NULL,
         created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
         updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         UNIQUE KEY uniq_sc_stop_order (id_sales_cost, stop_order),
         INDEX idx_scss_sales_cost (id_sales_cost),
         INDEX idx_scss_departure (id_sales_cost, is_departure),
         INDEX idx_scss_finish (id_sales_cost, is_finish),
         FOREIGN KEY (id_sales_cost) REFERENCES sales_cost(id_sales_cost) ON DELETE CASCADE
       )`,
      'Tabel sales_cost_step_schedule dibuat (skema baru)'
    );
    return;
  }

  // Tabel sudah ada — cek apakah masih pakai skema lama
  if (await columnExists(c, 'sales_cost_step_schedule', 'id_area_route_step')) {
    log('Mendeteksi skema lama — migrasi ke skema baru...');

    // Drop FK yang mengacu ke id_area_route_step
    const [fkRows] = await c.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'sales_cost_step_schedule'
         AND CONSTRAINT_TYPE = 'FOREIGN KEY'`
    );
    for (const fk of fkRows) {
      await run(c,
        `ALTER TABLE sales_cost_step_schedule DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``,
        `Dropped FK ${fk.CONSTRAINT_NAME}`
      );
    }

    // Drop old unique key
    if (await indexExists(c, 'sales_cost_step_schedule', 'uniq_sc_step')) {
      await run(c,
        `ALTER TABLE sales_cost_step_schedule DROP INDEX uniq_sc_step`,
        'Dropped index uniq_sc_step'
      );
    }

    // Drop old columns
    for (const col of ['id_area_route_step', 'step_order_snapshot', 'step_name_snapshot']) {
      if (await columnExists(c, 'sales_cost_step_schedule', col)) {
        await run(c,
          `ALTER TABLE sales_cost_step_schedule DROP COLUMN \`${col}\``,
          `Dropped column ${col}`
        );
      }
    }

    // Add new columns (only if not already present)
    const newCols = [
      ['stop_order',         `ADD COLUMN stop_order INT NOT NULL DEFAULT 0 AFTER id_sales_cost`],
      ['stop_name',          `ADD COLUMN stop_name VARCHAR(255) NOT NULL DEFAULT '' AFTER stop_order`],
      ['wialon_resource_id', `ADD COLUMN wialon_resource_id BIGINT NULL AFTER stop_name`],
      ['wialon_zone_id',     `ADD COLUMN wialon_zone_id BIGINT NULL AFTER wialon_resource_id`],
      ['wialon_zone_name',   `ADD COLUMN wialon_zone_name VARCHAR(255) NULL AFTER wialon_zone_id`],
      ['is_departure',       `ADD COLUMN is_departure TINYINT(1) NOT NULL DEFAULT 0 AFTER wialon_zone_name`],
      ['is_finish',          `ADD COLUMN is_finish TINYINT(1) NOT NULL DEFAULT 0 AFTER is_departure`],
    ];
    for (const [col, ddl] of newCols) {
      if (!(await columnExists(c, 'sales_cost_step_schedule', col))) {
        await run(c,
          `ALTER TABLE sales_cost_step_schedule ${ddl}`,
          `Added column ${col}`
        );
      } else {
        skip(`Column ${col} sudah ada`);
      }
    }

    // Fix estimated_arrival to NULL
    const [estRows] = await c.query(
      `SELECT IS_NULLABLE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_cost_step_schedule' AND COLUMN_NAME = 'estimated_arrival'`
    );
    if (estRows.length > 0 && estRows[0].IS_NULLABLE === 'NO') {
      await run(c,
        `ALTER TABLE sales_cost_step_schedule MODIFY COLUMN estimated_arrival DATETIME NULL`,
        'estimated_arrival set to NULL-able'
      );
    } else {
      skip('estimated_arrival sudah NULL-able');
    }

    // Add new indexes
    if (!(await indexExists(c, 'sales_cost_step_schedule', 'uniq_sc_stop_order'))) {
      await run(c,
        `ALTER TABLE sales_cost_step_schedule ADD UNIQUE KEY uniq_sc_stop_order (id_sales_cost, stop_order)`,
        'Added unique key uniq_sc_stop_order'
      );
    } else {
      skip('Index uniq_sc_stop_order sudah ada');
    }

    // Re-add FK for id_sales_cost
    if (!(await indexExists(c, 'sales_cost_step_schedule', 'idx_scss_departure'))) {
      await run(c,
        `ALTER TABLE sales_cost_step_schedule
           ADD INDEX idx_scss_departure (id_sales_cost, is_departure),
           ADD INDEX idx_scss_finish (id_sales_cost, is_finish)`,
        'Added indexes idx_scss_departure dan idx_scss_finish'
      );
    } else {
      skip('Indexes idx_scss_departure sudah ada');
    }

    ok('sales_cost_step_schedule berhasil dimigrasi ke skema baru');
  } else if (await columnExists(c, 'sales_cost_step_schedule', 'stop_order')) {
    skip('sales_cost_step_schedule sudah menggunakan skema baru');

    // Pastikan estimated_arrival NULL-able
    const [estRows] = await c.query(
      `SELECT IS_NULLABLE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_cost_step_schedule' AND COLUMN_NAME = 'estimated_arrival'`
    );
    if (estRows.length > 0 && estRows[0].IS_NULLABLE === 'NO') {
      await run(c,
        `ALTER TABLE sales_cost_step_schedule MODIFY COLUMN estimated_arrival DATETIME NULL`,
        'estimated_arrival set to NULL-able'
      );
    }
  } else {
    warn('sales_cost_step_schedule: struktur tidak dikenali — periksa secara manual');
  }
}

async function migration4_addIdScStopToRouteHistory(c) {
  console.log('\n[Migration 4] Add id_sc_stop to sales_cost_route_history');

  if (await columnExists(c, 'sales_cost_route_history', 'id_sc_stop')) {
    skip('Kolom id_sc_stop sudah ada di sales_cost_route_history');
    return;
  }

  await run(c,
    `ALTER TABLE sales_cost_route_history
       ADD COLUMN id_sc_stop INT NULL AFTER id_area_route_step`,
    'Ditambahkan kolom id_sc_stop ke sales_cost_route_history'
  );

  if (!(await indexExists(c, 'sales_cost_route_history', 'idx_scrh_sc_stop'))) {
    await run(c,
      `ALTER TABLE sales_cost_route_history ADD INDEX idx_scrh_sc_stop (id_sc_stop)`,
      'Ditambahkan index idx_scrh_sc_stop'
    );
  }
}

async function migration5_fixMysqlTimezone(c) {
  console.log('\n[Migration 5] Verifikasi koneksi MySQL (timezone/dateStrings)');
  // Ini dikonfigurasi di db.js, bukan di DB schema — hanya verifikasi
  const [rows] = await c.query("SELECT @@session.time_zone as tz, NOW() as now_val");
  ok(`MySQL session timezone: ${rows[0].tz}, NOW(): ${rows[0].now_val}`);
  log('Pastikan db.js sudah memiliki timezone: "local" dan dateStrings: true');
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Production Migration Script — Juli 2026 ===');
  console.log(`Database: ${process.env.DB_NAME}@${process.env.DB_HOST}\n`);

  const c = await mysql.createConnection({
    host:        process.env.DB_HOST     || 'localhost',
    user:        process.env.DB_USER     || 'root',
    password:    process.env.DB_PASS     || '',
    database:    process.env.DB_NAME     || 'trucking',
    multipleStatements: false,
    timezone:    'local',
    dateStrings: true,
  });

  console.log('Koneksi ke MySQL berhasil.');

  try {
    await migration1_renameSalesCostTimeline(c);
    await migration2_createDeliveryNotifications(c);
    await migration3_restructureSalesCostStepSchedule(c);
    await migration4_addIdScStopToRouteHistory(c);
    await migration5_fixMysqlTimezone(c);

    console.log('\n=== Verifikasi Akhir ===');
    const checks = [
      ['sales_cost',                  'departure_datetime'],
      ['sales_cost',                  'arrival_datetime'],
      ['sales_cost',                  'finish_order_datetime'],
      ['delivery_notifications',      'id_sc_stop'],
      ['delivery_notifications',      'step_name'],
      ['sales_cost_step_schedule',    'stop_order'],
      ['sales_cost_step_schedule',    'is_departure'],
      ['sales_cost_step_schedule',    'is_finish'],
      ['sales_cost_route_history',    'id_sc_stop'],
    ];

    let allOk = true;
    for (const [table, col] of checks) {
      const exists = await columnExists(c, table, col);
      const status = exists ? '✓' : '✗ MISSING';
      console.log(`  ${status}  ${table}.${col}`);
      if (!exists) allOk = false;
    }

    // Cek tabel delivery_notifications ada
    const dnExists = await tableExists(c, 'delivery_notifications');
    console.log(`  ${dnExists ? '✓' : '✗ MISSING'}  table: delivery_notifications`);
    if (!dnExists) allOk = false;

    console.log(allOk
      ? '\n✓ Semua migration berhasil diterapkan.\n'
      : '\n✗ Ada yang belum lengkap — periksa output di atas.\n'
    );

    if (DRY_RUN) {
      console.log('=== DRY RUN selesai — tidak ada perubahan yang diterapkan ===');
    }

  } finally {
    await c.end();
  }
}

main().catch(err => {
  console.error('\n✗ Migration gagal:', err.message);
  console.error(err);
  process.exit(1);
});
