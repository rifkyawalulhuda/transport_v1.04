-- migrate:up

-- ============================================================================
-- BBS Speed Telemetry — Import data kecepatan dari CSV GPS tracker
-- Menggantikan integrasi overspeed Wialon sebagai sumber skor kategori Kecepatan.
--
-- Catatan collation: tabel driver/truck di DB ini latin1_swedish_ci, sedangkan
-- tabel bbs_* memakai utf8mb4_general_ci. Tabel Speed mengikuti utf8mb4 agar
-- konsisten dengan bbs_*, dan JOIN ke driver/truck WAJIB memakai
-- CONVERT(... USING utf8mb4) supaya tidak kena "Illegal mix of collations".
-- ============================================================================

CREATE TABLE IF NOT EXISTS `bbs_speed_telemetry` (
  `id_telemetry` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `device_id` varchar(40) NOT NULL,
  `plate_number` varchar(20) NOT NULL,
  `driver_id` varchar(30) DEFAULT NULL,
  `fleet` varchar(60) DEFAULT NULL,
  `creation_time` datetime NOT NULL,
  `speed_kmh` decimal(6,2) NOT NULL DEFAULT 0.00,
  `altitude` decimal(7,2) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `acc_state` enum('on','off') DEFAULT NULL,
  `is_moving` tinyint(1) NOT NULL DEFAULT 0,
  `source_file` varchar(160) DEFAULT NULL,
  `id_admin` int(13) DEFAULT NULL,
  `imported_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_telemetry`),
  UNIQUE KEY `uq_speed_point` (`device_id`,`creation_time`),
  KEY `idx_speed_plate_time` (`plate_number`,`creation_time`),
  KEY `idx_speed_moving` (`device_id`,`is_moving`,`creation_time`),
  KEY `idx_speed_month` (`creation_time`,`is_moving`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `bbs_speed_events` (
  `id_event` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `device_id` varchar(40) NOT NULL,
  `plate_number` varchar(20) NOT NULL,
  `driver_id` varchar(30) DEFAULT NULL,
  `fleet` varchar(60) DEFAULT NULL,
  `begin_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `duration_seconds` int(11) NOT NULL DEFAULT 0,
  `max_speed_kmh` decimal(6,2) NOT NULL DEFAULT 0.00,
  `avg_speed_kmh` decimal(6,2) NOT NULL DEFAULT 0.00,
  `sample_count` int(11) NOT NULL DEFAULT 0,
  `distance_km` decimal(8,3) DEFAULT NULL,
  `threshold_kmh` decimal(6,2) NOT NULL,
  `month_key` char(7) NOT NULL,
  PRIMARY KEY (`id_event`),
  KEY `idx_speed_event_plate_month` (`plate_number`,`month_key`),
  KEY `idx_speed_event_device_month` (`device_id`,`month_key`),
  KEY `idx_speed_event_begin` (`begin_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `bbs_speed_daily` (
  `id_daily` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `device_id` varchar(40) NOT NULL,
  `plate_number` varchar(20) NOT NULL,
  `driver_id` varchar(30) DEFAULT NULL,
  `fleet` varchar(60) DEFAULT NULL,
  `day` date NOT NULL,
  `moving_seconds` int(11) NOT NULL DEFAULT 0,
  `overspeed_seconds` int(11) NOT NULL DEFAULT 0,
  `distance_km` decimal(9,3) NOT NULL DEFAULT 0.000,
  `max_speed_kmh` decimal(6,2) NOT NULL DEFAULT 0.00,
  `avg_moving_speed_kmh` decimal(6,2) NOT NULL DEFAULT 0.00,
  `event_count` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_daily`),
  UNIQUE KEY `uq_speed_daily` (`device_id`,`day`),
  KEY `idx_speed_daily_plate_day` (`plate_number`,`day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabel settings global pertama di project ini.
-- Nilai disimpan sebagai string; parsing dilakukan di layer service.
CREATE TABLE IF NOT EXISTS `bbs_settings` (
  `setting_key` varchar(60) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_by` int(13) DEFAULT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed default. INSERT IGNORE supaya tidak menimpa nilai yang sudah diubah user.
INSERT IGNORE INTO `bbs_settings` (`setting_key`, `setting_value`) VALUES
  ('speed.overspeed_threshold_kmh', '60'),
  ('speed.retention_days', '90'),
  ('speed.score_penalty_factor', '20'),
  ('speed.weight', '0.30'),
  ('speed.burst_gap_seconds', '90');

-- migrate:down

DROP TABLE IF EXISTS `bbs_settings`;
DROP TABLE IF EXISTS `bbs_speed_daily`;
DROP TABLE IF EXISTS `bbs_speed_events`;
DROP TABLE IF EXISTS `bbs_speed_telemetry`;
