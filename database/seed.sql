-- ============================================================
-- AgriWise: Seed Data Script
-- Populates Demo Users, Crops, Fertilizers, Rules & Sample Farm
-- ============================================================

USE `agriwise_db`;

-- 1. Insert Users (Password hashes generated via bcrypt)
-- Farmer: farmer@example.com / Farmer@123
-- Admin: admin@example.com / Admin@123
-- Secondary Farmer: rajesh@example.com / Farmer@123 (for isolation validation)
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `status`) VALUES
(1, 'Harini Bairi', 'farmer@example.com', '+91 98765 43210', '$2a$10$bAtQWAfmSoNu.aNdMOWGs./IymWqnEceQf120cJOqLQe8IIE.ENXG', 'farmer', 'active'),
(2, 'AgriWise Lead Agronomist', 'admin@example.com', '+91 91234 56789', '$2a$10$66zpkOAyDSxYpaG076BjJ.4ogPxhnAIXutw1cqnbF4MUCnU7tNpcW', 'admin', 'active'),
(3, 'Rajesh Patel', 'rajesh@example.com', '+91 99887 76655', '$2a$10$bAtQWAfmSoNu.aNdMOWGs./IymWqnEceQf120cJOqLQe8IIE.ENXG', 'farmer', 'active')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 2. Farmer Profiles
INSERT INTO `farmer_profiles` (`user_id`, `country`, `state`, `district`, `village`, `preferred_language`, `farmer_type`, `total_farming_area`) VALUES
(1, 'India', 'Telangana', 'Warangal', 'Dharmasagar', 'English', 'Progressive Smallholder', 12.50),
(3, 'India', 'Gujarat', 'Anand', 'Vasna', 'English', 'Commercial Grower', 24.00)
ON DUPLICATE KEY UPDATE `district`=VALUES(`district`);

