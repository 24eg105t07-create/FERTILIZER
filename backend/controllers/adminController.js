/**
 * AgriWise: Admin / Lead Agronomist Controller
 * Manages system-wide agricultural data, soil test reviews,
 * recommendation generation, agronomist approval, and farmer dispatch.
 */

const db = require('../config/db');
const soilTestingService = require('../services/soilTestingService');
const soilAnalysisService = require('../services/soilAnalysisService');
const recommendationEngine = require('../services/recommendationEngine');
const notificationService = require('../services/notificationService');

class AdminController {
  /**
   * System-Wide Dashboard Telemetry & Chart Data
   */
  async getDashboardStats(req, res) {
    try {
      // 1. Core KPIs
      const farmersCount = await db.query("SELECT COUNT(*) as cnt FROM users WHERE role = 'farmer'");
      const farmsCount = await db.query('SELECT COUNT(*) as cnt FROM farms');
      const fieldsCount = await db.query('SELECT COUNT(*) as cnt FROM fields');

      const testCounts = await db.query(
        `SELECT
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_tests,
          COUNT(CASE WHEN status = 'REVIEW_REQUIRED' THEN 1 END) as review_required_tests,
          COUNT(CASE WHEN status = 'APPROVED' OR status = 'COMPLETED' THEN 1 END) as completed_tests,
          COUNT(*) as total_tests
         FROM soil_tests`
      );

      const recCounts = await db.query(
        `SELECT
          COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_recs,
          COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_recs,
          COUNT(CASE WHEN status = 'SENT' OR status = 'READ' THEN 1 END) as sent_recs,
          COUNT(*) as total_recs
         FROM fertilizer_recommendations`
      );

      // 2. Nutrient Deficiency Breakdown (Chart.js)
      const analyses = await db.query('SELECT nitrogen_status, phosphorus_status, potassium_status, organic_carbon_status FROM soil_analysis');
      const deficiencies = {
        'Nitrogen Deficient': 0,
        'Phosphorus Deficient': 0,
        'Potassium Deficient': 0,
        'Low Organic Carbon': 0,
        'Optimal Profile': 0
      };

      (analyses || []).forEach(a => {
        let isDeficient = false;
        if (a.nitrogen_status === 'LOW') { deficiencies['Nitrogen Deficient']++; isDeficient = true; }
        if (a.phosphorus_status === 'LOW') { deficiencies['Phosphorus Deficient']++; isDeficient = true; }
        if (a.potassium_status === 'LOW') { deficiencies['Potassium Deficient']++; isDeficient = true; }
        if (a.organic_carbon_status === 'LOW') { deficiencies['Low Organic Carbon']++; isDeficient = true; }
        if (!isDeficient) { deficiencies['Optimal Profile']++; }
      });

      // 3. Crop Distribution
      const cropDist = await db.query(
        'SELECT COALESCE(current_crop, "Unspecified") as crop, COUNT(*) as count FROM fields GROUP BY current_crop'
      );

      // 4. Soil Type Distribution
      const soilDist = await db.query(
        'SELECT COALESCE(soil_type, "Unknown") as soil, COUNT(*) as count FROM fields GROUP BY soil_type'
      );

      // 5. Recent soil tests pending action
      const pendingTests = await db.query(
        `SELECT st.*, f.farm_name, fd.field_name, fd.current_crop, u.name as farmer_name
         FROM soil_tests st
         JOIN farms f ON st.farm_id = f.id
         JOIN fields fd ON st.field_id = fd.id
         JOIN users u ON st.farmer_id = u.id
         WHERE st.status IN ('PENDING', 'REVIEW_REQUIRED')
         ORDER BY st.id DESC LIMIT 5`
      );

      return res.json({
        success: true,
        stats: {
          totalFarmers: farmersCount[0]?.cnt || 0,
          totalFarms: farmsCount[0]?.cnt || 0,
          totalFields: fieldsCount[0]?.cnt || 0,
          pendingTests: testCounts[0]?.pending_tests || 0,
          pendingReviews: testCounts[0]?.review_required_tests || 0,
          completedTests: testCounts[0]?.completed_tests || 0,
          totalTests: testCounts[0]?.total_tests || 0,
          draftRecommendations: recCounts[0]?.draft_recs || 0,
          approvedRecommendations: recCounts[0]?.approved_recs || 0,
          sentRecommendations: recCounts[0]?.sent_recs || 0,
          totalRecommendations: recCounts[0]?.total_recs || 0
        },
        charts: {
          deficiencies,
          cropDistribution: cropDist || [],
          soilDistribution: soilDist || []
        },
        pendingTests: pendingTests || []
      });
    } catch (err) {
      console.error('Admin getDashboardStats Error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving admin dashboard telemetry.' });
    }
  }

  // ===================== FARMERS MANAGEMENT =====================

  async getFarmers(req, res) {
    try {
      const search = req.query.search ? req.query.search.trim() : '';

      let sql = `
        SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at,
               p.state, p.district, p.village, p.farmer_type, p.total_farming_area,
               (SELECT COUNT(*) FROM farms WHERE farmer_id = u.id) as farms_count,
               (SELECT COUNT(*) FROM soil_tests WHERE farmer_id = u.id) as tests_count,
               (SELECT COUNT(*) FROM fertilizer_recommendations WHERE farmer_id = u.id AND status IN ('SENT', 'READ')) as recs_count
        FROM users u
        LEFT JOIN farmer_profiles p ON u.id = p.user_id
        WHERE u.role = 'farmer'
      `;
      const params = [];

      if (search) {
        sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR p.state LIKE ? OR p.district LIKE ?)';
        const queryTerm = `%${search}%`;
        params.push(queryTerm, queryTerm, queryTerm, queryTerm, queryTerm);
      }

      sql += ' ORDER BY u.id DESC';

      const farmers = await db.query(sql, params);
      return res.json({ success: true, farmers });
    } catch (err) {
      console.error('getFarmers Error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving farmers.' });
    }
  }

  async getFarmerById(req, res) {
    try {
      const farmerId = req.params.id;

      const userRows = await db.query(
        `SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at,
                p.country, p.state, p.district, p.village, p.preferred_language, p.farmer_type, p.total_farming_area
         FROM users u
         LEFT JOIN farmer_profiles p ON u.id = p.user_id
         WHERE u.id = ? AND u.role = 'farmer'`,
        [farmerId]
      );

      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Farmer not found.' });
      }

      const farmer = userRows[0];
      farmer.farms = await db.query('SELECT * FROM farms WHERE farmer_id = ? ORDER BY id DESC', [farmerId]);
      farmer.soil_tests = await db.query(
        `SELECT st.*, f.farm_name, fd.field_name, fd.current_crop
         FROM soil_tests st
         JOIN farms f ON st.farm_id = f.id
         JOIN fields fd ON st.field_id = fd.id
         WHERE st.farmer_id = ? ORDER BY st.id DESC`,
        [farmerId]
      );
      farmer.recommendations = await db.query(
        `SELECT r.*, f.farm_name, fd.field_name
         FROM fertilizer_recommendations r
         JOIN farms f ON r.farm_id = f.id
         JOIN fields fd ON r.field_id = fd.id
         WHERE r.farmer_id = ? ORDER BY r.id DESC`,
        [farmerId]
      );

      return res.json({ success: true, farmer });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }

  // ===================== SOIL TESTS MANAGEMENT =====================

  async getSoilTests(req, res) {
    try {
      const { status, search } = req.query;

      let sql = `
        SELECT st.*, f.farm_name, f.state, f.district,
               fd.field_name, fd.current_crop, fd.soil_type as field_soil_type,
               u.name as farmer_name, u.email as farmer_email,
               sa.nitrogen_status, sa.phosphorus_status, sa.potassium_status, sa.ph_status,
               r.id as recommendation_id, r.status as recommendation_status
        FROM soil_tests st
        JOIN farms f ON st.farm_id = f.id
        JOIN fields fd ON st.field_id = fd.id
        JOIN users u ON st.farmer_id = u.id
        LEFT JOIN soil_analysis sa ON st.id = sa.soil_test_id
        LEFT JOIN fertilizer_recommendations r ON st.id = r.soil_test_id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        sql += ' AND st.status = ?';
        params.push(status);
      }

      if (search) {
        sql += ' AND (st.sample_id LIKE ? OR u.name LIKE ? OR f.farm_name LIKE ? OR fd.field_name LIKE ?)';
        const queryTerm = `%${search.trim()}%`;
        params.push(queryTerm, queryTerm, queryTerm, queryTerm);
      }

      sql += ' ORDER BY st.id DESC';

      const tests = await db.query(sql, params);
      return res.json({ success: true, tests });
    } catch (err) {
      console.error('admin getSoilTests Error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving soil tests.' });
    }
  }

  async getSoilTestById(req, res) {
    try {
      const test = await soilTestingService.getSoilTestDetails(req.params.id);
      if (!test) {
        return res.status(404).json({ success: false, message: 'Soil test not found.' });
      }
      return res.json({ success: true, test });
    } catch (err) {
      console.error('admin getSoilTestById error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Server error.' });
    }
  }

  async analyzeSoilTest(req, res) {
    try {
      const soilTestId = req.params.id;
      const analysis = await soilAnalysisService.analyzeSoilTest(soilTestId);

      return res.json({
        success: true,
        message: 'Soil parameters analyzed and classified successfully!',
        analysis
      });
    } catch (err) {
      console.error('analyzeSoilTest Error:', err);
      return res.status(400).json({ success: false, message: err.message || 'Error analyzing soil test.' });
    }
  }

  // ===================== RECOMMENDATIONS WORKFLOW =====================

  async generateRecommendation(req, res) {
    try {
      const { soil_test_id } = req.body;
      if (!soil_test_id) {
        return res.status(400).json({ success: false, message: 'Soil test ID is required.' });
      }

      const recommendation = await recommendationEngine.generateRecommendation(soil_test_id, req.user.id);

      return res.status(201).json({
        success: true,
        message: 'Fertilizer recommendation draft generated successfully by rule engine!',
        recommendation
      });
    } catch (err) {
      console.error('generateRecommendation Error:', err);
      return res.status(400).json({ success: false, message: err.message || 'Error generating recommendation.' });
    }
  }

  async getRecommendations(req, res) {
    try {
      const { status, search } = req.query;

      let sql = `
        SELECT r.*, f.farm_name, f.state, f.district,
               fd.field_name, fd.current_crop,
               st.sample_id, st.test_date,
               u.name as farmer_name, u.email as farmer_email,
               adm.name as agronomist_name
        FROM fertilizer_recommendations r
        JOIN farms f ON r.farm_id = f.id
        JOIN fields fd ON r.field_id = fd.id
        JOIN soil_tests st ON r.soil_test_id = st.id
        JOIN users u ON r.farmer_id = u.id
        LEFT JOIN users adm ON r.admin_id = adm.id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        sql += ' AND r.status = ?';
        params.push(status);
      }

      if (search) {
        sql += ' AND (u.name LIKE ? OR f.farm_name LIKE ? OR fd.field_name LIKE ? OR st.sample_id LIKE ?)';
        const queryTerm = `%${search.trim()}%`;
        params.push(queryTerm, queryTerm, queryTerm, queryTerm);
      }

      sql += ' ORDER BY r.id DESC';

      const recommendations = await db.query(sql, params);
      return res.json({ success: true, recommendations });
    } catch (err) {
      console.error('admin getRecommendations Error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving recommendations.' });
    }
  }

  async getRecommendationById(req, res) {
    try {
      const recId = req.params.id;

      const recRows = await db.query(
        `SELECT r.*, f.farm_name, f.state, f.district, f.village,
                fd.field_name, fd.area as field_area, fd.soil_type, fd.current_crop, fd.previous_crop,
                st.sample_id, st.test_date, st.lab_name, st.report_file_path,
                u.name as farmer_name, u.email as farmer_email, u.phone as farmer_phone,
                adm.name as agronomist_name
         FROM fertilizer_recommendations r
         JOIN farms f ON r.farm_id = f.id
         JOIN fields fd ON r.field_id = fd.id
         JOIN soil_tests st ON r.soil_test_id = st.id
         JOIN users u ON r.farmer_id = u.id
         LEFT JOIN users adm ON r.admin_id = adm.id
         WHERE r.id = ?`,
        [recId]
      );

      if (!recRows || recRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Recommendation not found.' });
      }

      const recommendation = recRows[0];

      // Parameters
      const pRows = await db.query('SELECT * FROM soil_parameters WHERE soil_test_id = ?', [recommendation.soil_test_id]);
      recommendation.parameters = pRows && pRows.length > 0 ? pRows[0] : null;

      // Analysis
      const aRows = await db.query('SELECT * FROM soil_analysis WHERE soil_test_id = ?', [recommendation.soil_test_id]);
      recommendation.analysis = aRows && aRows.length > 0 ? aRows[0] : null;

      // Schedules
      const schedules = await db.query(
        'SELECT * FROM fertilizer_schedules WHERE recommendation_id = ? ORDER BY stage_order ASC',
        [recId]
      );
      recommendation.schedules = schedules || [];

      return res.json({ success: true, recommendation });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }

  async updateRecommendation(req, res) {
    try {
      const recId = req.params.id;
      const {
        priority_nutrient, fertilizer_name, recommendation_text,
        application_timing, application_method, number_of_applications,
        soil_improvement_suggestions, warnings, explanation, admin_comments, status
      } = req.body;

      await db.query(
        `UPDATE fertilizer_recommendations SET
          priority_nutrient = COALESCE(?, priority_nutrient),
          fertilizer_name = COALESCE(?, fertilizer_name),
          recommendation_text = COALESCE(?, recommendation_text),
          application_timing = COALESCE(?, application_timing),
          application_method = COALESCE(?, application_method),
          number_of_applications = COALESCE(?, number_of_applications),
          soil_improvement_suggestions = COALESCE(?, soil_improvement_suggestions),
          warnings = COALESCE(?, warnings),
          explanation = COALESCE(?, explanation),
          admin_comments = COALESCE(?, admin_comments),
          status = COALESCE(?, status),
          admin_id = ?
         WHERE id = ?`,
        [
          priority_nutrient || null, fertilizer_name || null, recommendation_text || null,
          application_timing || null, application_method || null,
          number_of_applications ? parseInt(number_of_applications, 10) : null,
          soil_improvement_suggestions || null, warnings || null,
          explanation || null, admin_comments || null, status || null,
          req.user.id, recId
        ]
      );

      return res.json({ success: true, message: 'Recommendation updated successfully.' });
    } catch (err) {
      console.error('updateRecommendation Error:', err);
      return res.status(500).json({ success: false, message: 'Server error updating recommendation.' });
    }
  }

  async approveRecommendation(req, res) {
    try {
      const recId = req.params.id;
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      const existing = await db.query('SELECT status, soil_test_id FROM fertilizer_recommendations WHERE id = ?', [recId]);
      if (!existing || existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Recommendation not found.' });
      }

      await db.query(
        `UPDATE fertilizer_recommendations
         SET status = 'APPROVED', approved_at = ?, admin_id = ?
         WHERE id = ?`,
        [now, req.user.id, recId]
      );

      return res.json({
        success: true,
        message: 'Recommendation approved by agronomist! Ready to send to farmer.',
        status: 'APPROVED'
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error approving recommendation.' });
    }
  }

  async sendRecommendation(req, res) {
    try {
      const recId = req.params.id;
      const result = await notificationService.sendRecommendationToFarmer(recId, req.user.id);

      return res.json({
        success: true,
        message: 'Recommendation successfully dispatched to Farmer! Message and notification created.',
        data: result
      });
    } catch (err) {
      console.error('sendRecommendation Error:', err);
      return res.status(400).json({ success: false, message: err.message || 'Error dispatching recommendation.' });
    }
  }

  // ===================== CROPS & FERTILIZERS CATALOGUE =====================

  async getCrops(req, res) {
    try {
      const crops = await db.query('SELECT * FROM crops ORDER BY name ASC');
      return res.json({ success: true, crops });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }

  async getFertilizers(req, res) {
    try {
      const fertilizers = await db.query('SELECT * FROM fertilizers ORDER BY type ASC, name ASC');
      return res.json({ success: true, fertilizers });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }

  // ===================== ALL FARMS & FIELDS DIRECTORY =====================

  async getAllFarms(req, res) {
    try {
      const farms = await db.query(
        `SELECT f.*, u.name as farmer_name, u.email as farmer_email,
                (SELECT COUNT(*) FROM fields WHERE farm_id = f.id) as fields_count
         FROM farms f
         JOIN users u ON f.farmer_id = u.id
         ORDER BY f.id DESC`
      );
      return res.json({ success: true, farms });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }

  async getAllFields(req, res) {
    try {
      const fields = await db.query(
        `SELECT fd.*, f.farm_name, f.state, f.district, u.name as farmer_name
         FROM fields fd
         JOIN farms f ON fd.farm_id = f.id
         JOIN users u ON f.farmer_id = u.id
         ORDER BY fd.id DESC`
      );
      return res.json({ success: true, fields });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }

  async getMessages(req, res) {
    try {
      const messages = await db.query(
        `SELECT m.*, u.name as farmer_name, u.email as farmer_email, adm.name as sender_name
         FROM messages m
         JOIN users u ON m.farmer_id = u.id
         LEFT JOIN users adm ON m.admin_id = adm.id
         ORDER BY m.id DESC`
      );
      return res.json({ success: true, messages });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }

  // ===================== CROPS CRUD =====================

  async createCrop(req, res) {
    try {
      const { name, variety, season, growth_duration, target_yield, nutrient_requirements, description } = req.body;
      if (!name) return res.status(400).json({ success: false, message: 'Crop name is required.' });

      const result = await db.query(
        `INSERT INTO crops (name, variety, season, growth_duration, target_yield, nutrient_requirements, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, variety || null, season || 'Kharif', growth_duration || 120, target_yield || 25, nutrient_requirements || '', description || '']
      );

      return res.status(201).json({
        success: true,
        message: 'Crop added successfully to agricultural database.',
        cropId: result.insertId
      });
    } catch (err) {
      console.error('createCrop error:', err);
      return res.status(500).json({ success: false, message: 'Server error creating crop.' });
    }
  }

  async updateCrop(req, res) {
    try {
      const { id } = req.params;
      const { name, variety, season, growth_duration, target_yield, nutrient_requirements, description } = req.body;

      await db.query(
        `UPDATE crops SET
          name = COALESCE(?, name),
          variety = COALESCE(?, variety),
          season = COALESCE(?, season),
          growth_duration = COALESCE(?, growth_duration),
          target_yield = COALESCE(?, target_yield),
          nutrient_requirements = COALESCE(?, nutrient_requirements),
          description = COALESCE(?, description)
         WHERE id = ?`,
        [name, variety, season, growth_duration, target_yield, nutrient_requirements, description, id]
      );

      return res.json({ success: true, message: 'Crop updated successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error updating crop.' });
    }
  }

  async deleteCrop(req, res) {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM crops WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Crop deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error deleting crop.' });
    }
  }

  // ===================== FERTILIZERS CRUD =====================

  async createFertilizer(req, res) {
    try {
      const { name, type, nutrient_composition, description, suitable_crops, application_method_default } = req.body;
      if (!name || !type || !nutrient_composition) {
        return res.status(400).json({ success: false, message: 'Name, type, and composition are required.' });
      }

      const result = await db.query(
        `INSERT INTO fertilizers (name, type, nutrient_composition, description, suitable_crops, application_method_default)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, type, nutrient_composition, description || '', suitable_crops || 'All Crops', application_method_default || 'Basal or Split Top Dress']
      );

      return res.status(201).json({
        success: true,
        message: 'Fertilizer added to catalog successfully.',
        fertilizerId: result.insertId
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error creating fertilizer.' });
    }
  }

  async updateFertilizer(req, res) {
    try {
      const { id } = req.params;
      const { name, type, nutrient_composition, description, suitable_crops, application_method_default } = req.body;

      await db.query(
        `UPDATE fertilizers SET
          name = COALESCE(?, name),
          type = COALESCE(?, type),
          nutrient_composition = COALESCE(?, nutrient_composition),
          description = COALESCE(?, description),
          suitable_crops = COALESCE(?, suitable_crops),
          application_method_default = COALESCE(?, application_method_default)
         WHERE id = ?`,
        [name, type, nutrient_composition, description, suitable_crops, application_method_default, id]
      );

      return res.json({ success: true, message: 'Fertilizer updated successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error updating fertilizer.' });
    }
  }

  async deleteFertilizer(req, res) {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM fertilizers WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Fertilizer deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error deleting fertilizer.' });
    }
  }

  // ===================== DETAILED ANALYTICS =====================

  async getAnalytics(req, res) {
    try {
      const totalFarmers = await db.query("SELECT COUNT(*) as cnt FROM users WHERE role = 'farmer'");
      const totalFarms = await db.query('SELECT COUNT(*) as cnt FROM farms');
      const totalFields = await db.query('SELECT COUNT(*) as cnt FROM fields');
      const totalTests = await db.query('SELECT COUNT(*) as cnt FROM soil_tests');
      const totalRecs = await db.query('SELECT COUNT(*) as cnt FROM fertilizer_recommendations');

      // Nitrogen statuses
      const analyses = await db.query('SELECT nitrogen_status, phosphorus_status, potassium_status, ph_status, ec_status, organic_carbon_status FROM soil_analysis');
      const nutrientStats = {
        n: { LOW: 0, MEDIUM: 0, OPTIMAL: 0, HIGH: 0 },
        p: { LOW: 0, MEDIUM: 0, OPTIMAL: 0, HIGH: 0 },
        k: { LOW: 0, MEDIUM: 0, OPTIMAL: 0, HIGH: 0 },
        ph: { ACIDIC: 0, OPTIMAL: 0, ALKALINE: 0 },
        oc: { LOW: 0, MEDIUM: 0, HIGH: 0 }
      };

      (analyses || []).forEach(a => {
        if (a.nitrogen_status && nutrientStats.n[a.nitrogen_status] !== undefined) nutrientStats.n[a.nitrogen_status]++;
        if (a.phosphorus_status && nutrientStats.p[a.phosphorus_status] !== undefined) nutrientStats.p[a.phosphorus_status]++;
        if (a.potassium_status && nutrientStats.k[a.potassium_status] !== undefined) nutrientStats.k[a.potassium_status]++;
        if (a.ph_status && nutrientStats.ph[a.ph_status] !== undefined) nutrientStats.ph[a.ph_status]++;
        if (a.organic_carbon_status && nutrientStats.oc[a.organic_carbon_status] !== undefined) nutrientStats.oc[a.organic_carbon_status]++;
      });

      // Top crops
      const cropStats = await db.query(
        'SELECT COALESCE(current_crop, "Other") as crop, COUNT(*) as count FROM fields GROUP BY current_crop ORDER BY count DESC LIMIT 8'
      );

      // Top soils
      const soilStats = await db.query(
        'SELECT COALESCE(soil_type, "Other") as soil_type, COUNT(*) as count FROM fields GROUP BY soil_type ORDER BY count DESC LIMIT 8'
      );

      // Recommendations by status
      const recStats = await db.query(
        'SELECT status, COUNT(*) as count FROM fertilizer_recommendations GROUP BY status'
      );

      return res.json({
        success: true,
        summary: {
          totalFarmers: totalFarmers[0]?.cnt || 0,
          totalFarms: totalFarms[0]?.cnt || 0,
          totalFields: totalFields[0]?.cnt || 0,
          totalTests: totalTests[0]?.cnt || 0,
          totalRecs: totalRecs[0]?.cnt || 0
        },
        nutrientStats,
        cropStats: cropStats || [],
        soilStats: soilStats || [],
        recStats: recStats || []
      });
    } catch (err) {
      console.error('getAnalytics error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving analytics.' });
    }
  }

  // ===================== REPORTS & AUDIT =====================

  async getReports(req, res) {
    try {
      const recentTests = await db.query(
        `SELECT st.id, st.sample_id, st.test_date, st.status, st.lab_name,
                f.farm_name, fd.field_name, fd.current_crop,
                u.name as farmer_name, u.email as farmer_email
         FROM soil_tests st
         JOIN farms f ON st.farm_id = f.id
         JOIN fields fd ON st.field_id = fd.id
         JOIN users u ON st.farmer_id = u.id
         ORDER BY st.id DESC LIMIT 50`
      );

      const recentRecs = await db.query(
        `SELECT r.id, r.priority_nutrient, r.fertilizer_name, r.status, r.created_at, r.approved_at, r.sent_at,
                f.farm_name, fd.field_name,
                u.name as farmer_name, adm.name as agronomist_name
         FROM fertilizer_recommendations r
         JOIN farms f ON r.farm_id = f.id
         JOIN fields fd ON r.field_id = fd.id
         JOIN users u ON r.farmer_id = u.id
         LEFT JOIN users adm ON r.admin_id = adm.id
         ORDER BY r.id DESC LIMIT 50`
      );

      return res.json({
        success: true,
        tests: recentTests || [],
        recommendations: recentRecs || []
      });
    } catch (err) {
      console.error('getReports error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving report data.' });
    }
  }

  // ===================== RULES & THRESHOLDS =====================

  async getRules(req, res) {
    try {
      const rules = await db.query('SELECT * FROM recommendation_rules ORDER BY id ASC');
      return res.json({ success: true, rules });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error retrieving rules.' });
    }
  }

  async updateRule(req, res) {
    try {
      const { id } = req.params;
      const { low_threshold, high_threshold, optimal_min, optimal_max, guidance_text } = req.body;

      await db.query(
        `UPDATE recommendation_rules SET
          low_threshold = COALESCE(?, low_threshold),
          high_threshold = COALESCE(?, high_threshold),
          optimal_min = COALESCE(?, optimal_min),
          optimal_max = COALESCE(?, optimal_max),
          guidance_text = COALESCE(?, guidance_text)
         WHERE id = ?`,
        [low_threshold, high_threshold, optimal_min, optimal_max, guidance_text, id]
      );

      return res.json({ success: true, message: 'Recommendation rule updated successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error updating rule.' });
    }
  }
}

module.exports = new AdminController();
