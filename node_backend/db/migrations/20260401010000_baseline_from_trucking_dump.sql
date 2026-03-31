-- migrate:up
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
/*!40101 SET NAMES utf8mb4 */;
CREATE TABLE `admin` (
  `id_admin` int(13) NOT NULL,
  `nik_admin` char(30) NOT NULL,
  `nama_admin` varchar(50) NOT NULL,
  `password` varchar(50) NOT NULL,
  `level` enum('admin','user','mekanik','cs') NOT NULL,
  `email` varchar(30) NOT NULL,
  `nomor_telp` varchar(20) NOT NULL,
  `jabatan` char(30) NOT NULL,
  `gambar` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
CREATE TABLE `area` (
  `id_area` int(13) NOT NULL,
  `kode_area` varchar(50) DEFAULT NULL,
  `nama_area` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
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
  KEY `idx_area_route_step_area` (`id_area`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
CREATE TABLE `customer` (
  `id_customer` int(13) NOT NULL,
  `nama_customer` varchar(50) NOT NULL,
  `alamat` text NOT NULL,
  `no_telp` varchar(13) NOT NULL,
  `pic` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
CREATE TABLE `destination` (
  `id_destination` int(13) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
CREATE TABLE `driver` (
  `id_driver` int(3) NOT NULL,
  `no_polisi` varchar(30) NOT NULL,
  `nama_driver` varchar(50) NOT NULL,
  `no_telp` varchar(50) NOT NULL,
  `no_ktp` varchar(17) NOT NULL,
  `alamat` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
CREATE TABLE `m_subcont` (
  `id_subcont` int(30) NOT NULL,
  `nama_subcont` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
CREATE TABLE `repair` (
  `id_repair` int(30) NOT NULL,
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
  `tgl_selesai` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
CREATE TABLE `sales_cost` (
  `id_sales_cost` int(30) NOT NULL,
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
  `id_print` varchar(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
CREATE TABLE `sales_cost_route_history` (
  `id_sales_cost_route_history` int(13) NOT NULL AUTO_INCREMENT,
  `id_sales_cost` int(30) NOT NULL,
  `id_area` int(13) NOT NULL,
  `id_area_route_step` int(13) DEFAULT NULL,
  `step_key` varchar(100) NOT NULL,
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
  UNIQUE KEY `uniq_sales_cost_route_step` (`id_sales_cost`,`id_area_route_step`),
  UNIQUE KEY `uniq_sales_cost_step_key` (`id_sales_cost`,`step_key`),
  KEY `idx_sales_cost_route_history_sales_cost` (`id_sales_cost`),
  KEY `idx_sales_cost_route_history_area` (`id_area`),
  KEY `idx_sales_cost_route_history_truck` (`id_truck`),
  KEY `idx_sales_cost_route_history_step` (`id_area_route_step`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
CREATE TABLE `subcont` (
  `id_subcont` int(13) NOT NULL,
  `nama_subcont` varchar(50) NOT NULL,
  `pic_subcont` varchar(50) NOT NULL,
  `alamat` text NOT NULL,
  `no_telp` varchar(13) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
CREATE TABLE `sub_contractor` (
  `id_subcontractor` int(13) NOT NULL,
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
  `nik_admin` int(13) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
CREATE TABLE `truck` (
  `id_truck` int(13) NOT NULL,
  `jenis_kendaraan` varchar(50) NOT NULL,
  `no_police` varchar(50) NOT NULL,
  `merk_mobil` varchar(50) NOT NULL,
  `model` varchar(50) NOT NULL,
  `type_truck` varchar(50) NOT NULL,
  `wialon_unit_id` varchar(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
CREATE TABLE `warehouse` (
  `id_warehouse` int(13) NOT NULL,
  `kode_warehouse` varchar(13) NOT NULL,
  `nm_warehouse` varchar(50) NOT NULL,
  `pic_warehouse` varchar(50) NOT NULL,
  `alamat` text NOT NULL,
  `kontak` varchar(13) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id_admin`);
ALTER TABLE `area`
  ADD PRIMARY KEY (`id_area`);
ALTER TABLE `customer`
  ADD PRIMARY KEY (`id_customer`);
ALTER TABLE `destination`
  ADD PRIMARY KEY (`id_destination`);
ALTER TABLE `driver`
  ADD PRIMARY KEY (`id_driver`);
ALTER TABLE `m_subcont`
  ADD PRIMARY KEY (`id_subcont`);
ALTER TABLE `repair`
  ADD PRIMARY KEY (`id_repair`);
ALTER TABLE `sales_cost`
  ADD PRIMARY KEY (`id_sales_cost`);
ALTER TABLE `subcont`
  ADD PRIMARY KEY (`id_subcont`);
ALTER TABLE `sub_contractor`
  ADD PRIMARY KEY (`id_subcontractor`);
ALTER TABLE `truck`
  ADD PRIMARY KEY (`id_truck`);
ALTER TABLE `warehouse`
  ADD PRIMARY KEY (`id_warehouse`);
ALTER TABLE `admin`
  MODIFY `id_admin` int(13) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=122;
ALTER TABLE `area`
  MODIFY `id_area` int(13) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=199;
ALTER TABLE `customer`
  MODIFY `id_customer` int(13) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5590;
ALTER TABLE `destination`
  MODIFY `id_destination` int(13) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4006;
ALTER TABLE `driver`
  MODIFY `id_driver` int(3) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=113029;
ALTER TABLE `m_subcont`
  MODIFY `id_subcont` int(30) NOT NULL AUTO_INCREMENT;
ALTER TABLE `repair`
  MODIFY `id_repair` int(30) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=147;
ALTER TABLE `sales_cost`
  MODIFY `id_sales_cost` int(30) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41371;
ALTER TABLE `subcont`
  MODIFY `id_subcont` int(13) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100235;
ALTER TABLE `sub_contractor`
  MODIFY `id_subcontractor` int(13) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=239;
ALTER TABLE `truck`
  MODIFY `id_truck` int(13) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6382;
ALTER TABLE `warehouse`
  MODIFY `id_warehouse` int(13) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

-- migrate:down
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `warehouse`;
DROP TABLE IF EXISTS `truck`;
DROP TABLE IF EXISTS `sub_contractor`;
DROP TABLE IF EXISTS `subcont`;
DROP TABLE IF EXISTS `sales_cost_route_history`;
DROP TABLE IF EXISTS `sales_cost`;
DROP TABLE IF EXISTS `repair`;
DROP TABLE IF EXISTS `m_subcont`;
DROP TABLE IF EXISTS `driver`;
DROP TABLE IF EXISTS `destination`;
DROP TABLE IF EXISTS `customer`;
DROP TABLE IF EXISTS `area_route_step`;
DROP TABLE IF EXISTS `area`;
DROP TABLE IF EXISTS `admin`;
SET FOREIGN_KEY_CHECKS = 1;
