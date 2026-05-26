-- migrate:up
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'driver' AND column_name = 'is_active');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE driver ADD COLUMN is_active tinyint(1) NOT NULL DEFAULT 1 AFTER alamat', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- migrate:down
ALTER TABLE driver DROP COLUMN is_active;
