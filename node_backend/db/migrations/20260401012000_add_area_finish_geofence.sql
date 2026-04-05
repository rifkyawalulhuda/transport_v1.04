-- migrate:up
ALTER TABLE `area`
  ADD COLUMN `finish_geofence_resource_id` bigint(20) DEFAULT NULL AFTER `nama_area`;

ALTER TABLE `area`
  ADD COLUMN `finish_geofence_zone_id` bigint(20) DEFAULT NULL AFTER `finish_geofence_resource_id`;

ALTER TABLE `area`
  ADD COLUMN `finish_geofence_zone_name` varchar(255) DEFAULT NULL AFTER `finish_geofence_zone_id`;

-- migrate:down
ALTER TABLE `area`
  DROP COLUMN `finish_geofence_zone_name`;

ALTER TABLE `area`
  DROP COLUMN `finish_geofence_zone_id`;

ALTER TABLE `area`
  DROP COLUMN `finish_geofence_resource_id`;