-- 3. Crops Catalogue
INSERT INTO `crops` (`id`, `name`, `variety`, `season`, `growth_duration`, `target_yield`, `nutrient_requirements`, `description`) VALUES
(1, 'Wheat', 'HD-2967 / Sharbati', 'Rabi', 120, 22.00, 'N: 120 kg/ha, P2O5: 60 kg/ha, K2O: 40 kg/ha', 'High yielding irrigated bread wheat requiring balanced basal phosphorus for strong tillering.'),
(2, 'Rice / Paddy', 'Basmati / BPT-5204 (Samba Mahsuri)', 'Kharif', 135, 28.00, 'N: 100 kg/ha, P2O5: 50 kg/ha, K2O: 50 kg/ha, Zn: 25 kg/ha', 'Staple grain crop sensitive to nitrogen timing, zinc deficiency, and water management.'),
(3, 'Maize / Corn', 'Pioneer 3396 Hybrid', 'Kharif / Rabi', 110, 32.00, 'N: 150 kg/ha, P2O5: 60 kg/ha, K2O: 60 kg/ha', 'Heavy nutrient feeder with peak nitrogen demand during knee-high to tasseling stages.'),
(4, 'Cotton', 'Bt Cotton Hybrid', 'Kharif', 160, 15.00, 'N: 120 kg/ha, P2O5: 60 kg/ha, K2O: 60 kg/ha, Boron: 5 kg/ha', 'Deep-rooted fiber crop requiring steady potassium during boll formation.'),
(5, 'Tomato', 'Arka Rakshak / Hybrid', 'Year-round', 110, 35.00, 'N: 120 kg/ha, P2O5: 100 kg/ha, K2O: 120 kg/ha, Ca & Mg', 'High value vegetable crop vulnerable to calcium deficiency (blossom end rot) and potassium starvation.'),
(6, 'Potato', 'Kufri Jyoti / Pukhraj', 'Rabi', 95, 30.00, 'N: 150 kg/ha, P2O5: 100 kg/ha, K2O: 150 kg/ha', 'Tuber crop with high potassium and phosphorus demand for optimal tuber bulking.'),
(7, 'Soybean', 'JS-335', 'Kharif', 100, 12.00, 'N: 30 kg/ha (Symbiotic Fixation), P2O5: 60 kg/ha, K2O: 40 kg/ha, S: 20 kg/ha', 'Leguminous oilseed with nitrogen-fixing rhizobia; requires adequate phosphorus and sulfur.'),
(8, 'Sugarcane', 'Co 0238', 'Year-round', 360, 85.00, 'N: 250 kg/ha, P2O5: 115 kg/ha, K2O: 115 kg/ha', 'Perennial sucrose producer with substantial biomass production and long nutrient withdrawal curve.')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 4. Fertilizers Catalogue
INSERT INTO `fertilizers` (`id`, `name`, `type`, `nutrient_composition`, `description`, `suitable_crops`, `application_method_default`) VALUES
(1, 'Neem Coated Urea', 'Nitrogen', '46% Total Nitrogen (N)', 'Slow-release granular nitrogen fertilizer with nitrification inhibitors to reduce volatilization and leaching.', 'All Crops', 'Split top dressing into 2-3 equal doses'),
(2, 'Di-Ammonium Phosphate (DAP)', 'Compound', '18% Nitrogen (N), 46% Phosphate (P2O5)', 'Widely used basal fertilizer supplying concentrated phosphorus and starter nitrogen for early root architecture.', 'Cereals, Pulses, Oilseeds', 'Basal band placement below seed level'),
(3, 'Muriate of Potash (MOP)', 'Potassium', '60% Potash (K2O)', 'Standard potassium fertilizer essential for water regulation, disease resistance, and carbohydrate translocation.', 'Rice, Wheat, Maize, Cotton', 'Basal application and top dress at flowering'),
(4, 'NPK 10-26-26 Complex', 'Compound', '10% N, 26% P2O5, 26% K2O', 'Balanced multinutrient compound ideal for soil low in phosphorus and potassium without excessive nitrogen surge.', 'Oilseeds, Pulses, Sugarcane, Vegetables', 'Basal soil incorporation'),
(5, 'NPK 12-32-16 Complex', 'Compound', '12% N, 32% P2O5, 16% K2O', 'High-phosphate compound suited for soils requiring rapid root development and strong initial vegetative start.', 'Wheat, Potato, Tomato', 'Basal drilling at sowing time'),
(6, 'Single Super Phosphate (SSP)', 'Phosphorus', '16% P2O5, 11% Sulfur (S), 19% Calcium (Ca)', 'Excellent source of water-soluble phosphate, sulfur, and calcium particularly beneficial for oilseeds and legumes.', 'Groundnut, Soybean, Mustard, Pulses', 'Basal broadcasting followed by ploughing'),
(7, 'Well-Decomposed Farmyard Manure (FYM)', 'Organic', '0.5% N, 0.2% P2O5, 0.5% K2O + Organic Humus', 'Traditional organic manure that improves soil structure, moisture-holding capacity, and microbial biodiversity.', 'All Crops', 'Incorporated 3-4 weeks prior to sowing'),
(8, 'Enriched Vermicompost', 'Organic', '1.5% N, 1.0% P2O5, 1.5% K2O + Beneficial Microbes', 'Biologically active organic compost enhancing soil cation exchange capacity (CEC) and micronutrient availability.', 'Horticulture, Vegetables, Kitchen Gardens', 'Applied near rhizosphere during field prep'),
(9, 'Zinc Sulfate Heptahydrate (ZnSO4.7H2O)', 'Micronutrient', '21% Zinc (Zn), 10% Sulfur (S)', 'Essential micro-mineral fertilizer correcting zinc deficiency, khaira disease in paddy, and leaf chlorosis.', 'Rice, Maize, Citrus', 'Soil basal broadcast or foliar spray at 0.5%'),
(10, 'Bio-NPK Consortium / Liquid Biofertilizer', 'Biofertilizer', 'Azotobacter + PSB + KMB (1x10^8 CFU/ml)', 'Microbial inoculant fixing atmospheric N, solubilizing fixed soil phosphorus, and mobilizing potassium.', 'Eco-friendly and Organic Farms', 'Seed treatment, seedling root dip, or soil drench')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 5. Configurable Recommendation Rules
INSERT INTO `recommendation_rules` (`id`, `parameter`, `unit`, `low_threshold`, `high_threshold`, `optimal_min`, `optimal_max`, `guidance_text`, `disclaimer`, `is_demo_rule`) VALUES
(1, 'nitrogen', 'kg/ha', 280.00, 560.00, 280.00, 560.00, 'Available Nitrogen: Low (<280 kg/ha), Medium (280-560 kg/ha), High (>560 kg/ha). Apply split dressings to avoid leaching.', 'Specific interpretation should be validated using appropriate regional/crop/soil agronomic guidance.', TRUE),
(2, 'phosphorus', 'kg/ha', 23.00, 56.00, 23.00, 56.00, 'Available Phosphorus: Low (<23 kg/ha or <10 mg/kg), Medium (23-56 kg/ha), High (>56 kg/ha). Apply as basal below seed zone.', 'Specific interpretation should be validated using appropriate regional/crop/soil agronomic guidance.', TRUE),
(3, 'potassium', 'kg/ha', 145.00, 335.00, 145.00, 335.00, 'Available Potassium: Low (<145 kg/ha), Medium (145-335 kg/ha), High (>335 kg/ha). Crucial for stress resistance and starch filling.', 'Specific interpretation should be validated using appropriate regional/crop/soil agronomic guidance.', TRUE),
(4, 'ph', 'pH scale', 6.50, 7.80, 6.50, 7.50, 'Soil Reaction: Acidic (<6.5), Neutral/Optimal (6.5-7.5), Alkaline (>7.8). High pH fixes phosphorus and micronutrients.', 'Specific interpretation should be validated using appropriate regional/crop/soil agronomic guidance.', TRUE),
(5, 'ec', 'dS/m', 1.00, 2.00, 0.20, 1.00, 'Electrical Conductivity: Normal (<1.0 dS/m), Critical/Elevated (1.0-2.0 dS/m), Saline/Hazardous (>2.0 dS/m).', 'Specific interpretation should be validated using appropriate regional/crop/soil agronomic guidance.', TRUE),
(6, 'organic_carbon', '%', 0.50, 0.75, 0.50, 0.75, 'Soil Organic Carbon: Low (<0.50%), Medium (0.50-0.75%), High (>0.75%). High OC enhances nutrient-buffering capacity.', 'Specific interpretation should be validated using appropriate regional/crop/soil agronomic guidance.', TRUE),
(7, 'zinc', 'ppm', 0.60, 2.00, 0.60, 1.50, 'Available Zinc (DTPA extractable): Deficient (<0.60 ppm), Sufficient (0.60-2.0 ppm). Common in alkaline flooded soils.', 'Specific interpretation should be validated using appropriate regional/crop/soil agronomic guidance.', TRUE),
(8, 'sulfur', 'ppm', 10.00, 20.00, 10.00, 20.00, 'Available Sulfur: Deficient (<10 ppm), Adequate (10-20 ppm). Critical for protein synthesis in oilseeds and legumes.', 'Specific interpretation should be validated using appropriate regional/crop/soil agronomic guidance.', TRUE)
ON DUPLICATE KEY UPDATE `parameter`=VALUES(`parameter`);

