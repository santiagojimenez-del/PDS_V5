-- ProDrones Application Database Schema
-- This file initializes the development database with the existing schema
-- DO NOT MODIFY THE SCHEMA - it matches the production database

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Users
CREATE TABLE IF NOT EXISTS `Users` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `Email` varchar(255) NOT NULL,
  `Password` text,
  `Tokens` json DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Email_2` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- User_Meta
CREATE TABLE IF NOT EXISTS `User_Meta` (
  `meta_id` int NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL DEFAULT '0',
  `meta_key` varchar(255) NOT NULL,
  `meta_value` text,
  PRIMARY KEY (`meta_id`),
  UNIQUE KEY `uid` (`uid`,`meta_key`),
  CONSTRAINT `User_Meta_ibfk_1` FOREIGN KEY (`uid`) REFERENCES `Users` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Jobs
CREATE TABLE IF NOT EXISTS `Jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pipeline` varchar(255) DEFAULT NULL,
  `createdBy` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `client` json DEFAULT NULL,
  `client_id` varchar(255) GENERATED ALWAYS AS (json_unquote(json_extract(`client`,_utf8mb4'$.id'))) STORED,
  `client_type` varchar(50) GENERATED ALWAYS AS (ifnull(json_unquote(json_extract(`client`,_utf8mb4'$.type')),NULL)) STORED,
  `dates` json NOT NULL,
  `siteId` int NOT NULL,
  `products` json NOT NULL,
  `recurring_occurrence_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_recurring_occurrence` (`recurring_occurrence_id`),
  KEY `idx_jobs_client_id` (`client_id`),
  KEY `idx_jobs_client_type` (`client_type`),
  KEY `siteId` (`siteId`),
  KEY `IDX_Jobs_pipeline` (`pipeline`),
  CONSTRAINT `Jobs_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `Users` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Job_Meta
