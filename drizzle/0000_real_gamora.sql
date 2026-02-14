CREATE TABLE `User_Meta` (
	`meta_id` int AUTO_INCREMENT NOT NULL,
	`uid` int NOT NULL DEFAULT 0,
	`meta_key` varchar(255) NOT NULL,
	`meta_value` text,
	CONSTRAINT `User_Meta_meta_id` PRIMARY KEY(`meta_id`),
	CONSTRAINT `uid` UNIQUE(`uid`,`meta_key`)
);
--> statement-breakpoint
CREATE TABLE `Users` (
	`ID` int AUTO_INCREMENT NOT NULL,
	`Email` varchar(255) NOT NULL,
	`Password` text,
	`Tokens` text,
	CONSTRAINT `Users_ID` PRIMARY KEY(`ID`),
	CONSTRAINT `Email_2` UNIQUE(`Email`)
);
--> statement-breakpoint
CREATE TABLE `Job_Deliverable` (
	`meta_id` int AUTO_INCREMENT NOT NULL,
	`job_product_id` varchar(255) NOT NULL,
	`meta_key` varchar(255) NOT NULL,
	`meta_value` longtext NOT NULL,
	CONSTRAINT `Job_Deliverable_meta_id` PRIMARY KEY(`meta_id`),
	CONSTRAINT `job_id_2` UNIQUE(`job_product_id`,`meta_key`)
);
--> statement-breakpoint
CREATE TABLE `Job_Meta` (
	`meta_id` int AUTO_INCREMENT NOT NULL,
	`job_id` int NOT NULL,
	`meta_key` varchar(255) NOT NULL,
	`meta_value` text NOT NULL,
	CONSTRAINT `Job_Meta_meta_id` PRIMARY KEY(`meta_id`),
	CONSTRAINT `job_id` UNIQUE(`job_id`,`meta_key`)
);
--> statement-breakpoint
CREATE TABLE `Jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pipeline` varchar(255),
	`createdBy` int NOT NULL,
	`name` varchar(255),
	`client` json,
	`client_id` varchar(255),
	`client_type` varchar(50),
	`dates` json NOT NULL,
	`siteId` int NOT NULL,
	`products` json NOT NULL,
	`recurring_occurrence_id` int,
	CONSTRAINT `Jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Sites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdBy` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`address` text,
	`coordinates` json NOT NULL,
	`boundary` json,
	CONSTRAINT `Sites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Organization` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `Organization_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Organization_Meta` (
	`meta_id` int AUTO_INCREMENT NOT NULL,
	`org_id` int NOT NULL,
	`meta_key` varchar(255) NOT NULL,
	`meta_value` text NOT NULL,
	CONSTRAINT `Organization_Meta_meta_id` PRIMARY KEY(`meta_id`),
	CONSTRAINT `org_id_2` UNIQUE(`org_id`,`meta_key`)
);
--> statement-breakpoint
CREATE TABLE `Products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`deliverable_template` varchar(255),
	`meta_defaults` json,
	`configuration` json,
	CONSTRAINT `Products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Tilesets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdBy` int,
	`published` tinyint DEFAULT 0,
	`name` varchar(255) NOT NULL,
	`description` text,
	`path` text NOT NULL,
	`attribution` json,
	`preset` varchar(255),
	`tileset_options` text,
	CONSTRAINT `Tilesets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Configuration` (
	`Application` varchar(255) NOT NULL DEFAULT '*',
	`Name` varchar(255) NOT NULL,
	`Value` text NOT NULL,
	CONSTRAINT `Configuration_Application_Name_pk` PRIMARY KEY(`Application`,`Name`)
);
--> statement-breakpoint
CREATE TABLE `Pages` (
	`PageID` int AUTO_INCREMENT NOT NULL,
	`Application` varchar(255) NOT NULL,
	`Page` varchar(255) NOT NULL,
	`Wrapper` varchar(255) NOT NULL DEFAULT 'standard',
	`Template` varchar(255),
	`Priority` float NOT NULL,
	`Hidden` tinyint NOT NULL DEFAULT 0,
	`Shareable` tinyint NOT NULL DEFAULT 0,
	`RoleAccess` json,
	`PermissionAccess` json,
	`Maintenance` json,
	`Design` json NOT NULL,
	`NavGroup` json,
	`Breadcrumbs` json,
	CONSTRAINT `Pages_PageID` PRIMARY KEY(`PageID`),
	CONSTRAINT `UniquePage` UNIQUE(`Application`,`Page`)
);
--> statement-breakpoint
CREATE TABLE `Templates` (
	`name` varchar(255) NOT NULL,
	`pageOverwrite` json,
	CONSTRAINT `Templates_name` PRIMARY KEY(`name`)
);
--> statement-breakpoint
CREATE TABLE `Permissions` (
	`name` varchar(50) NOT NULL,
	`category` varchar(50),
	`label` varchar(50),
	`description` varchar(255),
	`priority` float NOT NULL DEFAULT 3,
	`hidden` tinyint NOT NULL DEFAULT 0,
	`enforce` tinyint NOT NULL DEFAULT 1,
	`event_wl` json,
	`array_key_wl` json,
	`html_id_wl` json,
	`js_whitelist` json,
	CONSTRAINT `Permissions_name` PRIMARY KEY(`name`)
);
--> statement-breakpoint
CREATE TABLE `Requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` json,
	`user` json NOT NULL,
	`pageId` varchar(255) NOT NULL,
	`method` varchar(50) NOT NULL,
	`query` json,
	`altData` json,
	CONSTRAINT `Requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` json NOT NULL,
	`user` json NOT NULL,
	`pageId` int NOT NULL,
	`requestToken` varchar(350),
	CONSTRAINT `Shares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Logs` (
	`log_id` int AUTO_INCREMENT NOT NULL,
	`who` json NOT NULL,
	`action` varchar(50) NOT NULL,
	`affected_table` varchar(255) NOT NULL,
	`columns` json,
	CONSTRAINT `Logs_log_id` PRIMARY KEY(`log_id`)
);
--> statement-breakpoint
CREATE TABLE `Recurring_Job_Occurrences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`template_id` int NOT NULL,
	`occurrence_at` datetime NOT NULL,
	`status` enum('planned','created','skipped','cancelled') NOT NULL DEFAULT 'planned',
	`job_id` int,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Recurring_Job_Occurrences_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_template_occurrence` UNIQUE(`template_id`,`occurrence_at`)
);
--> statement-breakpoint
CREATE TABLE `Recurring_Job_Template_Attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`template_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`path` varchar(500) NOT NULL,
	`type` varchar(100),
	`size` bigint,
	CONSTRAINT `Recurring_Job_Template_Attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Recurring_Job_Templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`active` tinyint NOT NULL DEFAULT 1,
	`is_manual` tinyint NOT NULL DEFAULT 0,
	`name` varchar(255) NOT NULL,
	`site_id` int NOT NULL,
	`client_type` enum('user','organization') NOT NULL,
	`client_id` int NOT NULL,
	`rrule` text,
	`timezone` varchar(50) NOT NULL DEFAULT 'America/New_York',
	`dtstart` datetime,
	`dtend` datetime,
	`window_days` int NOT NULL DEFAULT 60,
	`last_generated_through` datetime,
	`amount_payable` decimal(10,2) NOT NULL DEFAULT '0.00',
	`notes` text,
	`products` json NOT NULL,
	`created_by` int NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Recurring_Job_Templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Delivery_Email_Items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`outbox_id` int NOT NULL,
	`job_id` int NOT NULL,
	`product_id` int NOT NULL,
	`product_name` varchar(255) NOT NULL,
	`delivery_type` enum('link','tileset','file','other') NOT NULL DEFAULT 'link',
	`delivery_content` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `Delivery_Email_Items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Delivery_Email_Outbox` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_type` enum('user','organization') NOT NULL,
	`client_id` int NOT NULL,
	`recipient_email` varchar(255) NOT NULL,
	`recipient_name` varchar(255),
	`send_after` datetime NOT NULL,
	`status` enum('pending','sending','sent','failed') NOT NULL DEFAULT 'pending',
	`error_message` text,
	`sent_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Delivery_Email_Outbox_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_batch_recipient` UNIQUE(`client_type`,`client_id`,`recipient_email`,`send_after`)
);
--> statement-breakpoint
CREATE TABLE `Bulk_Action_Log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action_type` enum('approve','flight_log','deliver','bill','delete') NOT NULL,
	`pipeline` varchar(50) NOT NULL,
	`job_ids` json NOT NULL,
	`job_count` int NOT NULL,
	`performed_by` int NOT NULL,
	`status` enum('started','completed','failed','partial') NOT NULL DEFAULT 'started',
	`error_details` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`completed_at` datetime,
	CONSTRAINT `Bulk_Action_Log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Upload_Chunk` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`chunk_index` int NOT NULL,
	`chunk_size` int NOT NULL,
	`checksum` varchar(64),
	`uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `Upload_Chunk_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Upload_Session` (
	`id` int AUTO_INCREMENT NOT NULL,
	`upload_id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_size` bigint NOT NULL,
	`mime_type` varchar(100),
	`chunk_size` int NOT NULL DEFAULT 5242880,
	`total_chunks` int NOT NULL,
	`uploaded_chunks` int NOT NULL DEFAULT 0,
	`status` enum('pending','uploading','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`temp_path` text,
	`final_path` text,
	`metadata` text,
	`error_message` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`completed_at` datetime,
	CONSTRAINT `Upload_Session_id` PRIMARY KEY(`id`),
	CONSTRAINT `Upload_Session_upload_id_unique` UNIQUE(`upload_id`)
);
