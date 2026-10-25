/**
 * AgriWise: Farmer Controller
 * Strictly enforces Farmer data isolation:
 * Farmer A can never see or mutate Farmer B's data!
 */

const db = require('../config/db');
const soilTestingService = require('../services/soilTestingService');

class FarmerController {
  /**
   * Farmer Dashboard Aggregate Telemetry
   */
  async getDashboardStats(req, res) {
    try {
      const farmerId = req.user.id;

      // 1. Farms & Fields count
      const farms = await db.query('SELECT id FROM farms WHERE farmer_id = ?', [farmerId]);
      const farmIds = (farms || []).map(f => f.id);

      let fieldsCount = 0;
      let activeCropsCount = 0;

      if (farmIds.length > 0) {
        const fields = await db.query(
          `SELECT COUNT(*) as cnt, COUNT(DISTINCT current_crop) as crops_cnt
           FROM fields WHERE farm_id IN (${farmIds.map(() => '?').join(',')})`,
          farmIds
        );
        fieldsCount = fields[0]?.cnt || 0;
        activeCropsCount = fields[0]?.crops_cnt || 0;
      }

      // 2. Soil Tests Counts
      const testCounts = await db.query(
        `SELECT
          COUNT(CASE WHEN status = 'PENDING' OR status = 'IN_TESTING' OR status = 'REVIEW_REQUIRED' THEN 1 END) as pending_tests,
          COUNT(CASE WHEN status = 'APPROVED' OR status = 'COMPLETED' THEN 1 END) as completed_tests,
          COUNT(*) as total_tests
         FROM soil_tests WHERE farmer_id = ?`,
        [farmerId]
      );

      // 3. Unread Messages & Notifications
      const unreadMsgs = await db.query(
        'SELECT COUNT(*) as unread_count FROM messages WHERE farmer_id = ? AND is_read = FALSE',
        [farmerId]
      );
      const unreadNotifs = await db.query(
        'SELECT COUNT(*) as unread_count FROM notifications WHERE farmer_id = ? AND is_read = FALSE',
        [farmerId]
      );

      // 4. Latest Recommendation
      const latestRecs = await db.query(
        `SELECT r.*, f.farm_name, fd.field_name, fd.current_crop
         FROM fertilizer_recommendations r
         JOIN farms f ON r.farm_id = f.id
         JOIN fields fd ON r.field_id = fd.id
         WHERE r.farmer_id = ? AND r.status IN ('SENT', 'READ')
         ORDER BY r.id DESC LIMIT 1`,
        [farmerId]
      );

      // 5. Recent Activity Items
      const latestTest = await db.query(
        `SELECT st.*, f.farm_name, fd.field_name
         FROM soil_tests st
         JOIN farms f ON st.farm_id = f.id
         JOIN fields fd ON st.field_id = fd.id
         WHERE st.farmer_id = ? ORDER BY st.id DESC LIMIT 1`,
        [farmerId]
      );

      const latestMessage = await db.query(
        'SELECT * FROM messages WHERE farmer_id = ? ORDER BY id DESC LIMIT 1',
        [farmerId]
      );

      // 6. Chart Data: Soil Nutrients & pH from latest test
      let latestParams = null;
      if (latestTest && latestTest.length > 0) {
        const pRows = await db.query(
          'SELECT * FROM soil_parameters WHERE soil_test_id = ?',
          [latestTest[0].id]
        );
        latestParams = pRows && pRows.length > 0 ? pRows[0] : null;
      }

      return res.json({
        success: true,
        stats: {
          totalFarms: farms.length,
          totalFields: fieldsCount,
          activeCrops: activeCropsCount,
          pendingTests: testCounts[0]?.pending_tests || 0,
          completedTests: testCounts[0]?.completed_tests || 0,
          totalTests: testCounts[0]?.total_tests || 0,
          unreadMessages: unreadMsgs[0]?.unread_count || 0,
          unreadNotifications: unreadNotifs[0]?.unread_count || 0
        },
        latestRecommendation: latestRecs && latestRecs.length > 0 ? latestRecs[0] : null,
        recentActivity: {
          latestTest: latestTest && latestTest.length > 0 ? latestTest[0] : null,
          latestMessage: latestMessage && latestMessage.length > 0 ? latestMessage[0] : null
        },
        latestParameters: latestParams
      });
    } catch (err) {
      console.error('getDashboardStats Error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving dashboard telemetry.' });
    }
  }

  // ===================== FARMS CRUD =====================

  async getFarms(req, res) {
    try {
      const farms = await db.query(
        `SELECT f.*,
                (SELECT COUNT(*) FROM fields WHERE farm_id = f.id) as fields_count
         FROM farms f
         WHERE f.farmer_id = ?
         ORDER BY f.id DESC`,
        [req.user.id]
      );
      return res.json({ success: true, farms });
    } catch (err) {
      console.error('getFarms Error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving farms.' });
    }
  }

  async getFarmById(req, res) {
    try {
      const farms = await db.query(
        'SELECT * FROM farms WHERE id = ? AND farmer_id = ?',
        [req.params.id, req.user.id]
      );
      if (!farms || farms.length === 0) {
        return res.status(404).json({ success: false, message: 'Farm not found or access denied.' });
      }
      return res.json({ success: true, farm: farms[0] });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }

  async createFarm(req, res) {
    try {
      const {
        farm_name, country, state, district, village, location, area,
        ownership_type, irrigation, water_source, farming_type
      } = req.body;

      if (!farm_name || !state || !district) {
        return res.status(400).json({
          success: false,
          message: 'Farm name, state, and district are mandatory.'
        });
      }

      const result = await db.query(
        `INSERT INTO farms (
          farmer_id, farm_name, country, state, district, village, location, area,
          ownership_type, irrigation, water_source, farming_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          farm_name.trim(),
          country || 'India',
          state.trim(),
          district.trim(),
          village ? village.trim() : null,
          location ? location.trim() : null,
          area ? parseFloat(area) : 1.00,
          ownership_type || 'Owned',
          irrigation || 'Canal / Tubewell',
          water_source || 'Groundwater',
          farming_type || 'Conventional'
        ]
      );

      return res.status(201).json({
        success: true,
        message: 'Farm added successfully!',
        farmId: result.insertId
      });
    } catch (err) {
      console.error('createFarm Error:', err);
      return res.status(500).json({ success: false, message: 'Server error saving farm.' });
    }
  }

  async updateFarm(req, res) {
    try {
      const farmId = req.params.id;
      const farmerId = req.user.id;

      // Ownership verify
      const existing = await db.query('SELECT id FROM farms WHERE id = ? AND farmer_id = ?', [farmId, farmerId]);
      if (!existing || existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Farm not found or unauthorized.' });
      }

      const {
        farm_name, country, state, district, village, location, area,
        ownership_type, irrigation, water_source, farming_type
      } = req.body;

      await db.query(
        `UPDATE farms SET
          farm_name = COALESCE(?, farm_name),
          country = COALESCE(?, country),
          state = COALESCE(?, state),
          district = COALESCE(?, district),
          village = COALESCE(?, village),
          location = COALESCE(?, location),
          area = COALESCE(?, area),
          ownership_type = COALESCE(?, ownership_type),
          irrigation = COALESCE(?, irrigation),
          water_source = COALESCE(?, water_source),
          farming_type = COALESCE(?, farming_type),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND farmer_id = ?`,
        [
          farm_name || null, country || null, state || null, district || null,
          village || null, location || null, area !== undefined ? parseFloat(area) : null,
          ownership_type || null, irrigation || null, water_source || null, farming_type || null,
          farmId, farmerId
        ]
      );

      return res.json({ success: true, message: 'Farm updated successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error updating farm.' });
    }
  }

  async deleteFarm(req, res) {
    try {
      const farmId = req.params.id;
      const farmerId = req.user.id;

      const existing = await db.query('SELECT id FROM farms WHERE id = ? AND farmer_id = ?', [farmId, farmerId]);
      if (!existing || existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Farm not found or unauthorized.' });
      }

      await db.query('DELETE FROM farms WHERE id = ? AND farmer_id = ?', [farmId, farmerId]);
      return res.json({ success: true, message: 'Farm deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error deleting farm.' });
    }
  }

  // ===================== FIELDS CRUD =====================

  async getFields(req, res) {
    try {
      const farmerId = req.user.id;
      const farmId = req.query.farm_id;

      let sql = `
        SELECT fd.*, f.farm_name, f.state, f.district
        FROM fields fd
        JOIN farms f ON fd.farm_id = f.id
        WHERE f.farmer_id = ?
      `;
      const params = [farmerId];

      if (farmId) {
        sql += ' AND fd.farm_id = ?';
        params.push(farmId);
      }

      sql += ' ORDER BY fd.id DESC';

      const fields = await db.query(sql, params);
      return res.json({ success: true, fields });
    } catch (err) {
      console.error('getFields Error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving fields.' });
    }
  }

  async getFieldById(req, res) {
    try {
      const fields = await db.query(
        `SELECT fd.*, f.farm_name
         FROM fields fd
         JOIN farms f ON fd.farm_id = f.id
         WHERE fd.id = ? AND f.farmer_id = ?`,
        [req.params.id, req.user.id]
      );
      if (!fields || fields.length === 0) {
        return res.status(404).json({ success: false, message: 'Field not found or unauthorized.' });
      }
      return res.json({ success: true, field: fields[0] });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }

  async createField(req, res) {
    try {
      const {
        farm_id, field_name, area, soil_type, irrigation_type, drainage,
        current_crop, previous_crop, sowing_date, harvest_date, farming_method, topography
      } = req.body;

      if (!farm_id || !field_name || !soil_type) {
        return res.status(400).json({
          success: false,
          message: 'Farm selection, field name/number, and soil type are required.'
        });
      }

      const numFarmId = parseInt(farm_id, 10);
      const farmerId = parseInt(req.user.id, 10);

      // Verify farm ownership
      const farm = await db.query('SELECT id FROM farms WHERE id = ? AND farmer_id = ?', [numFarmId, farmerId]);
      if (!farm || farm.length === 0) {
        return res.status(403).json({ success: false, message: 'Unauthorized farm selection.' });
      }

      const result = await db.query(
        `INSERT INTO fields (
          farm_id, field_name, area, soil_type, irrigation_type, drainage,
          current_crop, previous_crop, sowing_date, harvest_date, farming_method, topography
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          numFarmId,
          field_name.trim(),
          area ? parseFloat(area) : 1.00,
          soil_type.trim(),
          irrigation_type || 'Flood / Furrow',
          drainage || 'Moderate',
          current_crop ? current_crop.trim() : null,
          previous_crop ? previous_crop.trim() : null,
          sowing_date || null,
          harvest_date || null,
          farming_method || 'Conventional',
          topography || 'Flat / Plain'
        ]
      );

      return res.status(201).json({
        success: true,
        message: 'Field added successfully!',
        fieldId: result.insertId
      });
    } catch (err) {
      console.error('createField Error:', err);
      return res.status(500).json({ success: false, message: 'Server error saving field.' });
    }
  }

  async updateField(req, res) {
    try {
      const fieldId = req.params.id;
      const farmerId = req.user.id;

      // Ownership verify via farm
      const check = await db.query(
        'SELECT fd.id FROM fields fd JOIN farms f ON fd.farm_id = f.id WHERE fd.id = ? AND f.farmer_id = ?',
        [fieldId, farmerId]
      );
      if (!check || check.length === 0) {
        return res.status(404).json({ success: false, message: 'Field not found or unauthorized.' });
      }

      const {
        field_name, area, soil_type, irrigation_type, drainage,
        current_crop, previous_crop, sowing_date, harvest_date, farming_method, topography
      } = req.body;

      await db.query(
        `UPDATE fields SET
          field_name = COALESCE(?, field_name),
          area = COALESCE(?, area),
          soil_type = COALESCE(?, soil_type),
          irrigation_type = COALESCE(?, irrigation_type),
          drainage = COALESCE(?, drainage),
          current_crop = COALESCE(?, current_crop),
          previous_crop = COALESCE(?, previous_crop),
          sowing_date = COALESCE(?, sowing_date),
          harvest_date = COALESCE(?, harvest_date),
          farming_method = COALESCE(?, farming_method),
          topography = COALESCE(?, topography),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          field_name || null, area !== undefined ? parseFloat(area) : null,
          soil_type || null, irrigation_type || null, drainage || null,
          current_crop || null, previous_crop || null, sowing_date || null,
          harvest_date || null, farming_method || null, topography || null,
          fieldId
        ]
      );

      return res.json({ success: true, message: 'Field updated successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error updating field.' });
    }
  }

  async deleteField(req, res) {
    try {
      const fieldId = req.params.id;
      const farmerId = req.user.id;

      const check = await db.query(
        'SELECT fd.id FROM fields fd JOIN farms f ON fd.farm_id = f.id WHERE fd.id = ? AND f.farmer_id = ?',
        [fieldId, farmerId]
      );
      if (!check || check.length === 0) {
        return res.status(404).json({ success: false, message: 'Field not found or unauthorized.' });
      }

      await db.query('DELETE FROM fields WHERE id = ?', [fieldId]);
      return res.json({ success: true, message: 'Field deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error deleting field.' });
    }
  }

  // ===================== SOIL TESTS =====================

  async submitSoilTest(req, res) {
    try {
      const farmerId = req.user.id;
      const {
        farm_id, field_id, sample_id, test_date, lab_name, notes,
        nitrogen, phosphorus, potassium, ph, ec, organic_carbon, organic_matter,
        sulfur, calcium, magnesium, zinc, iron, boron, manganese, copper,
        soil_type, soil_color, soil_texture, soil_depth, soil_moisture, drainage
      } = req.body;

      if (!farm_id || !field_id) {
        return res.status(400).json({
          success: false,
          message: 'Both Farm and Field must be selected.'
        });
      }

      const filePath = req.file ? `/uploads/${req.file.filename}` : null;

      const result = await soilTestingService.submitSoilTest({
        farmerId,
        farmId: parseInt(farm_id, 10),
        fieldId: parseInt(field_id, 10),
        sampleId: sample_id,
        testDate: test_date,
        labName: lab_name,
        notes: notes,
        filePath,
        parameters: {
          nitrogen, phosphorus, potassium, ph, ec, organic_carbon, organic_matter,
          sulfur, calcium, magnesium, zinc, iron, boron, manganese, copper,
          soil_type, soil_color, soil_texture, soil_depth, soil_moisture, drainage
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Soil test submitted successfully! It is now queued for agronomist review.',
        soilTestId: result.soilTestId,
        test: result
      });
    } catch (err) {
      console.error('submitSoilTest Error:', err);
      return res.status(400).json({ success: false, message: err.message || 'Error submitting soil test.' });
    }
  }

  async getSoilTests(req, res) {
    try {
      const tests = await db.query(
        `SELECT st.*, f.farm_name, fd.field_name, fd.current_crop,
                sa.nitrogen_status, sa.phosphorus_status, sa.potassium_status, sa.ph_status,
                (SELECT COUNT(*) FROM fertilizer_recommendations WHERE soil_test_id = st.id AND status IN ('SENT', 'READ')) as rec_available
         FROM soil_tests st
         JOIN farms f ON st.farm_id = f.id
         JOIN fields fd ON st.field_id = fd.id
         LEFT JOIN soil_analysis sa ON st.id = sa.soil_test_id
         WHERE st.farmer_id = ?
         ORDER BY st.id DESC`,
        [req.user.id]
      );
      return res.json({ success: true, tests });
    } catch (err) {
      console.error('getSoilTests Error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving soil tests.' });
    }
  }

  async getSoilTestById(req, res) {
    try {
      const test = await soilTestingService.getSoilTestDetails(req.params.id, req.user.id);
      if (!test) {
        return res.status(404).json({ success: false, message: 'Soil test not found or access denied.' });
      }
      return res.json({ success: true, test });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }

  // ===================== RECOMMENDATIONS =====================

  async getRecommendations(req, res) {
    try {
      const recs = await db.query(
        `SELECT r.*, f.farm_name, fd.field_name, fd.current_crop, st.sample_id, st.test_date,
                u.name as agronomist_name
         FROM fertilizer_recommendations r
         JOIN farms f ON r.farm_id = f.id
         JOIN fields fd ON r.field_id = fd.id
         JOIN soil_tests st ON r.soil_test_id = st.id
         LEFT JOIN users u ON r.admin_id = u.id
         WHERE r.farmer_id = ? AND r.status IN ('SENT', 'READ')
         ORDER BY r.id DESC`,
        [req.user.id]
      );
      return res.json({ success: true, recommendations: recs });
    } catch (err) {
      console.error('getRecommendations Error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving recommendations.' });
    }
  }

  async getRecommendationById(req, res) {
    try {
      const recId = req.params.id;
      const farmerId = req.user.id;

      const recs = await db.query(
        `SELECT r.*, f.farm_name, f.state, f.district, f.village,
                fd.field_name, fd.area as field_area, fd.soil_type, fd.current_crop, fd.previous_crop,
                st.sample_id, st.test_date, st.lab_name, st.report_file_path,
                u.name as agronomist_name
         FROM fertilizer_recommendations r
         JOIN farms f ON r.farm_id = f.id
         JOIN fields fd ON r.field_id = fd.id
         JOIN soil_tests st ON r.soil_test_id = st.id
         LEFT JOIN users u ON r.admin_id = u.id
         WHERE r.id = ? AND r.farmer_id = ? AND r.status IN ('SENT', 'READ')`,
        [recId, farmerId]
      );

      if (!recs || recs.length === 0) {
        return res.status(404).json({ success: false, message: 'Recommendation not found or pending approval.' });
      }

      const recommendation = recs[0];

      // Mark as READ
      if (recommendation.status === 'SENT') {
        await db.query(
          "UPDATE fertilizer_recommendations SET status = 'READ', read_at = CURRENT_TIMESTAMP WHERE id = ?",
          [recId]
        );
        recommendation.status = 'READ';
      }

      // Fetch parameters
      const params = await db.query(
        'SELECT * FROM soil_parameters WHERE soil_test_id = ?',
        [recommendation.soil_test_id]
      );
      recommendation.parameters = params && params.length > 0 ? params[0] : null;

      // Fetch analysis
      const analysis = await db.query(
        'SELECT * FROM soil_analysis WHERE soil_test_id = ?',
        [recommendation.soil_test_id]
      );
      recommendation.analysis = analysis && analysis.length > 0 ? analysis[0] : null;

      // Fetch schedule stages
      const schedules = await db.query(
        'SELECT * FROM fertilizer_schedules WHERE recommendation_id = ? ORDER BY stage_order ASC',
        [recId]
      );
      recommendation.schedules = schedules || [];

      return res.json({ success: true, recommendation });
    } catch (err) {
      console.error('getRecommendationById Error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving recommendation.' });
    }
  }

  // ===================== MESSAGES & NOTIFICATIONS =====================

  async getMessages(req, res) {
    try {
      const messages = await db.query(
        `SELECT m.*, u.name as sender_name, r.priority_nutrient
         FROM messages m
         LEFT JOIN users u ON m.admin_id = u.id
         LEFT JOIN fertilizer_recommendations r ON m.recommendation_id = r.id
         WHERE m.farmer_id = ?
         ORDER BY m.id DESC`,
        [req.user.id]
      );
      return res.json({ success: true, messages });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error retrieving messages.' });
    }
  }

  async markMessageRead(req, res) {
    try {
      await db.query(
        'UPDATE messages SET is_read = TRUE WHERE id = ? AND farmer_id = ?',
        [req.params.id, req.user.id]
      );
      return res.json({ success: true, message: 'Message marked as read.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }

  async getNotifications(req, res) {
    try {
      const notifications = await db.query(
        'SELECT * FROM notifications WHERE farmer_id = ? ORDER BY id DESC LIMIT 20',
        [req.user.id]
      );
      const unread = await db.query(
        'SELECT COUNT(*) as unread_count FROM notifications WHERE farmer_id = ? AND is_read = FALSE',
        [req.user.id]
      );
      return res.json({
        success: true,
        notifications,
        unreadCount: unread[0]?.unread_count || 0
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error retrieving notifications.' });
    }
  }

  async markNotificationRead(req, res) {
    try {
      await db.query(
        'UPDATE notifications SET is_read = TRUE WHERE id = ? AND farmer_id = ?',
        [req.params.id, req.user.id]
      );
      return res.json({ success: true, message: 'Notification marked as read.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  }

  // ===================== FERTILIZER HISTORY =====================

  async getFertilizerHistory(req, res) {
    try {
      const farmerId = req.user.id;
      const history = await db.query(
        `SELECT fa.*, f.farm_name, fd.field_name
         FROM fertilizer_applications fa
         JOIN farms f ON fa.farm_id = f.id
         JOIN fields fd ON fa.field_id = fd.id
         WHERE fa.farmer_id = ?
         ORDER BY fa.application_date DESC, fa.id DESC`,
        [farmerId]
      );

      // Aggregates for Chart.js
      let totalCost = 0;
      let totalQuantity = 0;
      const byFertilizer = {};
      const byStage = {};

      history.forEach(item => {
        totalCost += parseFloat(item.cost || 0);
        totalQuantity += parseFloat(item.quantity || 0);

        const fert = item.fertilizer_name || 'Other';
        byFertilizer[fert] = (byFertilizer[fert] || 0) + parseFloat(item.quantity || 0);

        const stg = item.growth_stage || 'General';
        byStage[stg] = (byStage[stg] || 0) + parseFloat(item.cost || 0);
      });

      return res.json({
        success: true,
        history,
        analytics: {
          totalApplications: history.length,
          totalCost,
          totalQuantity,
          byFertilizer,
          byStage
        }
      });
    } catch (err) {
      console.error('getFertilizerHistory Error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving fertilizer history.' });
    }
  }

  async addFertilizerApplication(req, res) {
    try {
      const farmerId = req.user.id;
      const {
        farm_id, field_id, fertilizer_id, fertilizer_name, nutrient_composition,
        quantity, unit, application_date, application_method, crop, growth_stage, cost, notes
      } = req.body;

      if (!farm_id || !field_id || !fertilizer_name || !quantity || !application_date) {
        return res.status(400).json({
          success: false,
          message: 'Farm, field, fertilizer name, quantity, and date are required.'
        });
      }

      // Verify farm ownership
      const farm = await db.query('SELECT id FROM farms WHERE id = ? AND farmer_id = ?', [farm_id, farmerId]);
      if (!farm || farm.length === 0) {
        return res.status(403).json({ success: false, message: 'Unauthorized farm selection.' });
      }

      await db.query(
        `INSERT INTO fertilizer_applications (
          farmer_id, farm_id, field_id, fertilizer_id, fertilizer_name, nutrient_composition,
          quantity, unit, application_date, application_method, crop, growth_stage, cost, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          farmerId, farm_id, field_id, fertilizer_id || null, fertilizer_name.trim(),
          nutrient_composition || null, parseFloat(quantity), unit || 'kg',
          application_date, application_method || 'Broadcasting',
          crop || null, growth_stage || null, cost ? parseFloat(cost) : 0.00, notes || null
        ]
      );

      return res.status(201).json({
        success: true,
        message: 'Fertilizer application recorded successfully!'
      });
    } catch (err) {
      console.error('addFertilizerApplication Error:', err);
      return res.status(500).json({ success: false, message: 'Server error recording application.' });
    }
  }

  // ===================== SOIL HISTORY =====================

  async getSoilHistory(req, res) {
    try {
      const farmerId = req.user.id;
      const fieldId = req.query.field_id;

      let sql = `
        SELECT st.id, st.sample_id, st.test_date, st.status,
               f.farm_name, fd.field_name, fd.soil_type, fd.current_crop,
               sp.nitrogen, sp.phosphorus, sp.potassium, sp.ph, sp.ec, sp.organic_carbon,
               sp.zinc, sp.sulfur,
               sa.nitrogen_status, sa.phosphorus_status, sa.potassium_status, sa.ph_status, sa.organic_carbon_status
        FROM soil_tests st
        JOIN farms f ON st.farm_id = f.id
        JOIN fields fd ON st.field_id = fd.id
        JOIN soil_parameters sp ON st.id = sp.soil_test_id
        LEFT JOIN soil_analysis sa ON st.id = sa.soil_test_id
        WHERE st.farmer_id = ?
      `;
      const params = [farmerId];

      if (fieldId) {
        sql += ' AND st.field_id = ?';
        params.push(fieldId);
      }

      sql += ' ORDER BY st.test_date ASC, st.id ASC';

      const history = await db.query(sql, params);

      return res.json({
        success: true,
        history
      });
    } catch (err) {
      console.error('getSoilHistory Error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving soil history.' });
    }
  }
}

module.exports = new FarmerController();