-- 6. Demo Farms for Farmer 1
INSERT INTO `farms` (`id`, `farmer_id`, `farm_name`, `country`, `state`, `district`, `village`, `location`, `area`, `ownership_type`, `irrigation`, `water_source`, `farming_type`) VALUES
(1, 1, 'Green Valley Agro Farm', 'India', 'Telangana', 'Warangal', 'Dharmasagar', 'Survey No. 142/A, Canal Road', 8.50, 'Owned', 'Canal Irrigation & Borewell', 'Groundwater / Reservoir', 'Integrated Crop Management'),
(2, 1, 'Surya Sunrise Orchard', 'India', 'Telangana', 'Warangal', 'Kazipet', 'Plot 55, Near Lake View', 4.00, 'Owned', 'Drip Fertigation System', 'Borewell', 'Precision Agriculture')
ON DUPLICATE KEY UPDATE `farm_name`=VALUES(`farm_name`);

-- 7. Demo Fields
INSERT INTO `fields` (`id`, `farm_id`, `field_name`, `area`, `soil_type`, `irrigation_type`, `drainage`, `current_crop`, `previous_crop`, `sowing_date`, `harvest_date`, `farming_method`, `topography`) VALUES
(1, 1, 'Field 01 - North Wheat Plot', 4.50, 'Sandy Clay Loam', 'Canal / Flood', 'Moderate', 'Wheat', 'Rice / Paddy', '2026-11-10', '2027-03-20', 'Conventional Tillage', 'Flat Plain'),
(2, 1, 'Field 02 - South Paddy Basin', 4.00, 'Black Clay Soil', 'Flood / Basin', 'Moderate', 'Rice / Paddy', 'Maize', '2026-07-15', '2026-11-05', 'Direct Seeded Rice', 'Lowland Basin'),
(3, 2, 'Field 03 - East Vegetable Grid', 4.00, 'Red Sandy Loam', 'Drip Irrigation', 'Good', 'Tomato', 'Mustard', '2026-09-01', '2026-12-15', 'Raised Bed Mulch', 'Gently Sloping')
ON DUPLICATE KEY UPDATE `field_name`=VALUES(`field_name`);

