-- migrate:up
CREATE TABLE sales_cost_step_schedule (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  id_sales_cost        INT NOT NULL,
  id_area_route_step   INT NOT NULL,
  step_order_snapshot  INT NOT NULL,
  step_name_snapshot   VARCHAR(100) NOT NULL,
  estimated_arrival    DATETIME NOT NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_sc_step (id_sales_cost, id_area_route_step),
  INDEX idx_scss_sales_cost (id_sales_cost),
  FOREIGN KEY (id_sales_cost) REFERENCES sales_cost(id_sales_cost) ON DELETE CASCADE,
  FOREIGN KEY (id_area_route_step) REFERENCES area_route_step(id_area_route_step) ON DELETE CASCADE
);

-- migrate:down
DROP TABLE IF EXISTS sales_cost_step_schedule;
