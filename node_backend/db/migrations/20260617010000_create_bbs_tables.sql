-- migrate:up
CREATE TABLE `bbs_observations` (
  `id_observation` int(13) NOT NULL AUTO_INCREMENT,
  `id_admin` int(13) NOT NULL,
  `observer_name` varchar(100) NOT NULL,
  `driver_id` varchar(30) NOT NULL,
  `date` date NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `vehicle_type` varchar(30) DEFAULT NULL,
  `scores` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`scores`)),
  `feedback` text DEFAULT NULL,
  `follow_up` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_observation`),
  KEY `idx_bbs_obs_admin` (`id_admin`),
  KEY `idx_bbs_obs_date` (`date`),
  CONSTRAINT `fk_bbs_obs_admin` FOREIGN KEY (`id_admin`) REFERENCES `admin` (`id_admin`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE `bbs_checklists` (
  `id_checklist` int(13) NOT NULL AUTO_INCREMENT,
  `id_admin` int(13) NOT NULL,
  `driver_id` varchar(30) NOT NULL,
  `plate_number` varchar(20) NOT NULL,
  `date` date NOT NULL,
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items`)),
  `score` decimal(5,2) NOT NULL DEFAULT 0.00,
  `status` enum('passed','needs_fix') NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_checklist`),
  KEY `idx_bbs_chk_admin` (`id_admin`),
  KEY `idx_bbs_chk_date` (`date`),
  CONSTRAINT `fk_bbs_chk_admin` FOREIGN KEY (`id_admin`) REFERENCES `admin` (`id_admin`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE `bbs_incidents` (
  `id_incident` int(13) NOT NULL AUTO_INCREMENT,
  `id_admin` int(13) NOT NULL,
  `reporter_name` varchar(100) NOT NULL,
  `date` date NOT NULL,
  `type` enum('Near-Miss','Insiden Ringan','Insiden Sedang','Insiden Berat') NOT NULL,
  `location` varchar(100) NOT NULL,
  `plate_number` varchar(20) DEFAULT NULL,
  `chronology` text DEFAULT NULL,
  `factors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`factors`)),
  `casualties` text DEFAULT NULL,
  `recommendations` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_incident`),
  KEY `idx_bbs_inc_admin` (`id_admin`),
  KEY `idx_bbs_inc_date` (`date`),
  CONSTRAINT `fk_bbs_inc_admin` FOREIGN KEY (`id_admin`) REFERENCES `admin` (`id_admin`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- migrate:down
DROP TABLE IF EXISTS `bbs_incidents`;
DROP TABLE IF EXISTS `bbs_checklists`;
DROP TABLE IF EXISTS `bbs_observations`;