-- 8. Demo Soil Test for Field 01
INSERT INTO `soil_tests` (`id`, `farmer_id`, `farm_id`, `field_id`, `sample_id`, `test_date`, `status`, `lab_name`, `report_file_path`, `notes`) VALUES
(1, 1, 1, 1, 'AGRI-ST-2026-001', '2026-10-01', 'APPROVED', 'National Agri-Soil Testing Laboratory, Warangal', NULL, 'Pre-sowing routine soil test for upcoming Rabi Wheat season. Soil felt slightly compact.')
ON DUPLICATE KEY UPDATE `sample_id`=VALUES(`sample_id`);

-- 9. Demo Soil Parameters for Soil Test 1
INSERT INTO `soil_parameters` (`id`, `soil_test_id`, `soil_type`, `soil_color`, `soil_texture`, `soil_depth`, `soil_moisture`, `drainage`, `nitrogen`, `phosphorus`, `potassium`, `ph`, `ec`, `organic_carbon`, `organic_matter`, `sulfur`, `calcium`, `magnesium`, `zinc`, `iron`, `boron`, `manganese`, `copper`) VALUES
(1, 1, 'Sandy Clay Loam', 'Dark Brown', 'Medium Loam', 25.00, 18.50, 'Moderate', 215.00, 14.50, 260.00, 7.60, 0.45, 0.42, 0.72, 8.20, 14.20, 5.10, 0.48, 4.80, 0.42, 6.50, 0.95)
ON DUPLICATE KEY UPDATE `nitrogen`=VALUES(`nitrogen`);

-- 10. Demo Soil Analysis for Soil Test 1
INSERT INTO `soil_analysis` (`id`, `soil_test_id`, `nitrogen_status`, `phosphorus_status`, `potassium_status`, `ph_status`, `ec_status`, `organic_carbon_status`, `secondary_micronutrients_summary`, `analysis_text`) VALUES
(1, 1, 'LOW', 'LOW', 'OPTIMAL', 'ALKALINE', 'NORMAL', 'LOW', 'Sulfur is marginal (8.2 ppm, below 10 ppm target). Zinc is deficient (0.48 ppm, below critical threshold 0.60 ppm).', 'Soil analysis reveals significant deficiencies in available Nitrogen (215 kg/ha) and Phosphorus (14.5 kg/ha). Organic Carbon is low (0.42%), indicating compromised nutrient buffering capacity. Soil reaction is slightly alkaline (pH 7.6) with safe salinity levels (EC 0.45 dS/m). Potassium is optimal.')
ON DUPLICATE KEY UPDATE `nitrogen_status`=VALUES(`nitrogen_status`);

