-- migrate:up
ALTER TABLE sales_cost
  CHANGE COLUMN delivery_order  departure_datetime    DATETIME NOT NULL,
  CHANGE COLUMN arrival_order   arrival_datetime      DATETIME NULL,
  CHANGE COLUMN finish_order    finish_order_datetime DATETIME NULL;

-- migrate:down
ALTER TABLE sales_cost
  CHANGE COLUMN departure_datetime    delivery_order  DATE NOT NULL,
  CHANGE COLUMN arrival_datetime      arrival_order   DATE NULL,
  CHANGE COLUMN finish_order_datetime finish_order    DATE NULL;
