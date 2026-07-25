-- migrate:up
ALTER TABLE truck
  ADD COLUMN last_lat       DOUBLE        NULL DEFAULT NULL,
  ADD COLUMN last_lng       DOUBLE        NULL DEFAULT NULL,
  ADD COLUMN last_address   VARCHAR(255)  NULL DEFAULT NULL,
  ADD COLUMN last_gps_time  DATETIME      NULL DEFAULT NULL;

-- migrate:down
ALTER TABLE truck
  DROP COLUMN last_lat,
  DROP COLUMN last_lng,
  DROP COLUMN last_address,
  DROP COLUMN last_gps_time;