-- 11. Demo Fertilizer Recommendation for Soil Test 1
INSERT INTO `fertilizer_recommendations` (`id`, `farmer_id`, `farm_id`, `field_id`, `soil_test_id`, `crop_id`, `priority_nutrient`, `fertilizer_id`, `fertilizer_name`, `recommendation_text`, `application_timing`, `application_method`, `number_of_applications`, `soil_improvement_suggestions`, `warnings`, `explanation`, `admin_comments`, `status`, `admin_id`, `created_at`, `approved_at`, `sent_at`, `read_at`) VALUES
(1, 1, 1, 1, 1, 1, 'Phosphorus and Nitrogen', 2, 'Di-Ammonium Phosphate (DAP) + Neem Coated Urea', 
'Apply Di-Ammonium Phosphate (DAP) as a basal placement at sowing to address severe phosphorus deficiency. Supplement with split applications of Neem Coated Urea at crown root initiation and tillering. Incorporate well-decomposed Farmyard Manure to rebuild soil organic carbon.',
'Basal at sowing + Split top dressing at 21 and 45 days after sowing',
'Band placement below seed row for DAP; broadcast followed by light irrigation for Urea',
3,
'Incorporate 4-5 tonnes/acre of well-decomposed Farmyard Manure (FYM) or 1.5 tonnes/acre of vermicompost during pre-sowing ploughing to elevate Organic Carbon above 0.65%. Apply 10 kg/acre Zinc Sulfate heptahydrate basally to overcome zinc chlorosis.',
'Demo Rule / Simulated Recommendation: Avoid applying untreated urea onto alkaline soil surface without incorporating, as ammonia volatilization losses will occur. Do NOT mix DAP directly with Zinc Sulfate during application to prevent insoluble zinc phosphate formation.',
'WHY: Phosphorus is LOW (14.5 kg/ha) and Nitrogen is LOW (215 kg/ha). Early phosphorus is non-negotiable for wheat root development and tillering. Soil pH of 7.6 requires careful placement to prevent phosphorus fixation. Optimal potassium (260 kg/ha) requires maintenance only.',
'Approved for Farmer Harini. Emphasize split nitrogen application to prevent leaching losses in Sandy Clay Loam.',
'SENT', 2, '2026-10-02 10:15:00', '2026-10-02 11:30:00', '2026-10-02 11:32:00', '2026-10-02 14:00:00')
ON DUPLICATE KEY UPDATE `priority_nutrient`=VALUES(`priority_nutrient`);

-- 12. Demo Fertilizer Schedule for Recommendation 1
INSERT INTO `fertilizer_schedules` (`id`, `recommendation_id`, `stage`, `stage_order`, `nutrient`, `fertilizer_category`, `timing`, `method`, `status`, `notes`) VALUES
(1, 1, 'PRE-SOWING', 1, 'Organic Carbon & Soil Biology', 'Organic Manure', '15-20 days before sowing', 'Deep incorporation during summer / disc ploughing', 'Completed', 'Incorporate well-rotted FYM or compost to improve moisture retention and soil organic carbon.'),
(2, 1, 'BASAL', 2, 'Phosphorus + Starter Nitrogen + Zinc', 'Compound (DAP) + Micronutrient (ZnSO4)', 'At sowing time (Day 0)', 'Band placement 4-5 cm below and to the side of seed', 'Scheduled', 'Ensure DAP and Zinc are applied in separate passes or separated by soil layer to prevent precipitation.'),
(3, 1, 'VEGETATIVE', 3, 'Nitrogen (Top Dress 1)', 'Nitrogen (Neem Coated Urea)', 'Crown Root Initiation (21-25 days after sowing)', 'Top dress followed immediately by irrigation', 'Scheduled', 'Apply 1st split of urea when plants show active secondary root initiation.'),
(4, 1, 'FLOWERING', 4, 'Nitrogen (Top Dress 2)', 'Nitrogen (Neem Coated Urea)', 'Tillering to Jointing (45-50 days after sowing)', 'Broadcasting in moist soil conditions', 'Scheduled', 'Apply remaining nitrogen dose prior to panicle emergence.'),
(5, 1, 'FRUIT_GRAIN_DEVELOPMENT', 5, 'Potassium & Micronutrients (Optional)', 'Foliar Spray (0:0:50 or 13:0:45)', 'Milking to Dough stage (75-80 days)', 'Foliar mist spray during cool evening hours', 'Scheduled', 'Demo guidance: Optional foliar potassium to maximize 1000-grain weight and test weight.'),
(6, 1, 'HARVEST', 6, 'Nutrient Audit & Residue Management', 'Crop Residue Incorporation', 'Post-harvest', 'Shred stubble and retain or incorporate in soil', 'Scheduled', 'Avoid burning crop residues. Retaining wheat straw restores potassium and organic carbon to soil.')
ON DUPLICATE KEY UPDATE `stage`=VALUES(`stage`);

