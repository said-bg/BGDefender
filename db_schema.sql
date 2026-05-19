-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: bg_defender
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
-- Table structure for table `authors`
--

DROP TABLE IF EXISTS `authors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `authors` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `roleEn` varchar(50) DEFAULT NULL,
  `roleFi` varchar(50) DEFAULT NULL,
  `biographyEn` text,
  `biographyFi` text,
  `photo` varchar(255) DEFAULT NULL,
  `ownerUserId` int DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_authors_owner_user` (`ownerUserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `certificates`
--

DROP TABLE IF EXISTS `certificates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificates` (
  `id` varchar(36) NOT NULL,
  `userId` int NOT NULL,
  `courseId` varchar(255) NOT NULL,
  `status` enum('PENDING_PROFILE','ISSUED') NOT NULL DEFAULT 'PENDING_PROFILE',
  `certificateCode` varchar(40) NOT NULL,
  `firstNameSnapshot` varchar(120) DEFAULT NULL,
  `lastNameSnapshot` varchar(120) DEFAULT NULL,
  `courseTitleEnSnapshot` varchar(220) NOT NULL,
  `courseTitleFiSnapshot` varchar(220) NOT NULL,
  `issuedAt` timestamp NULL DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_bd8df793beac12456464909017` (`userId`,`courseId`),
  UNIQUE KEY `IDX_afe82696f6717ee42446eaa539` (`certificateCode`),
  KEY `FK_e50e73bc3bdcfb0eb3d561f1494` (`courseId`),
  CONSTRAINT `FK_7d072194aef1ecb98664c83e861` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_e50e73bc3bdcfb0eb3d561f1494` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chapters`
--

DROP TABLE IF EXISTS `chapters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chapters` (
  `id` varchar(36) NOT NULL,
  `titleEn` varchar(200) NOT NULL,
  `titleFi` varchar(200) NOT NULL,
  `descriptionEn` text NOT NULL,
  `descriptionFi` text NOT NULL,
  `orderIndex` int NOT NULL,
  `courseId` varchar(255) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_becd2c25ed5b601e7a4466271c8` (`courseId`),
  CONSTRAINT `FK_becd2c25ed5b601e7a4466271c8` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_authors`
--

DROP TABLE IF EXISTS `course_authors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_authors` (
  `courseId` varchar(36) NOT NULL,
  `authorId` varchar(36) NOT NULL,
  PRIMARY KEY (`courseId`,`authorId`),
  KEY `IDX_b44a6b501a61dea1ed609f65b5` (`courseId`),
  KEY `IDX_eb0d8bd45857e6e5892f00d51d` (`authorId`),
  CONSTRAINT `FK_b44a6b501a61dea1ed609f65b57` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_eb0d8bd45857e6e5892f00d51d3` FOREIGN KEY (`authorId`) REFERENCES `authors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_collection_items`
--

DROP TABLE IF EXISTS `course_collection_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_collection_items` (
  `id` varchar(36) NOT NULL,
  `collectionId` varchar(36) NOT NULL,
  `courseId` varchar(36) NOT NULL,
  `orderIndex` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `FK_7f76cf52def1066f8424f9ee5f2` (`collectionId`),
  KEY `FK_188193ce84e29660f257b29d1d8` (`courseId`),
  CONSTRAINT `FK_188193ce84e29660f257b29d1d8` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_7f76cf52def1066f8424f9ee5f2` FOREIGN KEY (`collectionId`) REFERENCES `course_collections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_collections`
--

DROP TABLE IF EXISTS `course_collections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_collections` (
  `id` varchar(36) NOT NULL,
  `titleEn` varchar(200) NOT NULL,
  `titleFi` varchar(200) NOT NULL,
  `descriptionEn` text,
  `descriptionFi` text,
  `coverImage` varchar(500) DEFAULT NULL,
  `orderIndex` int NOT NULL DEFAULT '1',
  `isPublished` tinyint NOT NULL DEFAULT '1',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` varchar(36) NOT NULL,
  `titleEn` varchar(200) NOT NULL,
  `titleFi` varchar(200) NOT NULL,
  `descriptionEn` text NOT NULL,
  `descriptionFi` text NOT NULL,
  `level` enum('free','premium') NOT NULL DEFAULT 'free',
  `status` enum('draft','published') NOT NULL DEFAULT 'draft',
  `estimatedDuration` int DEFAULT NULL,
  `coverImage` varchar(255) DEFAULT NULL,
  `ownerUserId` int DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_courses_owner_user` (`ownerUserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorites` (
  `id` varchar(36) NOT NULL,
  `userId` int NOT NULL,
  `courseId` varchar(255) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_6ada0415623917c5eb14a119bc` (`userId`,`courseId`),
  KEY `FK_c6df4fbe36a86826a3f970225fe` (`courseId`),
  CONSTRAINT `FK_c6df4fbe36a86826a3f970225fe` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_e747534006c6e3c2f09939da60f` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `userId` int NOT NULL,
  `type` enum('course_published','resource_shared','certificate_available','complete_profile_for_certificate') NOT NULL,
  `courseId` varchar(36) DEFAULT NULL,
  `courseTitleEnSnapshot` varchar(200) DEFAULT NULL,
  `courseTitleFiSnapshot` varchar(200) DEFAULT NULL,
  `resourceId` varchar(36) DEFAULT NULL,
  `resourceTitleSnapshot` varchar(255) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `isRead` tinyint NOT NULL DEFAULT '0',
  `readAt` datetime DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `tokenHash` varchar(255) NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `usedAt` timestamp NULL DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pedagogical_contents`
--

DROP TABLE IF EXISTS `pedagogical_contents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedagogical_contents` (
  `id` varchar(36) NOT NULL,
  `titleEn` varchar(200) NOT NULL,
  `titleFi` varchar(200) NOT NULL,
  `type` enum('text','video','image','link','pdf','quiz') NOT NULL,
  `contentEn` text,
  `contentFi` text,
  `url` varchar(500) DEFAULT NULL,
  `orderIndex` int NOT NULL,
  `subChapterId` varchar(255) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_a6ce244e2cb61a559a6d3a1f1b2` (`subChapterId`),
  CONSTRAINT `FK_a6ce244e2cb61a559a6d3a1f1b2` FOREIGN KEY (`subChapterId`) REFERENCES `sub_chapters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `progress`
--

DROP TABLE IF EXISTS `progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `progress` (
  `id` varchar(36) NOT NULL,
  `userId` int NOT NULL,
  `courseId` varchar(255) NOT NULL,
  `completionPercentage` int NOT NULL DEFAULT '0',
  `completed` tinyint NOT NULL DEFAULT '0',
  `completedAt` timestamp NULL DEFAULT NULL,
  `lastAccessedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastViewedType` enum('overview','chapter','subchapter') DEFAULT NULL,
  `lastChapterId` varchar(255) DEFAULT NULL,
  `lastSubChapterId` varchar(255) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_d665daba18db095b26e79cbdc5` (`userId`,`courseId`),
  KEY `FK_cb4d1477194c4ba8cf55bb6eb4b` (`courseId`),
  CONSTRAINT `FK_0366c96237f98ea1c8ba6e1ec35` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_cb4d1477194c4ba8cf55bb6eb4b` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quiz_attempt_answers`
--

DROP TABLE IF EXISTS `quiz_attempt_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_attempt_answers` (
  `id` varchar(36) NOT NULL,
  `attemptId` varchar(255) NOT NULL,
  `questionId` varchar(255) NOT NULL,
  `questionType` enum('single_choice','multiple_choice') NOT NULL,
  `promptEn` varchar(300) NOT NULL,
  `promptFi` varchar(300) NOT NULL,
  `selectedOptionIds` text NOT NULL,
  `correctOptionIds` text NOT NULL,
  `isCorrect` tinyint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_5fe7118101facbd40e303ffb8a5` (`attemptId`),
  CONSTRAINT `FK_5fe7118101facbd40e303ffb8a5` FOREIGN KEY (`attemptId`) REFERENCES `quiz_attempts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quiz_attempts`
--

DROP TABLE IF EXISTS `quiz_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_attempts` (
  `id` varchar(36) NOT NULL,
  `quizId` varchar(255) NOT NULL,
  `userId` int NOT NULL,
  `totalQuestions` int NOT NULL,
  `correctAnswers` int NOT NULL,
  `score` int NOT NULL,
  `passed` tinyint NOT NULL,
  `submittedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_6a45551254306a35d5cc23d99f` (`quizId`,`userId`),
  KEY `FK_ff7b1d71fabdc7e1f4aff552859` (`userId`),
  CONSTRAINT `FK_23f2bbe9288b221b1b377372782` FOREIGN KEY (`quizId`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_ff7b1d71fabdc7e1f4aff552859` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quiz_options`
--

DROP TABLE IF EXISTS `quiz_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_options` (
  `id` varchar(36) NOT NULL,
  `questionId` varchar(255) NOT NULL,
  `labelEn` varchar(220) NOT NULL,
  `labelFi` varchar(220) NOT NULL,
  `isCorrect` tinyint NOT NULL DEFAULT '0',
  `orderIndex` int NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_912dd301518a846947070f73a31` (`questionId`),
  CONSTRAINT `FK_912dd301518a846947070f73a31` FOREIGN KEY (`questionId`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quiz_questions`
--

DROP TABLE IF EXISTS `quiz_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_questions` (
  `id` varchar(36) NOT NULL,
  `quizId` varchar(255) NOT NULL,
  `promptEn` varchar(300) NOT NULL,
  `promptFi` varchar(300) NOT NULL,
  `explanationEn` text,
  `explanationFi` text,
  `type` enum('single_choice','multiple_choice') NOT NULL,
  `orderIndex` int NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_8889ccc5a40989ea308a588870e` (`quizId`),
  CONSTRAINT `FK_8889ccc5a40989ea308a588870e` FOREIGN KEY (`quizId`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quizzes`
--

DROP TABLE IF EXISTS `quizzes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quizzes` (
  `id` varchar(36) NOT NULL,
  `titleEn` varchar(200) NOT NULL,
  `titleFi` varchar(200) NOT NULL,
  `descriptionEn` text,
  `descriptionFi` text,
  `passingScore` int NOT NULL DEFAULT '70',
  `isPublished` tinyint NOT NULL DEFAULT '0',
  `scope` enum('chapter_training','course_final') NOT NULL DEFAULT 'chapter_training',
  `chapterId` varchar(255) DEFAULT NULL,
  `courseId` varchar(255) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_69213c7381b145a9e915780d83` (`scope`,`courseId`),
  UNIQUE KEY `IDX_76394b7a5d9f03c37d3e234711` (`scope`,`chapterId`),
  UNIQUE KEY `REL_0e7f13a15e4981999c46b6763b` (`chapterId`),
  KEY `FK_9021b7e89ea353c02a361a10b72` (`courseId`),
  CONSTRAINT `FK_0e7f13a15e4981999c46b6763bb` FOREIGN KEY (`chapterId`) REFERENCES `chapters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_9021b7e89ea353c02a361a10b72` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `resources`
--

DROP TABLE IF EXISTS `resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resources` (
  `id` varchar(36) NOT NULL,
  `title` varchar(180) NOT NULL,
  `description` text,
  `type` enum('FILE','LINK') NOT NULL,
  `fileUrl` varchar(2048) DEFAULT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `mimeType` varchar(160) DEFAULT NULL,
  `linkUrl` varchar(2048) DEFAULT NULL,
  `source` enum('ADMIN','USER') NOT NULL,
  `assignedUserId` int NOT NULL,
  `createdByUserId` int DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_891df872aa8bff2e9c3ee155889` (`assignedUserId`),
  KEY `FK_436ca18e9d43560f9c0d200477a` (`createdByUserId`),
  CONSTRAINT `FK_436ca18e9d43560f9c0d200477a` FOREIGN KEY (`createdByUserId`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_891df872aa8bff2e9c3ee155889` FOREIGN KEY (`assignedUserId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sub_chapters`
--

DROP TABLE IF EXISTS `sub_chapters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sub_chapters` (
  `id` varchar(36) NOT NULL,
  `titleEn` varchar(200) NOT NULL,
  `titleFi` varchar(200) NOT NULL,
  `descriptionEn` text NOT NULL,
  `descriptionFi` text NOT NULL,
  `orderIndex` int NOT NULL,
  `chapterId` varchar(255) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_a9ee65efc8d2a2bbb4ac1326846` (`chapterId`),
  CONSTRAINT `FK_a9ee65efc8d2a2bbb4ac1326846` FOREIGN KEY (`chapterId`) REFERENCES `chapters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `firstName` varchar(120) DEFAULT NULL,
  `lastName` varchar(120) DEFAULT NULL,
  `occupation` varchar(160) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('USER','CREATOR','ADMIN') NOT NULL DEFAULT 'USER',
  `plan` enum('FREE','PREMIUM') NOT NULL DEFAULT 'FREE',
  `isActive` tinyint NOT NULL DEFAULT '1',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-14  5:32:37

