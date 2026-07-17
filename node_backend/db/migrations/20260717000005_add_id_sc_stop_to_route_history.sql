-- migrate:up
ALTER TABLE sales_cost_route_history
  ADD COLUMN id_sc_stop INT NULL AFTER id_area_route_step,
  ADD INDEX idx_scrh_sc_stop (id_sc_stop);

-- migrate:down
ALTER TABLE sales_cost_route_history
  DROP INDEX idx_scrh_sc_stop,
  DROP COLUMN id_sc_stop;
