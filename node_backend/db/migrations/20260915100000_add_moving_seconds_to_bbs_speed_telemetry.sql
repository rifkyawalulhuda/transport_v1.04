-- migrate:up

-- ============================================================================
-- BBS Speed — downsampling telemetry untuk mengecilkan ukuran tabel.
--
-- Kolom `moving_seconds` menyimpan berapa detik baris ini mewakili waktu
-- bergerak (moving time) pada agregat harian:
--   - baris overspeed penuh  -> 30 (satu slot tracker)
--   - baris sampel bucket    -> seluruh waktu bergerak bucket (mis. 180 detik)
--   - baris lama (default)   -> 30 (dulu semua baris disimpan penuh)
--
-- Jumlah moving_seconds per (device, hari) selalu = jumlah baris bergerak
-- sebenarnya x 30 detik, sehingga recompute dari data yang sudah di-downsample
-- tetap menghasilkan moving_seconds yang SAMA PERSIS (skor tidak rusak).
-- ============================================================================

ALTER TABLE `bbs_speed_telemetry`
  ADD COLUMN `moving_seconds` int(11) NOT NULL DEFAULT 30 AFTER `is_moving`;

-- Seed setting baru; INSERT IGNORE supaya tidak menimpa nilai user.
INSERT IGNORE INTO `bbs_settings` (`setting_key`, `setting_value`) VALUES
  ('speed.sample_interval_seconds', '180');

-- migrate:down

ALTER TABLE `bbs_speed_telemetry` DROP COLUMN `moving_seconds`;