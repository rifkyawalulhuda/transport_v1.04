-- migrate:up
ALTER TABLE sales_cost_route_history
  ADD COLUMN is_manual TINYINT(1) NOT NULL DEFAULT 0 AFTER recorded_at;

-- migrate:down
ALTER TABLE sales_cost_route_history
  DROP COLUMN is_manual;
