-- migrate:up
ALTER TABLE bbs_incidents
  ADD COLUMN latitude DECIMAL(10,7) NULL AFTER location,
  ADD COLUMN longitude DECIMAL(10,7) NULL AFTER latitude;

-- migrate:down
ALTER TABLE bbs_incidents
  DROP COLUMN latitude,
  DROP COLUMN longitude;
