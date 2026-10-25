-- ============================================================
-- AgriWise: AI-Based Smart Fertilizer Recommendation System
-- Database Schema Definition (MySQL)
-- ============================================================

CREATE DATABASE IF NOT EXISTS `agriwise_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `agriwise_db`;

-- 1. Users Table (Authentication & Role Security)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(20) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('farmer', 'admin') NOT NULL DEFAULT 'farmer',
  `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Farmer Profiles Table
CREATE TABLE IF NOT EXISTS `farmer_profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `country` VARCHAR(100) DEFAULT 'India',
  `state` VARCHAR(100) DEFAULT NULL,
  `district` VARCHAR(100) DEFAULT NULL,
  `village` VARCHAR(100) DEFAULT NULL,
  `preferred_language` VARCHAR(50) DEFAULT 'English',
  `farmer_type` VARCHAR(50) DEFAULT 'Smallholder',
  `total_farming_area` DECIMAL(10,2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Farms Table
CREATE TABLE IF NOT EXISTS `farms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmer_id` INT NOT NULL,
  `farm_name` VARCHAR(150) NOT NULL,
  `country` VARCHAR(100) DEFAULT 'India',
  `state` VARCHAR(100) NOT NULL,
  `district` VARCHAR(100) NOT NULL,
  `village` VARCHAR(100) DEFAULT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `area` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `ownership_type` VARCHAR(50) DEFAULT 'Owned',
  `irrigation` VARCHAR(100) DEFAULT 'Canal / Tubewell',
  `water_source` VARCHAR(100) DEFAULT 'Groundwater',
  `farming_type` VARCHAR(50) DEFAULT 'Conventional',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`farmer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_farms_farmer` (`farmer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Fields Table
CREATE TABLE IF NOT EXISTS `fields` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farm_id` INT NOT NULL,
  `field_name` VARCHAR(100) NOT NULL,
  `area` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `soil_type` VARCHAR(100) NOT NULL,
  `irrigation_type` VARCHAR(100) DEFAULT 'Flood / Furrow',
  `drainage` VARCHAR(50) DEFAULT 'Moderate',
  `current_crop` VARCHAR(100) DEFAULT NULL,
  `previous_crop` VARCHAR(100) DEFAULT NULL,
  `sowing_date` DATE DEFAULT NULL,
  `harvest_date` DATE DEFAULT NULL,
  `farming_method` VARCHAR(50) DEFAULT 'Conventional',
  `topography` VARCHAR(50) DEFAULT 'Flat / Plain',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON DELETE CASCADE,
  INDEX `idx_fields_farm` (`farm_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Crops Catalogue Table
CREATE TABLE IF NOT EXISTS `crops` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `variety` VARCHAR(100) DEFAULT NULL,
  `season` VARCHAR(50) DEFAULT 'Rabi',
  `growth_duration` INT DEFAULT 120,
  `target_yield` DECIMAL(10,2) DEFAULT 25.00,
  `nutrient_requirements` TEXT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Fertilizers Catalogue Table
CREATE TABLE IF NOT EXISTS `fertilizers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `nutrient_composition` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `suitable_crops` VARCHAR(255) DEFAULT 'All Major Field Crops',
  `application_method_default` VARCHAR(100) DEFAULT 'Basal or Split Top Dressing',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Soil Tests Table
CREATE TABLE IF NOT EXISTS `soil_tests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmer_id` INT NOT NULL,
  `farm_id` INT NOT NULL,
  `field_id` INT NOT NULL,
  `sample_id` VARCHAR(50) NOT NULL,
  `test_date` DATE NOT NULL,
  `status` ENUM('PENDING', 'IN_TESTING', 'REVIEW_REQUIRED', 'APPROVED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
  `lab_name` VARCHAR(150) DEFAULT NULL,
  `report_file_path` VARCHAR(255) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`farmer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`field_id`) REFERENCES `fields`(`id`) ON DELETE CASCADE,
  INDEX `idx_soil_tests_farmer` (`farmer_id`),
  INDEX `idx_soil_tests_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Soil Parameters Table
CREATE TABLE IF NOT EXISTS `soil_parameters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `soil_test_id` INT NOT NULL UNIQUE,
  `soil_type` VARCHAR(100) DEFAULT NULL,
  `soil_color` VARCHAR(50) DEFAULT NULL,
  `soil_texture` VARCHAR(50) DEFAULT NULL,
  `soil_depth` DECIMAL(5,2) DEFAULT NULL,
  `soil_moisture` DECIMAL(5,2) DEFAULT NULL,
  `drainage` VARCHAR(50) DEFAULT NULL,
  `nitrogen` DECIMAL(8,2) DEFAULT NULL,
  `phosphorus` DECIMAL(8,2) DEFAULT NULL,
  `potassium` DECIMAL(8,2) DEFAULT NULL,
  `ph` DECIMAL(4,2) DEFAULT NULL,
  `ec` DECIMAL(6,2) DEFAULT NULL,
  `organic_carbon` DECIMAL(5,2) DEFAULT NULL,
  `organic_matter` DECIMAL(5,2) DEFAULT NULL,
  `sulfur` DECIMAL(8,2) DEFAULT NULL,
  `calcium` DECIMAL(8,2) DEFAULT NULL,
  `magnesium` DECIMAL(8,2) DEFAULT NULL,
  `zinc` DECIMAL(8,2) DEFAULT NULL,
  `iron` DECIMAL(8,2) DEFAULT NULL,
  `boron` DECIMAL(8,2) DEFAULT NULL,
  `manganese` DECIMAL(8,2) DEFAULT NULL,
  `copper` DECIMAL(8,2) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`soil_test_id`) REFERENCES `soil_tests`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Soil Analysis Table
