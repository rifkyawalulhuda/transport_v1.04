-- migrate:up
ALTER TABLE truck
  ADD COLUMN IF NOT EXISTS is_active tinyint(1) NOT NULL DEFAULT 1 AFTER wialon_unit_id;

-- migrate:down
ALTER TABLE truck
  DROP COLUMN IF EXISTS is_active;
