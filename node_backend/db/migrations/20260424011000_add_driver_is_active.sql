-- migrate:up
ALTER TABLE driver
  ADD COLUMN IF NOT EXISTS is_active tinyint(1) NOT NULL DEFAULT 1 AFTER alamat;

-- migrate:down
ALTER TABLE driver
  DROP COLUMN IF EXISTS is_active;
