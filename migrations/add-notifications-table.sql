-- Migration: Add Notifications table
-- Run this against the prodrones_application database

CREATE TABLE IF NOT EXISTS `Notifications` (
  `id`         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT          NOT NULL,
  `type`       VARCHAR(100) NOT NULL,
  `title`      VARCHAR(255) NOT NULL,
  `message`    TEXT         NULL,
  `link`       VARCHAR(500) NULL,
  `is_read`    TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notifications_user_id` (`user_id`),
  INDEX `idx_notifications_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
