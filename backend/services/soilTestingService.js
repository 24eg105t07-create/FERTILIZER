/**
 * AgriWise: Soil Testing Service
 * Handles validation, registration, and persistence of soil tests and parameters.
 */

const db = require('../config/db');

class SoilTestingService {
  /**
   * Submit a new soil test with parameters
   */
  async submitSoilTest({ farmerId, farmId, fieldId, sampleId, testDate, labName, notes, filePath, parameters }) {
    // 1. Verify Farm & Field belong to this farmer
    const farms = await db.query(
      'SELECT id FROM farms WHERE id = ? AND farmer_id = ?',
      [farmId, farmerId]
    );
    if (!farms || farms.length === 0) {
      throw new Error('Unauthorized or invalid farm selected.');
    }

    const fields = await db.query(
      'SELECT id, current_crop, soil_type FROM fields WHERE id = ? AND farm_id = ?',
      [fieldId, farmId]
    );
    if (!fields || fields.length === 0) {
      throw new Error('Unauthorized or invalid field selected for this farm.');
    }

    // 2. Generate unique sample ID if not provided
    const finalSampleId = (sampleId && sampleId.trim().length > 0)
      ? sampleId.trim()
      : `AGRI-ST-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const finalTestDate = testDate || new Date().toISOString().slice(0, 10);

    // 3. Create soil_tests record
    const testResult = await db.query(
      `INSERT INTO soil_tests (farmer_id, farm_id, field_id, sample_id, test_date, status, lab_name, report_file_path, notes)
       VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)`,
      [farmerId, farmId, fieldId, finalSampleId, finalTestDate, labName || 'Regional Soil Testing Laboratory', filePath || null, notes || null]
    );

    const soilTestId = testResult.insertId;

    // 4. Save soil parameters (if provided)
    const p = parameters || {};
    await db.query(
      `INSERT INTO soil_parameters (
        soil_test_id, soil_type, soil_color, soil_texture, soil_depth, soil_moisture, drainage,
        nitrogen, phosphorus, potassium, ph, ec, organic_carbon, organic_matter,
        sulfur, calcium, magnesium, zinc, iron, boron, manganese, copper
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        soilTestId,
        p.soil_type || fields[0].soil_type || null,
        p.soil_color || null,
        p.soil_texture || null,
        p.soil_depth !== undefined && p.soil_depth !== '' ? parseFloat(p.soil_depth) : null,
        p.soil_moisture !== undefined && p.soil_moisture !== '' ? parseFloat(p.soil_moisture) : null,
        p.drainage || null,
        p.nitrogen !== undefined && p.nitrogen !== '' ? parseFloat(p.nitrogen) : null,
        p.phosphorus !== undefined && p.phosphorus !== '' ? parseFloat(p.phosphorus) : null,
        p.potassium !== undefined && p.potassium !== '' ? parseFloat(p.potassium) : null,
        p.ph !== undefined && p.ph !== '' ? parseFloat(p.ph) : null,
        p.ec !== undefined && p.ec !== '' ? parseFloat(p.ec) : null,
        p.organic_carbon !== undefined && p.organic_carbon !== '' ? parseFloat(p.organic_carbon) : null,
        p.organic_matter !== undefined && p.organic_matter !== '' ? parseFloat(p.organic_matter) : null,
        p.sulfur !== undefined && p.sulfur !== '' ? parseFloat(p.sulfur) : null,
        p.calcium !== undefined && p.calcium !== '' ? parseFloat(p.calcium) : null,
        p.magnesium !== undefined && p.magnesium !== '' ? parseFloat(p.magnesium) : null,
        p.zinc !== undefined && p.zinc !== '' ? parseFloat(p.zinc) : null,
        p.iron !== undefined && p.iron !== '' ? parseFloat(p.iron) : null,
        p.boron !== undefined && p.boron !== '' ? parseFloat(p.boron) : null,
        p.manganese !== undefined && p.manganese !== '' ? parseFloat(p.manganese) : null,
        p.copper !== undefined && p.copper !== '' ? parseFloat(p.copper) : null
      ]
    );

    return {
      soilTestId,
      sampleId: finalSampleId,
      status: 'PENDING'
    };
  }

  /**
   * Fetch complete soil test details
   */
  async getSoilTestDetails(soilTestId, farmerId = null) {
    let sql = `
      SELECT st.*, f.farm_name, f.state, f.district, f.village,
             fd.field_name, fd.area as field_area, fd.soil_type as field_soil_type,
             fd.current_crop, fd.previous_crop, fd.irrigation_type,
             u.name as farmer_name, u.email as farmer_email, u.phone as farmer_phone
      FROM soil_tests st
      JOIN farms f ON st.farm_id = f.id
      JOIN fields fd ON st.field_id = fd.id
      JOIN users u ON st.farmer_id = u.id
      WHERE st.id = ?
    `;
    const params = [soilTestId];

    if (farmerId) {
      sql += ' AND st.farmer_id = ?';
      params.push(farmerId);
    }

    const tests = await db.query(sql, params);
    if (!tests || tests.length === 0) return null;

    const test = tests[0];

    // Fetch parameters
    const paramsRows = await db.query(
      'SELECT * FROM soil_parameters WHERE soil_test_id = ?',
      [soilTestId]
    );
    test.parameters = paramsRows && paramsRows.length > 0 ? paramsRows[0] : null;

    // Fetch analysis
    const analysisRows = await db.query(
      'SELECT * FROM soil_analysis WHERE soil_test_id = ?',
      [soilTestId]
    );
    test.analysis = analysisRows && analysisRows.length > 0 ? analysisRows[0] : null;

    // Fetch recommendation if available
    const recRows = await db.query(
      'SELECT * FROM fertilizer_recommendations WHERE soil_test_id = ?',
      [soilTestId]
    );
    test.recommendation = recRows && recRows.length > 0 ? recRows[0] : null;

    return test;
  }
}

module.exports = new SoilTestingService();
