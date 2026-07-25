-- migrate:up
-- Allow NULL for Wialon GPS fields in route history.
-- These fields are only relevant for auto-triggered entries from Wialon geofence.
-- Manual check-ins (is_manual = 1) do not have GPS context and must be able to insert NULL.
ALTER TABLE sales_cost_route_history
  MODIFY COLUMN wialon_resource_id bigint(20)   NULL DEFAULT NULL,
  MODIFY COLUMN wialon_zone_id     bigint(20)   NULL DEFAULT NULL,
  MODIFY COLUMN wialon_zone_name   varchar(255) NULL DEFAULT NULL;

-- migrate:down
ALTER TABLE sales_cost_route_history
  MODIFY COLUMN wialon_resource_id bigint(20)   NOT NULL,
  MODIFY COLUMN wialon_zone_id     bigint(20)   NOT NULL,
  MODIFY COLUMN wialon_zone_name   varchar(255) NOT NULL;
