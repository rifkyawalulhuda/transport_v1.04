-- migrate:up
ALTER TABLE `area_route_step`
  ADD CONSTRAINT `fk_area_route_step_area`
  FOREIGN KEY (`id_area`) REFERENCES `area` (`id_area`)
  ON DELETE CASCADE;

ALTER TABLE `sales_cost_route_history`
  ADD CONSTRAINT `fk_sales_cost_route_history_sales_cost`
  FOREIGN KEY (`id_sales_cost`) REFERENCES `sales_cost` (`id_sales_cost`)
  ON DELETE CASCADE;

ALTER TABLE `sales_cost_route_history`
  ADD CONSTRAINT `fk_sales_cost_route_history_area`
  FOREIGN KEY (`id_area`) REFERENCES `area` (`id_area`)
  ON DELETE CASCADE;

ALTER TABLE `sales_cost_route_history`
  ADD CONSTRAINT `fk_sales_cost_route_history_step`
  FOREIGN KEY (`id_area_route_step`) REFERENCES `area_route_step` (`id_area_route_step`)
  ON DELETE CASCADE;

-- migrate:down
ALTER TABLE `sales_cost_route_history`
  DROP FOREIGN KEY `fk_sales_cost_route_history_step`;

ALTER TABLE `sales_cost_route_history`
  DROP FOREIGN KEY `fk_sales_cost_route_history_area`;

ALTER TABLE `sales_cost_route_history`
  DROP FOREIGN KEY `fk_sales_cost_route_history_sales_cost`;

ALTER TABLE `area_route_step`
  DROP FOREIGN KEY `fk_area_route_step_area`;
