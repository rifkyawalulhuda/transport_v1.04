-- migrate:up
ALTER TABLE sales_cost
  ADD COLUMN is_manual_mode TINYINT(1) NOT NULL DEFAULT 0
  COMMENT '1 = SPK without GPS geofence tracking; ETA drives auto hits'
  AFTER finish_order_datetime;

-- migrate:down
ALTER TABLE sales_cost DROP COLUMN is_manual_mode;
