-- migrate:up
CREATE TABLE delivery_notifications (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  id_sales_cost     INT NOT NULL,
  notification_type ENUM('arrival_overdue') NOT NULL DEFAULT 'arrival_overdue',
  truck_plate       VARCHAR(20) NOT NULL,
  route_name        VARCHAR(255) NOT NULL,
  scheduled_arrival DATETIME NOT NULL,
  message           TEXT NOT NULL,
  is_read           TINYINT(1) NOT NULL DEFAULT 0,
  is_dismissed      TINYINT(1) NOT NULL DEFAULT 0,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at           DATETIME NULL,
  FOREIGN KEY (id_sales_cost) REFERENCES sales_cost(id_sales_cost) ON DELETE CASCADE,
  INDEX idx_dn_unread (is_read, is_dismissed),
  INDEX idx_dn_sales_cost (id_sales_cost)
);

-- migrate:down
DROP TABLE IF EXISTS delivery_notifications;
