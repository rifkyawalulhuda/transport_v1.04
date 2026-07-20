-- migrate:up
-- Per-user read/dismiss tracking for delivery notifications.
-- Replaces the shared is_read/is_dismissed columns on delivery_notifications
-- with a per-user join table, so User A marking a notification read does not
-- affect User B's view of the same notification.
CREATE TABLE IF NOT EXISTS delivery_notification_read (
  id                          INT AUTO_INCREMENT PRIMARY KEY,
  id_delivery_notification    INT NOT NULL,
  id_admin                    INT NOT NULL,
  read_at                     DATETIME NULL DEFAULT NULL,
  dismissed_at                DATETIME NULL DEFAULT NULL,
  UNIQUE KEY uq_dn_read_admin (id_delivery_notification, id_admin),
  INDEX idx_dn_read_admin     (id_admin),
  INDEX idx_dn_read_notif     (id_delivery_notification)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- migrate:down
DROP TABLE IF EXISTS delivery_notification_read;
