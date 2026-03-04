-- MySQL dump 10.13  Distrib 8.4.6, for Win64 (x86_64)
--
-- Host: mysql-2c044fc4-prodrones-ed0cv5.a.aivencloud.com    Database: defaultdb
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

-- GTID lines removed for local import compatibility

--
-- Dumping data for table `Pages`
--

LOCK TABLES `Pages` WRITE;
/*!40000 ALTER TABLE `Pages` DISABLE KEYS */;
INSERT INTO `Pages` (`PageID`, `Application`, `Page`, `Wrapper`, `Template`, `Priority`, `Hidden`, `Shareable`, `RoleAccess`, `PermissionAccess`, `Maintenance`, `Design`, `NavGroup`, `Breadcrumbs`) VALUES (1,'hub','','standard',NULL,1,0,0,NULL,NULL,NULL,'{\"icon\": \"<i class=\\\"ti ti-home\\\"></i>\", \"title\": \"Home\"}',NULL,NULL),(2,'hub','workflow/jobs','standard',NULL,2,0,0,NULL,NULL,NULL,'{\"icon\": \"<i class=\\\"ti ti-briefcase\\\"></i>\", \"title\": \"Job Dashboard\"}','{\"group\": \"Workflow\"}',NULL),(3,'hub','workflow/jobs/new','standard',NULL,3,1,0,NULL,NULL,NULL,'{\"icon\": \"<i class=\\\"ti ti-plus\\\"></i>\", \"title\": \"New Job\"}','{\"group\": \"Workflow\"}',NULL),(4,'hub','workflow/recurring','standard',NULL,4,0,0,NULL,NULL,NULL,'{\"icon\": \"<i class=\\\"ti ti-repeat\\\"></i>\", \"title\": \"Recurring Jobs\"}','{\"group\": \"Workflow\"}',NULL),(5,'hub','workflow/sites','standard',NULL,5,0,0,NULL,'[\"create_project_site\"]',NULL,'{\"icon\": \"<i class=\\\"ti ti-map-pin\\\"></i>\", \"title\": \"Manage Sites\"}','{\"group\": \"Workflow\"}',NULL),(6,'hub','tilesets','standard',NULL,6,0,0,NULL,'[\"create_tileset\"]',NULL,'{\"icon\": \"<i class=\\\"ti ti-layers-intersect\\\"></i>\", \"title\": \"View All Tilesets\"}','{\"group\": \"Mapping & Layers\", \"dropdown\": {\"icon\": \"<i class=\\\"ti ti-map\\\"></i>\", \"title\": \"Tilesets\"}}',NULL),(7,'hub','tilesets/manage','standard',NULL,7,1,0,NULL,'[\"create_tileset\"]',NULL,'{\"icon\": \"<i class=\\\"ti ti-upload\\\"></i>\", \"title\": \"Create Tileset\"}','{\"group\": \"Mapping & Layers\", \"dropdown\": {\"icon\": \"<i class=\\\"ti ti-map\\\"></i>\", \"title\": \"Tilesets\"}}',NULL),(8,'hub','onboard/contact','standard',NULL,8,0,0,NULL,NULL,NULL,'{\"icon\": \"<i class=\\\"ti ti-user-plus\\\"></i>\", \"title\": \"Add Contact\"}','{\"group\": \"Onboarding\", \"dropdown\": {\"icon\": \"<i class=\\\"ti ti-user-plus\\\"></i>\", \"title\": \"Contact\"}}',NULL),(9,'hub','onboard/company','standard',NULL,9,0,0,NULL,'[\"onboard_company\"]',NULL,'{\"icon\": \"<i class=\\\"ti ti-building\\\"></i>\", \"title\": \"Add Company\"}','{\"group\": \"Onboarding\", \"dropdown\": {\"icon\": \"<i class=\\\"ti ti-building\\\"></i>\", \"title\": \"Company\"}}',NULL),(10,'hub','onboard/company/manage','standard',NULL,10,0,0,NULL,'[\"manage_company\"]',NULL,'{\"icon\": \"<i class=\\\"ti ti-settings\\\"></i>\", \"title\": \"Manage Companies\"}','{\"group\": \"Onboarding\", \"dropdown\": {\"icon\": \"<i class=\\\"ti ti-building\\\"></i>\", \"title\": \"Company\"}}',NULL),(11,'hub','onboard/contact/manage','standard',NULL,11,0,0,NULL,'[\"manage_company\"]',NULL,'{\"icon\": \"<i class=\\\"ti ti-address-book\\\"></i>\", \"title\": \"Manage Contacts\"}','{\"group\": \"Onboarding\", \"dropdown\": {\"icon\": \"<i class=\\\"ti ti-user-plus\\\"></i>\", \"title\": \"Contact\"}}',NULL),(12,'client','','standard',NULL,1,0,0,NULL,NULL,NULL,'{\"icon\": \"<i class=\\\"ti ti-home\\\"></i>\", \"title\": \"Home\"}',NULL,NULL),(13,'client','sites','standard',NULL,2,0,0,NULL,NULL,NULL,'{\"icon\": \"<i class=\\\"ti ti-map\\\"></i>\", \"title\": \"Project List\"}','{\"group\": \"Projects\"}',NULL),(14,'client','site','standard',NULL,3,1,0,NULL,NULL,NULL,'{\"icon\": \"<i class=\\\"ti ti-map-pin\\\"></i>\", \"title\": \"Site Details\"}','{\"group\": \"Projects\"}',NULL),(15,'client','job','standard',NULL,4,1,0,NULL,'[\"view_all_jobs\"]',NULL,'{\"icon\": \"<i class=\\\"ti ti-briefcase\\\"></i>\", \"title\": \"View Project\"}','{\"group\": \"Projects\"}',NULL),(16,'client','job/product','standard',NULL,5,1,1,NULL,'[\"view_all_jobs\"]',NULL,'{\"icon\": \"<i class=\\\"ti ti-package\\\"></i>\", \"title\": \"View Product\"}',NULL,NULL),(17,'admin','','standard',NULL,1,0,0,NULL,NULL,NULL,'{\"icon\": \"<i class=\\\"ti ti-dashboard\\\"></i>\", \"title\": \"Dashboard\"}',NULL,NULL),(18,'admin','users/search','standard',NULL,2,0,0,NULL,NULL,NULL,'{\"icon\": \"<i class=\\\"ti ti-search\\\"></i>\", \"title\": \"User Search\"}','{\"group\": \"Users\"}',NULL),(19,'admin','users/view','standard',NULL,3,1,0,NULL,NULL,NULL,'{\"icon\": \"<i class=\\\"ti ti-user\\\"></i>\", \"title\": \"View User\"}','{\"group\": \"Users\"}',NULL),(20,'admin','users/roles','standard',NULL,4,0,0,NULL,'[\"view_roles_and_permissions\"]',NULL,'{\"icon\": \"<i class=\\\"ti ti-shield\\\"></i>\", \"title\": \"Roles & Permissions\"}','{\"group\": \"Users\"}',NULL),(21,'admin','developer/active-visitors','standard',NULL,5,0,0,NULL,'[\"developer_tools\"]',NULL,'{\"icon\": \"<i class=\\\"ti ti-activity\\\"></i>\", \"title\": \"Active Connections\"}','{\"group\": \"Developer Tools\"}',NULL),(22,'*','login','blank','login',1,0,0,'[\"*\"]',NULL,NULL,'{\"icon\": \"\", \"title\": \"Login\"}',NULL,NULL),(23,'*','register','blank','register',2,0,0,'[\"*\"]',NULL,NULL,'{\"icon\": \"\", \"title\": \"Register\"}',NULL,NULL),(24,'hub','scheduling/my-schedule','standard',NULL,5.5,0,0,'[0, 5, 6, 7]',NULL,NULL,'{\"icon\": \"<i class=\\\"ti ti-calendar-user\\\"></i>\", \"title\": \"My Schedule\"}','{\"group\": \"Scheduling\"}',NULL),(25,'viewer','landscape','standard','ls_viewer',100,0,1,'[\"*\"]',NULL,NULL,'{}',NULL,NULL),(26,'viewer','community','standard','cm_viewer',101,0,1,'[\"*\"]',NULL,NULL,'{}',NULL,NULL),(27,'viewer','construct','standard','ct_viewer',102,0,1,'[\"*\"]',NULL,NULL,'{}',NULL,NULL);
/*!40000 ALTER TABLE `Pages` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 17:36:20
