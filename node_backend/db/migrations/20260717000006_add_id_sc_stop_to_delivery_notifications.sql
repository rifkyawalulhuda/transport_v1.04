-- migrate:up
ALTER TABLE delivery_notifications
  ADD COLUMN id_sc_stop INT NULL AFTER id_area_route_step;

-- migrate:down
ALTER TABLE delivery_notifications
  DROP COLUMN id_sc_stop;
