-- Migration: Add Email_Log table
-- Date: 2026-02-15
-- Description: Create table for email logging and tracking

CREATE TABLE IF NOT EXISTS `Email_Log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `provider` ENUM('ethereal', 'resend', 'sendgrid', 'console') NOT NULL,
  `template` VARCHAR(50) DEFAULT NULL COMMENT 'Email template name, null if raw email',
  `to_email` VARCHAR(255) NOT NULL,
  `to_name` VARCHAR(255) DEFAULT NULL,
  `from_email` VARCHAR(255) NOT NULL,
  `from_name` VARCHAR(255) DEFAULT NULL,
  `subject` VARCHAR(500) NOT NULL,
  `status` ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
  `message_id` VARCHAR(255) DEFAULT NULL COMMENT 'Provider message ID',
  `error` TEXT DEFAULT NULL COMMENT 'Error message if failed',
  `retry_count` INT NOT NULL DEFAULT 0,
  `template_data` JSON DEFAULT NULL COMMENT 'Data used to render template',
  `metadata` JSON DEFAULT NULL COMMENT 'Additional context (userId, jobId, etc)',
  `preview_url` VARCHAR(500) DEFAULT NULL COMMENT 'Ethereal preview URL for dev',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_at` DATETIME DEFAULT NULL,

  INDEX `idx_to_email` (`to_email`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_template` (`template`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