-- 13. Demo Messages for Farmer 1
INSERT INTO `messages` (`id`, `farmer_id`, `admin_id`, `recommendation_id`, `subject`, `message`, `is_read`, `created_at`) VALUES
(1, 1, 2, 1, 'New Fertilizer Recommendation for Field 01', 'Your soil test for Field 01 (Sample ID: AGRI-ST-2026-001) has been analyzed. The analysis indicates that phosphorus and nitrogen require immediate attention. Your explainable fertilizer recommendation and multi-stage schedule are now ready.', TRUE, '2026-10-02 11:32:00'),
(2, 1, 2, 1, 'Soil Health Advisory: Organic Matter Replenishment', 'Agronomist Notice: Your recent test in Field 01 shows Organic Carbon at 0.42%. Incorporating organic amendments like farmyard manure before sowing will improve fertilizer efficiency by up to 25%.', FALSE, '2026-10-05 09:15:00')
ON DUPLICATE KEY UPDATE `subject`=VALUES(`subject`);

-- 14. Demo Notifications for Farmer 1
INSERT INTO `notifications` (`id`, `farmer_id`, `message_id`, `type`, `title`, `message`, `link`, `is_read`, `created_at`) VALUES
(1, 1, 1, 'recommendation_ready', 'New Recommendation Ready', 'Your fertilizer plan is ready for Field 01 - North Wheat Plot.', '/farmer/recommendation.html?id=1', TRUE, '2026-10-02 11:32:00'),
(2, 1, 2, 'new_message', 'Agronomist Advisory', 'Soil Health Advisory: Organic Matter Replenishment in Field 01.', '/farmer/messages.html', FALSE, '2026-10-05 09:15:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 15. Demo Fertilizer Application History for Farmer 1 (Field 01 & 02)
INSERT INTO `fertilizer_applications` (`id`, `farmer_id`, `farm_id`, `field_id`, `fertilizer_id`, `fertilizer_name`, `nutrient_composition`, `quantity`, `unit`, `application_date`, `application_method`, `crop`, `growth_stage`, `cost`, `notes`) VALUES
(1, 1, 1, 1, 7, 'Well-Decomposed Farmyard Manure (FYM)', '0.5% N, 0.2% P, 0.5% K', 4000.00, 'kg', '2026-06-10', 'Broadcast & Incorporation', 'Rice / Paddy', 'Pre-sowing', 3200.00, 'Basal organic compost prior to previous Kharif crop'),
(2, 1, 1, 1, 2, 'Di-Ammonium Phosphate (DAP)', '18-46-0', 100.00, 'kg', '2026-07-02', 'Basal Band Placement', 'Rice / Paddy', 'Transplanting', 2700.00, 'Two 50kg bags at planting'),
(3, 1, 1, 1, 1, 'Neem Coated Urea', '46% N', 100.00, 'kg', '2026-07-28', 'Top Dressing', 'Rice / Paddy', 'Active Tillering', 540.00, 'First top dress in standing water'),
(4, 1, 1, 1, 1, 'Neem Coated Urea', '46% N', 50.00, 'kg', '2026-08-25', 'Top Dressing', 'Rice / Paddy', 'Panicle Initiation', 270.00, 'Second split dressing'),
(5, 1, 1, 1, 3, 'Muriate of Potash (MOP)', '60% K2O', 50.00, 'kg', '2026-08-25', 'Broadcasting', 'Rice / Paddy', 'Panicle Initiation', 1700.00, 'Applied with second urea split')
ON DUPLICATE KEY UPDATE `fertilizer_name`=VALUES(`fertilizer_name`);
