-- migrate:up
CREATE TABLE IF NOT EXISTS sub_contractor_step_schedule (
  id INT NOT NULL AUTO_INCREMENT,
  id_subcontractor INT NOT NULL,
  stop_order INT NOT NULL DEFAULT 0,
  stop_name VARCHAR(100) NOT NULL DEFAULT '',
  is_departure TINYINT(1) NOT NULL DEFAULT 0,
  is_finish TINYINT(1) NOT NULL DEFAULT 0,
  estimated_arrival DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_subc_stop_order (id_subcontractor, stop_order),
  KEY idx_subc_scss_sc (id_subcontractor),
  CONSTRAINT fk_subc_scss_subcontractor
    FOREIGN KEY (id_subcontractor) REFERENCES sub_contractor (id_subcontractor)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- migrate:down
DROP TABLE IF EXISTS sub_contractor_step_schedule;
