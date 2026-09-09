-- migrate:up
ALTER TABLE `bbs_observations`
  ADD COLUMN `source` VARCHAR(20) NOT NULL DEFAULT 'manual' AFTER `created_at`,
  ADD COLUMN `device_id` VARCHAR(40) DEFAULT NULL AFTER `source`,
  ADD COLUMN `alarm_type` VARCHAR(60) DEFAULT NULL AFTER `device_id`,
  ADD COLUMN `begin_time` DATETIME DEFAULT NULL AFTER `alarm_type`,
  ADD COLUMN `fleet` VARCHAR(60) DEFAULT NULL AFTER `begin_time`,
  ADD COLUMN `plate_number` VARCHAR(20) DEFAULT NULL AFTER `fleet`,
  ADD UNIQUE KEY `uq_adas_alarm` (`device_id`, `begin_time`, `alarm_type`);

-- migrate:down
ALTER TABLE `bbs_observations`
  DROP KEY `uq_adas_alarm`,
  DROP COLUMN `plate_number`,
  DROP COLUMN `fleet`,
  DROP COLUMN `begin_time`,
  DROP COLUMN `alarm_type`,
  DROP COLUMN `device_id`,
  DROP COLUMN `source`;
