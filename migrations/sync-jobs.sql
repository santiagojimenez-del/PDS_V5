-- MySQL dump 10.13  Distrib 8.4.6, for Win64 (x86_64)
--
-- Host: localhost    Database: prodrones_application
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

--
-- Dumping data for table `Jobs`
--
-- WHERE:  id >= 16

LOCK TABLES `Jobs` WRITE;
/*!40000 ALTER TABLE `Jobs` DISABLE KEYS */;
INSERT INTO `Jobs` (`id`, `pipeline`, `createdBy`, `name`, `client`, `dates`, `siteId`, `products`, `recurring_occurrence_id`) VALUES (16,'bids',1,'Downtown Office Q1 Survey','{\"id\": 1, \"type\": \"organization\"}','{\"created\": \"2026-03-03T09:00:00.000Z\"}',1,'[7, 4]',NULL),(17,'bids',1,'Oceanfront Property Shoot','{\"id\": 5, \"type\": \"organization\"}','{\"created\": \"2026-03-10T10:00:00.000Z\"}',5,'[4, 1]',NULL),(18,'bids',1,'HOA Spring Inspection','{\"id\": 2, \"type\": \"organization\"}','{\"created\": \"2026-03-18T14:00:00.000Z\"}',2,'[2, 5]',NULL),(19,'bids',1,'Orlando Park Progress Doc','{\"id\": 3, \"type\": \"organization\"}','{\"created\": \"2026-04-02T09:30:00.000Z\"}',6,'[6, 8]',NULL),(20,'bids',1,'Santa Monica Pier Assessment','{\"id\": 4, \"type\": \"organization\"}','{\"created\": \"2026-04-14T11:00:00.000Z\"}',7,'[7, 5]',NULL),(21,'scheduled',1,'Tampa Riverwalk Phase 2','{\"id\": 3, \"type\": \"organization\"}','{\"created\": \"2026-02-20T10:00:00.000Z\", \"scheduled\": \"2026-03-05T08:00:00.000Z\"}',3,'[3, 6]',NULL),(22,'scheduled',1,'Everglades Zone B Mapping','{\"id\": 4, \"type\": \"organization\"}','{\"created\": \"2026-02-25T09:00:00.000Z\", \"scheduled\": \"2026-03-12T07:30:00.000Z\"}',4,'[7, 8]',NULL),(23,'scheduled',1,'Palm Beach Roof Survey','{\"id\": 5, \"type\": \"organization\"}','{\"created\": \"2026-03-01T10:00:00.000Z\", \"scheduled\": \"2026-03-22T09:00:00.000Z\"}',5,'[5]',NULL),(24,'scheduled',1,'Downtown Miami 3D Capture','{\"id\": 1, \"type\": \"organization\"}','{\"created\": \"2026-03-08T10:00:00.000Z\", \"scheduled\": \"2026-04-08T08:00:00.000Z\"}',1,'[8, 7]',NULL),(25,'scheduled',1,'Sunrise HOA Community Tour','{\"id\": 2, \"type\": \"organization\"}','{\"created\": \"2026-03-15T09:00:00.000Z\", \"scheduled\": \"2026-04-18T07:00:00.000Z\"}',2,'[2, 4]',NULL),(26,'processing-deliver',1,'Tampa Construction Update','{\"id\": 3, \"type\": \"organization\"}','{\"flown\": \"2026-03-01T09:30:00.000Z\", \"logged\": \"2026-03-01T11:00:00.000Z\", \"created\": \"2026-02-10T10:00:00.000Z\", \"scheduled\": \"2026-03-01T08:00:00.000Z\"}',3,'[3, 6]',NULL),(27,'processing-deliver',1,'Everglades Aerial Ortho','{\"id\": 4, \"type\": \"organization\"}','{\"flown\": \"2026-03-07T08:15:00.000Z\", \"logged\": \"2026-03-07T12:00:00.000Z\", \"created\": \"2026-02-14T09:00:00.000Z\", \"scheduled\": \"2026-03-07T07:00:00.000Z\"}',4,'[7]',NULL),(28,'processing-deliver',1,'Orlando Theme Park Video','{\"id\": 3, \"type\": \"organization\"}','{\"flown\": \"2026-03-20T09:00:00.000Z\", \"logged\": \"2026-03-20T14:00:00.000Z\", \"created\": \"2026-02-18T10:00:00.000Z\", \"scheduled\": \"2026-03-20T08:00:00.000Z\"}',6,'[6, 4]',NULL),(29,'processing-deliver',1,'Coastal Office Orthomosaic','{\"id\": 1, \"type\": \"organization\"}','{\"flown\": \"2026-04-03T09:00:00.000Z\", \"logged\": \"2026-04-03T13:00:00.000Z\", \"created\": \"2026-03-05T09:00:00.000Z\", \"scheduled\": \"2026-04-03T07:30:00.000Z\"}',1,'[7, 8]',NULL),(30,'processing-deliver',1,'Santa Monica 3D Survey','{\"id\": 4, \"type\": \"organization\"}','{\"flown\": \"2026-04-10T09:30:00.000Z\", \"logged\": \"2026-04-10T14:30:00.000Z\", \"created\": \"2026-03-10T10:00:00.000Z\", \"scheduled\": \"2026-04-10T08:00:00.000Z\"}',7,'[8, 5]',NULL),(31,'bill',1,'Palm Beach Landscape View','{\"id\": 5, \"type\": \"organization\"}','{\"flown\": \"2026-02-10T09:00:00.000Z\", \"logged\": \"2026-02-10T14:00:00.000Z\", \"created\": \"2026-01-20T10:00:00.000Z\", \"delivered\": \"2026-03-02T10:00:00.000Z\", \"scheduled\": \"2026-02-10T08:00:00.000Z\"}',5,'[1, 4]',NULL),(32,'bill',1,'Sunrise HOA Annual Review','{\"id\": 2, \"type\": \"organization\"}','{\"flown\": \"2026-02-15T09:30:00.000Z\", \"logged\": \"2026-02-15T13:00:00.000Z\", \"created\": \"2026-01-25T09:00:00.000Z\", \"delivered\": \"2026-03-08T10:00:00.000Z\", \"scheduled\": \"2026-02-15T08:00:00.000Z\"}',2,'[2, 5]',NULL),(33,'bill',1,'Tampa Roof Inspection Set','{\"id\": 3, \"type\": \"organization\"}','{\"flown\": \"2026-02-28T10:00:00.000Z\", \"logged\": \"2026-02-28T15:00:00.000Z\", \"created\": \"2026-02-01T10:00:00.000Z\", \"delivered\": \"2026-03-15T10:00:00.000Z\", \"scheduled\": \"2026-02-28T08:00:00.000Z\"}',3,'[5, 6]',NULL),(34,'bill',1,'Downtown Miami Progress','{\"id\": 1, \"type\": \"organization\"}','{\"flown\": \"2026-03-12T09:00:00.000Z\", \"logged\": \"2026-03-12T14:00:00.000Z\", \"created\": \"2026-02-10T09:00:00.000Z\", \"delivered\": \"2026-04-01T10:00:00.000Z\", \"scheduled\": \"2026-03-12T07:30:00.000Z\"}',1,'[3, 7]',NULL),(35,'bill',1,'Everglades Final Deliverable','{\"id\": 4, \"type\": \"organization\"}','{\"flown\": \"2026-03-18T08:30:00.000Z\", \"logged\": \"2026-03-18T13:00:00.000Z\", \"created\": \"2026-02-15T10:00:00.000Z\", \"delivered\": \"2026-04-07T10:00:00.000Z\", \"scheduled\": \"2026-03-18T07:00:00.000Z\"}',4,'[7, 8]',NULL),(36,'completed',1,'Coastal Q4 Site Summary','{\"id\": 1, \"type\": \"organization\"}','{\"flown\": \"2026-02-01T09:00:00.000Z\", \"billed\": \"2026-03-04T10:00:00.000Z\", \"logged\": \"2026-02-01T13:00:00.000Z\", \"created\": \"2026-01-10T10:00:00.000Z\", \"delivered\": \"2026-02-15T10:00:00.000Z\", \"scheduled\": \"2026-02-01T08:00:00.000Z\"}',1,'[1, 7]',NULL),(37,'completed',1,'HOA Winter Documentation','{\"id\": 2, \"type\": \"organization\"}','{\"flown\": \"2026-02-05T09:30:00.000Z\", \"billed\": \"2026-03-10T10:00:00.000Z\", \"logged\": \"2026-02-05T14:00:00.000Z\", \"created\": \"2026-01-15T09:00:00.000Z\", \"delivered\": \"2026-02-20T10:00:00.000Z\", \"scheduled\": \"2026-02-05T08:00:00.000Z\"}',2,'[2, 4]',NULL),(38,'completed',1,'Tampa Phase 1 Complete','{\"id\": 3, \"type\": \"organization\"}','{\"flown\": \"2026-02-12T09:00:00.000Z\", \"billed\": \"2026-03-17T10:00:00.000Z\", \"logged\": \"2026-02-12T14:00:00.000Z\", \"created\": \"2026-01-20T10:00:00.000Z\", \"delivered\": \"2026-02-25T10:00:00.000Z\", \"scheduled\": \"2026-02-12T08:00:00.000Z\"}',3,'[3, 6]',NULL),(39,'completed',1,'Palm Beach Spring Shoot','{\"id\": 5, \"type\": \"organization\"}','{\"flown\": \"2026-03-05T09:00:00.000Z\", \"billed\": \"2026-04-02T10:00:00.000Z\", \"logged\": \"2026-03-05T13:30:00.000Z\", \"created\": \"2026-02-01T09:00:00.000Z\", \"delivered\": \"2026-03-20T10:00:00.000Z\", \"scheduled\": \"2026-03-05T07:30:00.000Z\"}',5,'[4, 5]',NULL),(40,'completed',1,'Orlando Full 3D Package','{\"id\": 3, \"type\": \"organization\"}','{\"flown\": \"2026-03-10T09:30:00.000Z\", \"billed\": \"2026-04-09T10:00:00.000Z\", \"logged\": \"2026-03-10T15:00:00.000Z\", \"created\": \"2026-02-05T10:00:00.000Z\", \"delivered\": \"2026-03-25T10:00:00.000Z\", \"scheduled\": \"2026-03-10T08:00:00.000Z\"}',6,'[8, 7, 6]',NULL),(41,'completed',1,'Everglades Wetlands Study','{\"id\": 4, \"type\": \"organization\"}','{\"flown\": \"2026-03-14T08:30:00.000Z\", \"billed\": \"2026-04-15T10:00:00.000Z\", \"logged\": \"2026-03-14T13:00:00.000Z\", \"created\": \"2026-02-08T09:00:00.000Z\", \"delivered\": \"2026-03-28T10:00:00.000Z\", \"scheduled\": \"2026-03-14T07:00:00.000Z\"}',4,'[7, 8]',NULL),(42,'completed',1,'Santa Monica Coastal Map','{\"id\": 4, \"type\": \"organization\"}','{\"flown\": \"2026-03-22T09:00:00.000Z\", \"billed\": \"2026-04-20T10:00:00.000Z\", \"logged\": \"2026-03-22T14:00:00.000Z\", \"created\": \"2026-02-12T10:00:00.000Z\", \"delivered\": \"2026-04-05T10:00:00.000Z\", \"scheduled\": \"2026-03-22T08:00:00.000Z\"}',7,'[7, 4]',NULL);
/*!40000 ALTER TABLE `Jobs` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 17:20:07
-- MySQL dump 10.13  Distrib 8.4.6, for Win64 (x86_64)
--
-- Host: localhost    Database: prodrones_application
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

--
-- Dumping data for table `Job_Meta`
--
-- WHERE:  job_id >= 16

LOCK TABLES `Job_Meta` WRITE;
/*!40000 ALTER TABLE `Job_Meta` DISABLE KEYS */;
INSERT INTO `Job_Meta` (`meta_id`, `job_id`, `meta_key`, `meta_value`) VALUES (78,16,'amount_payable','800.00'),(79,17,'amount_payable','1200.00'),(80,18,'amount_payable','950.00'),(81,19,'amount_payable','1500.00'),(82,20,'amount_payable','1100.00'),(111,21,'amount_payable','1800.00'),(112,22,'amount_payable','2500.00'),(113,23,'amount_payable','1600.00'),(114,24,'amount_payable','1400.00'),(115,25,'amount_payable','2200.00'),(104,26,'amount_payable','2800.00'),(105,27,'amount_payable','2100.00'),(106,28,'amount_payable','1750.00'),(107,29,'amount_payable','2400.00'),(108,30,'amount_payable','1900.00'),(86,31,'amount_payable','2600.00'),(87,32,'amount_payable','2300.00'),(88,33,'amount_payable','1600.00'),(89,34,'amount_payable','2000.00'),(90,35,'amount_payable','1850.00'),(94,36,'amount_payable','1500.00'),(95,37,'amount_payable','2400.00'),(96,38,'amount_payable','1950.00'),(97,39,'amount_payable','1700.00'),(98,40,'amount_payable','1200.00'),(99,41,'amount_payable','1800.00'),(100,42,'amount_payable','2100.00');
/*!40000 ALTER TABLE `Job_Meta` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 17:20:07
