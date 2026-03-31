-- Schema dump for trucking

-- Generated at 2026-03-31T17:54:15.416Z

DROP TABLE IF EXISTS `admin`;

CREATE TABLE `admin` (
  `id_admin` int(13) NOT NULL AUTO_INCREMENT,
  `nik_admin` char(30) NOT NULL,
  `nama_admin` varchar(50) NOT NULL,
  `password` varchar(50) NOT NULL,
  `level` enum('admin','user','mekanik','cs') NOT NULL,
  `email` varchar(30) NOT NULL,
  `nomor_telp` varchar(20) NOT NULL,
  `jabatan` char(30) NOT NULL,
  `gambar` varchar(200) NOT NULL,
  PRIMARY KEY (`id_admin`)
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

DROP TABLE IF EXISTS `area`;

CREATE TABLE `area` (
  `id_area` int(13) NOT NULL AUTO_INCREMENT,
  `kode_area` varchar(50) DEFAULT NULL,
  `nama_area` varchar(200) NOT NULL,
  PRIMARY KEY (`id_area`)
) ENGINE=InnoDB AUTO_INCREMENT=200 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

DROP TABLE IF EXISTS `area_route_step`;

CREATE TABLE `area_route_step` (
  `id_area_route_step` int(13) NOT NULL AUTO_INCREMENT,
  `id_area` int(13) NOT NULL,
  `step_order` int(11) NOT NULL,
  `step_name` varchar(100) NOT NULL,
  `wialon_resource_id` bigint(20) NOT NULL,
  `wialon_zone_id` bigint(20) NOT NULL,
  `wialon_zone_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id_area_route_step`),
  UNIQUE KEY `uniq_area_route_step_order` (`id_area`,`step_order`),
  UNIQUE KEY `uniq_area_route_step_zone` (`id_area`,`wialon_resource_id`,`wialon_zone_id`),
  KEY `idx_area_route_step_area` (`id_area`),
  CONSTRAINT `fk_area_route_step_area` FOREIGN KEY (`id_area`) REFERENCES `area` (`id_area`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

DROP TABLE IF EXISTS `customer`;

CREATE TABLE `customer` (
  `id_customer` int(13) NOT NULL AUTO_INCREMENT,
  `nama_customer` varchar(50) NOT NULL,
  `alamat` text NOT NULL,
  `no_telp` varchar(13) NOT NULL,
  `pic` varchar(30) NOT NULL,
  PRIMARY KEY (`id_customer`)
) ENGINE=InnoDB AUTO_INCREMENT=5589 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

DROP TABLE IF EXISTS `destination`;

CREATE TABLE `destination` (
  `id_destination` int(13) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id_destination`)
) ENGINE=InnoDB AUTO_INCREMENT=4006 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

DROP TABLE IF EXISTS `driver`;

CREATE TABLE `driver` (
  `id_driver` int(3) NOT NULL AUTO_INCREMENT,
  `no_polisi` varchar(30) NOT NULL,
  `nama_driver` varchar(50) NOT NULL,
  `no_telp` varchar(50) NOT NULL,
  `no_ktp` varchar(17) NOT NULL,
  `alamat` text NOT NULL,
  PRIMARY KEY (`id_driver`)
) ENGINE=InnoDB AUTO_INCREMENT=113028 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

DROP TABLE IF EXISTS `m_subcont`;

CREATE TABLE `m_subcont` (
  `id_subcont` int(30) NOT NULL AUTO_INCREMENT,
  `nama_subcont` varchar(100) NOT NULL,
  PRIMARY KEY (`id_subcont`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

DROP TABLE IF EXISTS `repair`;

CREATE TABLE `repair` (
  `id_repair` int(30) NOT NULL AUTO_INCREMENT,
  `kategori_repair` varchar(100) NOT NULL,
  `id_truck` int(13) NOT NULL,
  `tgl_input` date NOT NULL,
  `tgl_kerusakan` date DEFAULT NULL,
  `no_spk_perbaikan` varchar(100) NOT NULL,
  `kilometer` varchar(30) NOT NULL,
  `jenis_kerusakan` varchar(100) NOT NULL,
  `spare_part` varchar(100) NOT NULL,
  `jadwal_berkala` date DEFAULT NULL,
  `keterangan` text NOT NULL,
  `biaya_perbaikan` int(30) NOT NULL,
  `nik_admin` varchar(13) NOT NULL,
  `status_repair` enum('PROSES','SELESAI') NOT NULL DEFAULT 'PROSES',
  `tgl_proses` date DEFAULT NULL,
  `tgl_selesai` date DEFAULT NULL,
  PRIMARY KEY (`id_repair`)
) ENGINE=InnoDB AUTO_INCREMENT=151 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

DROP TABLE IF EXISTS `sales_cost`;

CREATE TABLE `sales_cost` (
  `id_sales_cost` int(30) NOT NULL AUTO_INCREMENT,
  `tgl_order` date NOT NULL,
  `id_truck` int(30) NOT NULL,
  `id_driver` int(30) NOT NULL,
  `id_area` int(30) NOT NULL,
  `id_customer` int(30) NOT NULL,
  `id_admin` varchar(13) NOT NULL,
  `delivery_order` date NOT NULL,
  `arrival_order` date NOT NULL,
  `finish_order` date DEFAULT NULL,
  `bills` varchar(50) NOT NULL,
  `lift_on` int(30) NOT NULL,
  `lift_of` int(30) NOT NULL,
  `container_depot` varchar(100) NOT NULL,
  `no_po` varchar(100) NOT NULL,
  `no_aju` varchar(100) NOT NULL,
  `no_container` varchar(100) NOT NULL,
  `tax` int(13) NOT NULL,
  `admin_charge` int(13) NOT NULL,
  `materai` char(13) NOT NULL,
  `trip` char(13) NOT NULL,
  `jenis_trip` enum('Trip','Day','','') NOT NULL,
  `container_size` varchar(20) DEFAULT NULL,
  `price` int(30) NOT NULL,
  `container_repair` int(100) NOT NULL,
  `demurrage_chargers` int(100) NOT NULL,
  `detention_chargers` int(100) NOT NULL,
  `extend_gate_pass` int(100) NOT NULL,
  `additional_cost` int(30) NOT NULL,
  `ops_cost` int(30) NOT NULL,
  `total` int(30) NOT NULL,
  `margin` varchar(30) NOT NULL,
  `id_print` varchar(250) NOT NULL,
  PRIMARY KEY (`id_sales_cost`)
) ENGINE=InnoDB AUTO_INCREMENT=40769 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

DROP TABLE IF EXISTS `sales_cost_route_history`;

CREATE TABLE `sales_cost_route_history` (
  `id_sales_cost_route_history` int(13) NOT NULL AUTO_INCREMENT,
  `id_sales_cost` int(30) NOT NULL,
  `id_area` int(13) NOT NULL,
  `id_area_route_step` int(13) DEFAULT NULL,
  `step_key` varchar(100) NOT NULL DEFAULT '',
  `system_step_code` varchar(50) DEFAULT NULL,
  `id_truck` int(30) NOT NULL,
  `step_order_snapshot` int(11) NOT NULL,
  `step_name_snapshot` varchar(100) NOT NULL,
  `wialon_resource_id` bigint(20) NOT NULL,
  `wialon_zone_id` bigint(20) NOT NULL,
  `wialon_zone_name` varchar(255) NOT NULL,
  `gps_time` datetime NOT NULL,
  `recorded_at` datetime NOT NULL DEFAULT current_timestamp(),
  `lat` decimal(10,6) DEFAULT NULL,
  `lon` decimal(10,6) DEFAULT NULL,
  PRIMARY KEY (`id_sales_cost_route_history`),
  UNIQUE KEY `uniq_sales_cost_step_key` (`id_sales_cost`,`step_key`),
  UNIQUE KEY `uniq_sales_cost_route_step` (`id_sales_cost`,`id_area_route_step`),
  KEY `idx_sales_cost_route_history_sales_cost` (`id_sales_cost`),
  KEY `idx_sales_cost_route_history_area` (`id_area`),
  KEY `idx_sales_cost_route_history_truck` (`id_truck`),
  KEY `idx_sales_cost_route_history_step` (`id_area_route_step`),
  CONSTRAINT `fk_sales_cost_route_history_area` FOREIGN KEY (`id_area`) REFERENCES `area` (`id_area`) ON DELETE CASCADE,
  CONSTRAINT `fk_sales_cost_route_history_sales_cost` FOREIGN KEY (`id_sales_cost`) REFERENCES `sales_cost` (`id_sales_cost`) ON DELETE CASCADE,
  CONSTRAINT `fk_sales_cost_route_history_step` FOREIGN KEY (`id_area_route_step`) REFERENCES `area_route_step` (`id_area_route_step`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

DROP TABLE IF EXISTS `sub_contractor`;

CREATE TABLE `sub_contractor` (
  `id_subcontractor` int(13) NOT NULL AUTO_INCREMENT,
  `order_date` date NOT NULL,
  `delivery_date` date NOT NULL,
  `arrival_date` date NOT NULL,
  `id_warehouse` int(13) NOT NULL,
  `id_customer` int(13) NOT NULL,
  `id_subcont` int(13) NOT NULL,
  `no_surat_jalan` varchar(100) NOT NULL,
  `trip` char(30) NOT NULL,
  `truck` varchar(100) NOT NULL,
  `jenis_kendaraan` varchar(100) NOT NULL,
  `tonase` varchar(100) NOT NULL,
  `tujuan_pengiriman` varchar(100) NOT NULL,
  `driver` varchar(100) NOT NULL,
  `cost` int(30) NOT NULL,
  `no_invoice` char(30) NOT NULL,
  `billing_customer` varchar(100) NOT NULL,
  `sales` int(30) NOT NULL,
  `gross_profit` int(30) NOT NULL,
  `nik_admin` int(13) NOT NULL,
  PRIMARY KEY (`id_subcontractor`)
) ENGINE=InnoDB AUTO_INCREMENT=215 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

DROP TABLE IF EXISTS `subcont`;

CREATE TABLE `subcont` (
  `id_subcont` int(13) NOT NULL AUTO_INCREMENT,
  `nama_subcont` varchar(50) NOT NULL,
  `pic_subcont` varchar(50) NOT NULL,
  `alamat` text NOT NULL,
  `no_telp` varchar(13) NOT NULL,
  PRIMARY KEY (`id_subcont`)
) ENGINE=InnoDB AUTO_INCREMENT=100233 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

DROP TABLE IF EXISTS `truck`;

CREATE TABLE `truck` (
  `id_truck` int(13) NOT NULL AUTO_INCREMENT,
  `jenis_kendaraan` varchar(50) NOT NULL,
  `no_police` varchar(50) NOT NULL,
  `merk_mobil` varchar(50) NOT NULL,
  `model` varchar(50) NOT NULL,
  `type_truck` varchar(50) NOT NULL,
  `wialon_unit_id` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id_truck`)
) ENGINE=InnoDB AUTO_INCREMENT=6383 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

DROP TABLE IF EXISTS `warehouse`;

CREATE TABLE `warehouse` (
  `id_warehouse` int(13) NOT NULL AUTO_INCREMENT,
  `kode_warehouse` varchar(13) NOT NULL,
  `nm_warehouse` varchar(50) NOT NULL,
  `pic_warehouse` varchar(50) NOT NULL,
  `alamat` text NOT NULL,
  `kontak` varchar(13) NOT NULL,
  PRIMARY KEY (`id_warehouse`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
