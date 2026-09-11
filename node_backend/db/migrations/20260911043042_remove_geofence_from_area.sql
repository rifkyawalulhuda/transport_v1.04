-- migrate:up

-- Migration: Remove geofence columns from area and wialon columns from area_route_step
-- Area should only store kode_area and nama_area; geofence selection belongs to Sales Cost only.
--
-- MySQL (unlike MariaDB) does not support DROP COLUMN IF EXISTS / DROP INDEX IF EXISTS,
-- so each drop is guarded via information_schema and executed with dynamic SQL.

-- 1) Drop the zone unique index FIRST. Dropping the columns one-by-one would
--    leave a partial index on id_area (duplicate id_area rows are normal), which
--    triggers ER_DUP_ENTRY. The index spans only the wialon columns.
SET @has_zone_idx := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'area_route_step'
    AND index_name = 'uniq_area_route_step_zone'
);
SET @sql_idx := IF(
  @has_zone_idx > 0,
  'ALTER TABLE area_route_step DROP INDEX uniq_area_route_step_zone',
  'DO 0'
);
PREPARE stmt_idx FROM @sql_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;

-- 2) area_route_step: drop wialon columns
SET @has_step_wialon := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'area_route_step'
    AND column_name = 'wialon_resource_id'
);
SET @sql_step := IF(
  @has_step_wialon > 0,
  'ALTER TABLE area_route_step DROP COLUMN wialon_resource_id, DROP COLUMN wialon_zone_id, DROP COLUMN wialon_zone_name',
  'DO 0'
);
PREPARE stmt_step FROM @sql_step;
EXECUTE stmt_step;
DEALLOCATE PREPARE stmt_step;

-- 3) area: drop finish geofence columns
SET @has_area_finish := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'area'
    AND column_name = 'finish_geofence_resource_id'
);
SET @sql_area := IF(
  @has_area_finish > 0,
  'ALTER TABLE area DROP COLUMN finish_geofence_resource_id, DROP COLUMN finish_geofence_zone_id, DROP COLUMN finish_geofence_zone_name',
  'DO 0'
);
PREPARE stmt_area FROM @sql_area;
EXECUTE stmt_area;
DEALLOCATE PREPARE stmt_area;

-- migrate:down

-- Restore wialon columns to area_route_step
ALTER TABLE area_route_step
  ADD COLUMN wialon_resource_id BIGINT NULL,
  ADD COLUMN wialon_zone_id BIGINT NULL,
  ADD COLUMN wialon_zone_name VARCHAR(255) NULL;

-- Restore unique constraint
ALTER TABLE area_route_step
  ADD CONSTRAINT uniq_area_route_step_zone UNIQUE (id_area, wialon_resource_id, wialon_zone_id);

-- Restore finish_geofence columns to area
ALTER TABLE area
  ADD COLUMN finish_geofence_resource_id BIGINT NULL,
  ADD COLUMN finish_geofence_zone_id BIGINT NULL,
  ADD COLUMN finish_geofence_zone_name VARCHAR(255) NULL;
