-- Migration: Add Upload System Tables
-- Date: 2026-02-12
-- Description: Creates tables for chunked file upload system

-- ============================================================================
-- Upload_Session Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `Upload_Session` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `upload_id` VARCHAR(255) NOT NULL UNIQUE,
  `user_id` INT NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_size` BIGINT NOT NULL,
  `mime_type` VARCHAR(100),
  `chunk_size` INT NOT NULL DEFAULT 5242880,
  `total_chunks` INT NOT NULL,
  `uploaded_chunks` INT NOT NULL DEFAULT 0,
  `status` ENUM('pending', 'uploading', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  `temp_path` TEXT,
  `final_path` TEXT,
  `metadata` TEXT,
  `error_message` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` DATETIME,
  
  INDEX `idx_upload_id` (`upload_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Upload_Chunk Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS `Upload_Chunk` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `chunk_index` INT NOT NULL,
  `chunk_size` INT NOT NULL,
  `checksum` VARCHAR(64),
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_session_id` (`session_id`),
  INDEX `idx_chunk_index` (`chunk_index`),
  UNIQUE KEY `unique_session_chunk` (`session_id`, `chunk_index`),
  
  CONSTRAINT `fk_upload_chunk_session`
    FOREIGN KEY (`session_id`)
    REFERENCES `Upload_Session` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check if tables were created
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('Upload_Session', 'Upload_Chunk');

-- Show table structures
DESCRIBE Upload_Session;
DESCRIBE Upload_Chunk;