CREATE TABLE IF NOT EXISTS `Job_Meta` (
  `meta_id` int NOT NULL AUTO_INCREMENT,
  `job_id` int NOT NULL,
  `meta_key` varchar(255) NOT NULL,
  `meta_value` text NOT NULL,
  PRIMARY KEY (`meta_id`),
  UNIQUE KEY `job_id` (`job_id`,`meta_key`),
  CONSTRAINT `Job_Meta_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `Jobs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Job_Deliverable
CREATE TABLE IF NOT EXISTS `Job_Deliverable` (
  `meta_id` int NOT NULL AUTO_INCREMENT,
  `job_product_id` varchar(255) NOT NULL,
  `meta_key` varchar(255) NOT NULL,
  `meta_value` longtext NOT NULL,
  PRIMARY KEY (`meta_id`),
  UNIQUE KEY `job_id_2` (`job_product_id`,`meta_key`),
  KEY `job_id` (`job_product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Sites
CREATE TABLE IF NOT EXISTS `Sites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `createdBy` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `address` text,
  `coordinates` json NOT NULL,
  `boundary` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Organization
CREATE TABLE IF NOT EXISTS `Organization` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Organization_Meta
CREATE TABLE IF NOT EXISTS `Organization_Meta` (
  `meta_id` int NOT NULL AUTO_INCREMENT,
  `org_id` int NOT NULL,
  `meta_key` varchar(255) NOT NULL,
  `meta_value` text NOT NULL,
  PRIMARY KEY (`meta_id`),
  UNIQUE KEY `org_id_2` (`org_id`,`meta_key`),
  CONSTRAINT `Organization_Meta_ibfk_1` FOREIGN KEY (`org_id`) REFERENCES `Organization` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Products
CREATE TABLE IF NOT EXISTS `Products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `deliverable_template` varchar(255) DEFAULT NULL,
  `meta_defaults` json DEFAULT NULL,
  `configuration` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Tilesets
CREATE TABLE IF NOT EXISTS `Tilesets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `createdBy` int DEFAULT NULL,
  `published` tinyint(1) DEFAULT '0',
  `name` varchar(255) NOT NULL,
  `description` text,
  `path` text NOT NULL,
  `attribution` json DEFAULT NULL,
  `preset` varchar(255) DEFAULT NULL,
  `tileset_options` text,
  PRIMARY KEY (`id`),
  CONSTRAINT `Tilesets_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `Users` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Configuration
CREATE TABLE IF NOT EXISTS `Configuration` (
  `Application` varchar(255) NOT NULL DEFAULT '',
  `Name` varchar(255) NOT NULL,
  `Value` text NOT NULL,
  PRIMARY KEY (`Application`,`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Pages
CREATE TABLE IF NOT EXISTS `Pages` (
  `PageID` int NOT NULL AUTO_INCREMENT,
  `Application` varchar(255) NOT NULL,
  `Page` varchar(255) NOT NULL,
  `Wrapper` varchar(255) NOT NULL DEFAULT 'standard',
  `Template` varchar(255) DEFAULT NULL,
  `Priority` float NOT NULL,
  `Hidden` tinyint NOT NULL DEFAULT '0',
  `Shareable` tinyint(1) NOT NULL DEFAULT '0',
  `RoleAccess` json DEFAULT NULL,
  `PermissionAccess` json DEFAULT NULL,
  `Maintenance` json DEFAULT NULL,
  `Design` json NOT NULL,
  `NavGroup` json DEFAULT NULL,
  `Breadcrumbs` json DEFAULT NULL,
  PRIMARY KEY (`PageID`),
  UNIQUE KEY `UniquePage` (`Application`,`Page`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Templates
CREATE TABLE IF NOT EXISTS `Templates` (
  `name` varchar(255) NOT NULL,
  `pageOverwrite` json DEFAULT NULL,
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Permissions
CREATE TABLE IF NOT EXISTS `Permissions` (
  `name` varchar(50) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `label` varchar(50) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `priority` float NOT NULL DEFAULT '3',
  `hidden` tinyint NOT NULL DEFAULT '0',
  `enforce` tinyint(1) NOT NULL DEFAULT '1',
  `event_wl` json DEFAULT NULL,
  `array_key_wl` json DEFAULT NULL,
  `html_id_wl` json DEFAULT NULL,
  `js_whitelist` json DEFAULT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Requests
CREATE TABLE IF NOT EXISTS `Requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `token` json DEFAULT NULL,
  `user` json NOT NULL,
  `pageId` varchar(255) NOT NULL,
  `method` set('GET','POST','DELETE') NOT NULL,
  `query` json DEFAULT NULL,
  `altData` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Shares
CREATE TABLE IF NOT EXISTS `Shares` (
  `id` int NOT NULL AUTO_INCREMENT,
  `token` json NOT NULL,
  `user` json NOT NULL,
  `pageId` int NOT NULL,
  `requestToken` varchar(350) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `Shares_ibfk_1` FOREIGN KEY (`pageId`) REFERENCES `Pages` (`PageID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Logs
CREATE TABLE IF NOT EXISTS `Logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `who` json NOT NULL,
  `action` set('CREATE','CHANGE','DELETE') NOT NULL,
  `affected_table` varchar(255) NOT NULL,
  `columns` json DEFAULT NULL,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Recurring_Job_Templates
CREATE TABLE IF NOT EXISTS `Recurring_Job_Templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `is_manual` tinyint(1) NOT NULL DEFAULT '0',
  `name` varchar(255) NOT NULL,
  `site_id` int NOT NULL,
  `client_type` enum('user','organization') NOT NULL,
  `client_id` int NOT NULL,
  `rrule` text,
  `timezone` varchar(50) NOT NULL DEFAULT 'America/New_York',
  `dtstart` datetime DEFAULT NULL,
  `dtend` datetime DEFAULT NULL,
  `window_days` int NOT NULL DEFAULT '60',
  `last_generated_through` datetime DEFAULT NULL,
  `amount_payable` decimal(10,2) NOT NULL DEFAULT '0.00',
  `notes` text,
  `products` json NOT NULL,
  `created_by` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Recurring_Job_Occurrences
CREATE TABLE IF NOT EXISTS `Recurring_Job_Occurrences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `template_id` int NOT NULL,
  `occurrence_at` datetime NOT NULL,
  `status` enum('planned','created','skipped','cancelled') NOT NULL DEFAULT 'planned',
  `job_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_template_occurrence` (`template_id`,`occurrence_at`),
  CONSTRAINT `Recurring_Job_Occurrences_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `Recurring_Job_Templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Delivery_Email_Outbox
CREATE TABLE IF NOT EXISTS `Delivery_Email_Outbox` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_type` enum('user','organization') NOT NULL,
  `client_id` int NOT NULL,
  `recipient_email` varchar(255) NOT NULL,
  `recipient_name` varchar(255) DEFAULT NULL,
  `send_after` datetime NOT NULL,
  `status` enum('pending','sending','sent','failed') NOT NULL DEFAULT 'pending',
  `error_message` text,
  `sent_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_batch_recipient` (`client_type`,`client_id`,`recipient_email`,`send_after`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Delivery_Email_Items
CREATE TABLE IF NOT EXISTS `Delivery_Email_Items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `outbox_id` int NOT NULL,
  `job_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `delivery_type` enum('link','tileset','file','other') NOT NULL DEFAULT 'link',
  `delivery_content` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `Delivery_Email_Items_ibfk_1` FOREIGN KEY (`outbox_id`) REFERENCES `Delivery_Email_Outbox` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bulk_Action_Log
CREATE TABLE IF NOT EXISTS `Bulk_Action_Log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_type` enum('approve','flight_log','deliver','bill','delete') NOT NULL,
  `pipeline` varchar(50) NOT NULL,
  `job_ids` json NOT NULL,
  `job_count` int NOT NULL,
  `performed_by` int NOT NULL,
  `status` enum('started','completed','failed','partial') NOT NULL DEFAULT 'started',
  `error_details` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- Stored Procedure: update_job_pipeline
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `update_job_pipeline`(IN p_job_id INT)
BEGIN
    DECLARE v_pipeline VARCHAR(50) DEFAULT 'bids';
    DECLARE v_dates JSON;
    DECLARE v_has_approved_flight BOOLEAN DEFAULT FALSE;
    DECLARE v_has_scheduled_flight BOOLEAN DEFAULT FALSE;
    DECLARE v_has_persons_assigned BOOLEAN DEFAULT FALSE;
    DECLARE v_has_flight_log BOOLEAN DEFAULT FALSE;
    DECLARE v_has_invoice_number BOOLEAN DEFAULT FALSE;
    DECLARE v_has_invoice_paid BOOLEAN DEFAULT FALSE;

    SELECT dates INTO v_dates FROM Jobs WHERE id = p_job_id;

    SELECT
        MAX(CASE WHEN meta_key = 'approved_flight' AND meta_value IS NOT NULL AND meta_value != '' THEN TRUE ELSE FALSE END),
        MAX(CASE WHEN meta_key = 'scheduled_flight' AND meta_value IS NOT NULL AND meta_value != '' THEN TRUE ELSE FALSE END),
        MAX(CASE WHEN meta_key = 'persons_assigned' AND meta_value IS NOT NULL AND meta_value != '' AND meta_value != '[]' THEN TRUE ELSE FALSE END),
        MAX(CASE WHEN meta_key = 'flight_log' AND meta_value IS NOT NULL AND meta_value != '' THEN TRUE ELSE FALSE END),
        MAX(CASE WHEN meta_key = 'invoice_number' AND meta_value IS NOT NULL AND meta_value != '' THEN TRUE ELSE FALSE END),
        MAX(CASE WHEN meta_key = 'invoice_paid' AND meta_value IS NOT NULL AND meta_value != '' AND meta_value != '0' THEN TRUE ELSE FALSE END)
    INTO v_has_approved_flight, v_has_scheduled_flight, v_has_persons_assigned,
         v_has_flight_log, v_has_invoice_number, v_has_invoice_paid
    FROM Job_Meta WHERE job_id = p_job_id;

    IF JSON_EXTRACT(v_dates, '$.billed') IS NOT NULL
       AND v_has_invoice_number AND v_has_invoice_paid THEN
        SET v_pipeline = 'completed';
    ELSEIF JSON_EXTRACT(v_dates, '$.delivered') IS NOT NULL THEN
        SET v_pipeline = 'bill';
    ELSEIF JSON_EXTRACT(v_dates, '$.logged') IS NOT NULL
           AND v_has_flight_log THEN
        SET v_pipeline = 'processing-deliver';
    ELSEIF JSON_EXTRACT(v_dates, '$.scheduled') IS NOT NULL
           AND v_has_approved_flight AND v_has_scheduled_flight
           AND v_has_persons_assigned THEN
        SET v_pipeline = 'scheduled';
    ELSE
        SET v_pipeline = 'bids';
    END IF;

    UPDATE Jobs SET pipeline = v_pipeline WHERE id = p_job_id;
END //
DELIMITER ;
