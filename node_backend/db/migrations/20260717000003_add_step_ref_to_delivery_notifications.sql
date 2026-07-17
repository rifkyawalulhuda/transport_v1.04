-- migrate:up
ALTER TABLE delivery_notifications
  ADD COLUMN id_area_route_step INT NULL AFTER id_sales_cost,
  ADD COLUMN step_name          VARCHAR(100) NULL AFTER id_area_route_step;

-- migrate:down
ALTER TABLE delivery_notifications
  DROP COLUMN step_name,
  DROP COLUMN id_area_route_step;
