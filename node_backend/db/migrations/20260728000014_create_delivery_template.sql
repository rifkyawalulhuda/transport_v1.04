-- migrate:up
CREATE TABLE delivery_template (
  id            INT          NOT NULL AUTO_INCREMENT,
  template_name VARCHAR(255) NOT NULL,
  description   VARCHAR(500) NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE delivery_template_stop (
  id                    INT          NOT NULL AUTO_INCREMENT,
  id_delivery_template  INT          NOT NULL,
  stop_order            INT          NOT NULL,
  stop_name             VARCHAR(255) NOT NULL,
  wialon_resource_id    BIGINT       NULL,
  wialon_zone_id        BIGINT       NULL,
  wialon_zone_name      VARCHAR(255) NULL,
  is_departure          TINYINT(1)   NOT NULL DEFAULT 0,
  is_finish             TINYINT(1)   NOT NULL DEFAULT 0,
  time_hhmm             VARCHAR(5)   NULL COMMENT 'Fixed time e.g. 07:00. Combined with user-supplied date when applying template.',
  PRIMARY KEY (id),
  UNIQUE KEY uq_template_stop (id_delivery_template, stop_order),
  CONSTRAINT fk_dts_template FOREIGN KEY (id_delivery_template)
    REFERENCES delivery_template (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- migrate:down
DROP TABLE IF EXISTS delivery_template_stop;
DROP TABLE IF EXISTS delivery_template;
