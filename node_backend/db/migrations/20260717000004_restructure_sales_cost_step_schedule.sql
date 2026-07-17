-- migrate:up
-- Drop old data and restructure sales_cost_step_schedule for direct geofence selection
TRUNCATE TABLE sales_cost_step_schedule;

ALTER TABLE sales_cost_step_schedule
  DROP FOREIGN KEY IF EXISTS fk_scss_step,
  DROP INDEX IF EXISTS uniq_sc_step,
  DROP COLUMN IF EXISTS id_area_route_step,
  DROP COLUMN IF EXISTS step_order_snapshot,
  DROP COLUMN IF EXISTS step_name_snapshot;

ALTER TABLE sales_cost_step_schedule
  ADD COLUMN stop_order          INT NOT NULL DEFAULT 0 AFTER id_sales_cost,
  ADD COLUMN stop_name           VARCHAR(255) NOT NULL DEFAULT '' AFTER stop_order,
  ADD COLUMN wialon_resource_id  BIGINT NULL AFTER stop_name,
  ADD COLUMN wialon_zone_id      BIGINT NULL AFTER wialon_resource_id,
  ADD COLUMN wialon_zone_name    VARCHAR(255) NULL AFTER wialon_zone_id,
  ADD COLUMN is_departure        TINYINT(1) NOT NULL DEFAULT 0 AFTER wialon_zone_name,
  ADD COLUMN is_finish           TINYINT(1) NOT NULL DEFAULT 0 AFTER is_departure,
  ADD UNIQUE KEY uniq_sc_stop_order (id_sales_cost, stop_order),
  ADD INDEX idx_scss_departure (id_sales_cost, is_departure),
  ADD INDEX idx_scss_finish (id_sales_cost, is_finish);

-- migrate:down
-- Cannot restore dropped data, but restore structure
TRUNCATE TABLE sales_cost_step_schedule;
ALTER TABLE sales_cost_step_schedule
  DROP INDEX IF EXISTS uniq_sc_stop_order,
  DROP INDEX IF EXISTS idx_scss_departure,
  DROP INDEX IF EXISTS idx_scss_finish,
  DROP COLUMN IF EXISTS stop_order,
  DROP COLUMN IF EXISTS stop_name,
  DROP COLUMN IF EXISTS wialon_resource_id,
  DROP COLUMN IF EXISTS wialon_zone_id,
  DROP COLUMN IF EXISTS wialon_zone_name,
  DROP COLUMN IF EXISTS is_departure,
  DROP COLUMN IF EXISTS is_finish,
  ADD COLUMN id_area_route_step   INT NOT NULL,
  ADD COLUMN step_order_snapshot  INT NOT NULL,
  ADD COLUMN step_name_snapshot   VARCHAR(100) NOT NULL,
  ADD UNIQUE KEY uniq_sc_step (id_sales_cost, id_area_route_step);
