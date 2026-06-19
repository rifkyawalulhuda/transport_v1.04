-- migrate:up
ALTER TABLE bbs_observations
  ADD COLUMN latitude DECIMAL(10,7) NULL AFTER location,
  ADD COLUMN longitude DECIMAL(10,7) NULL AFTER latitude;

ALTER TABLE bbs_observations MODIFY COLUMN location VARCHAR(500) NULL;

-- migrate:down
ALTER TABLE bbs_observations
  DROP COLUMN latitude,
  DROP COLUMN longitude;

ALTER TABLE bbs_observations MODIFY COLUMN location VARCHAR(100) NULL;