CREATE TABLE IF NOT EXISTS `soil_analysis` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `soil_test_id` INT NOT NULL UNIQUE,
  `nitrogen_status` ENUM('LOW', 'MEDIUM', 'OPTIMAL', 'HIGH') NOT NULL,
  `phosphorus_status` ENUM('LOW', 'MEDIUM', 'OPTIMAL', 'HIGH') NOT NULL,
  `potassium_status` ENUM('LOW', 'MEDIUM', 'OPTIMAL', 'HIGH') NOT NULL,
  `ph_status` ENUM('ACIDIC', 'OPTIMAL', 'ALKALINE') NOT NULL,
  `ec_status` ENUM('NORMAL', 'ELEVATED', 'HIGH') NOT NULL,
  `organic_carbon_status` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
  `secondary_micronutrients_summary TEXT DEFAULT NULL,
  `analysis_text TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`soil_test_id`) REFERENCES `soil_tests`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Fertilizer Recommendations Table
CREATE TABLE IF NOT EXISTS `fertilizer_recommendations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmer_id` INT NOT NULL,
  `farm_id` INT NOT NULL,
  `field_id` INT NOT NULL,
  `soil_test_id` INT NOT NULL,
  `crop_id` INT DEFAULT NULL,
  `priority_nutrient` VARCHAR(100) NOT NULL,
  `fertilizer_id` INT DEFAULT NULL,
  `fertilizer_name` VARCHAR(150) DEFAULT NULL,
  `recommendation_text` TEXT NOT NULL,
  `application_timing` VARCHAR(255) DEFAULT NULL,
  `application_method` VARCHAR(255) DEFAULT NULL,
  `number_of_applications` INT DEFAULT 2,
  `soil_improvement_suggestions` TEXT DEFAULT NULL,
  `warnings` TEXT DEFAULT NULL,
  `explanation` TEXT DEFAULT NULL,
  `admin_comments` TEXT DEFAULT NULL,
  `status` ENUM('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SENT', 'READ') NOT NULL DEFAULT 'DRAFT',
  `admin_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `approved_at` DATETIME DEFAULT NULL,
  `sent_at` DATETIME DEFAULT NULL,
  `read_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`farmer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`field_id`) REFERENCES `fields`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`soil_test_id`) REFERENCES `soil_tests`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_rec_farmer` (`farmer_id`),
  INDEX `idx_rec_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Fertilizer Schedules Table
CREATE TABLE IF NOT EXISTS `fertilizer_schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `recommendation_id` INT NOT NULL,
  `stage` VARCHAR(100) NOT NULL,
  `stage_order` INT DEFAULT 1,
  `nutrient` VARCHAR(100) DEFAULT NULL,
  `fertilizer_category` VARCHAR(150) DEFAULT NULL,
  `timing` VARCHAR(150) DEFAULT NULL,
  `method` VARCHAR(150) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'Scheduled',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`recommendation_id`) REFERENCES `fertilizer_recommendations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Messages Table
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmer_id` INT NOT NULL,
  `admin_id` INT DEFAULT NULL,
  `recommendation_id` INT DEFAULT NULL,
  `subject` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`farmer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`recommendation_id`) REFERENCES `fertilizer_recommendations`(`id`) ON DELETE SET NULL,
  INDEX `idx_messages_farmer` (`farmer_id`),
  INDEX `idx_messages_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmer_id` INT NOT NULL,
  `message_id` INT DEFAULT NULL,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT DEFAULT NULL,
  `link` VARCHAR(255) DEFAULT NULL,
  `is_read BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`farmer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE,
  INDEX `idx_notif_farmer` (`farmer_id`),
  INDEX `idx_notif_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Fertilizer Applications (Historical Log) Table
CREATE TABLE IF NOT EXISTS `fertilizer_applications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `farmer_id` INT NOT NULL,
  `farm_id` INT NOT NULL,
  `field_id` INT NOT NULL,
  `fertilizer_id` INT DEFAULT NULL,
  `fertilizer_name` VARCHAR(150) NOT NULL,
  `nutrient_composition` VARCHAR(100) DEFAULT NULL,
  `quantity` DECIMAL(10,2) NOT NULL,
  `unit` VARCHAR(50) NOT NULL DEFAULT 'kg',
  `application_date` DATE NOT NULL,
  `application_method` VARCHAR(100) NOT NULL,
  `crop` VARCHAR(100) DEFAULT NULL,
  `growth_stage` VARCHAR(100) DEFAULT NULL,
  `cost` DECIMAL(10,2) DEFAULT 0.00,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`farmer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`field_id`) REFERENCES `fields`(`id`) ON DELETE CASCADE,
  INDEX `idx_fert_app_farmer` (`farmer_id`),
  INDEX `idx_fert_app_date` (`application_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Configurable Recommendation Rules Table
CREATE TABLE IF NOT EXISTS `recommendation_rules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `parameter` VARCHAR(50) NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `low_threshold` DECIMAL(10,2) NOT NULL,
  `high_threshold` DECIMAL(10,2) NOT NULL,
  `optimal_min` DECIMAL(10,2) NOT NULL,
  `optimal_max` DECIMAL(10,2) NOT NULL,
  `guidance_text` TEXT DEFAULT NULL,
  `disclaimer` TEXT DEFAULT 'Specific interpretation should be validated using appropriate regional/crop/soil agronomic guidance.',
  `is_demo_rule` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
