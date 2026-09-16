-- migrate:up

-- ============================================================================
-- Retensi data BBS — setting ADAS.
-- Semantik: 0 = NONAKTIF (tidak menghapus apa pun); >0 = hapus data lebih tua
-- dari N hari (begin_time untuk ADAS, creation_time/end_time/day untuk Speed).
-- INSERT IGNORE supaya tidak menimpa nilai yang sudah diubah admin.
-- ============================================================================

INSERT IGNORE INTO `bbs_settings` (`setting_key`, `setting_value`) VALUES
  ('adas.retention_days', '90');

-- migrate:down

DELETE FROM `bbs_settings` WHERE `setting_key` = 'adas.retention_days';