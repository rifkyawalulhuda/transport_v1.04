-- migrate:up
-- Migration: make wialon fields in area_route_step nullable
-- Reason: route steps can be saved as drafts without geofence assignment

ALTER TABLE `area_route_step`
  MODIFY COLUMN `wialon_resource_id` bigint(20) DEFAULT NULL,
  MODIFY COLUMN `wialon_zone_id`     bigint(20) DEFAULT NULL,
  MODIFY COLUMN `wialon_zone_name`   varchar(255) DEFAULT NULL;

-- The UNIQUE KEY uniq_area_route_step_zone on (id_area, wialon_resource_id, wialon_zone_id)
-- still works correctly: MySQL treats NULL != NULL in unique indexes,
-- so multiple NULL rows per area are allowed (expected for draft steps).

-- migrate:down
ALTER TABLE `area_route_step`
  MODIFY COLUMN `wialon_resource_id` bigint(20) NOT NULL,
  MODIFY COLUMN `wialon_zone_id`     bigint(20) NOT NULL,
  MODIFY COLUMN `wialon_zone_name`   varchar(255) NOT NULL;
