/**
 * AgriWise: Soil Analysis Service
 * Scientifically grounded, configurable rule-based soil interpreter.
 * Classifies N, P, K, pH, EC, Organic Carbon, and micronutrients.
 */

const db = require('../config/db');

class SoilAnalysisService {
  /**
   * Load active interpretation rules
   */
  async getRules() {
    try {
      const rules = await db.query('SELECT * FROM recommendation_rules');
      if (rules && rules.length > 0) {
        const ruleMap = {};
        rules.forEach(r => { ruleMap[r.parameter.toLowerCase()] = r; });
        return ruleMap;
      }
    } catch (e) {
      // ignore and use default
    }
    return null;
  }

  /**
   * Analyze soil test by ID
   */
  async analyzeSoilTest(soilTestId) {
    // 1. Fetch test and parameters
    const tests = await db.query('SELECT * FROM soil_tests WHERE id = ?', [soilTestId]);
    if (!tests || tests.length === 0) {
      throw new Error('Soil test not found.');
    }
    const test = tests[0];

    const paramRows = await db.query('SELECT * FROM soil_parameters WHERE soil_test_id = ?', [soilTestId]);
    if (!paramRows || paramRows.length === 0) {
      throw new Error('No soil parameters recorded for this test. Please enter soil test parameters first.');
    }
    const params = paramRows[0];

    // 2. Fetch field and crop info
    const fieldRows = await db.query('SELECT * FROM fields WHERE id = ?', [test.field_id]);
    const field = fieldRows && fieldRows.length > 0 ? fieldRows[0] : {};

    const rules = await this.getRules();

    // 3. Classify parameters
    const nVal = params.nitrogen !== null ? parseFloat(params.nitrogen) : null;
    const pVal = params.phosphorus !== null ? parseFloat(params.phosphorus) : null;
    const kVal = params.potassium !== null ? parseFloat(params.potassium) : null;
    const phVal = params.ph !== null ? parseFloat(params.ph) : null;
    const ecVal = params.ec !== null ? parseFloat(params.ec) : null;
    const ocVal = params.organic_carbon !== null ? parseFloat(params.organic_carbon) : null;

    // Nitrogen
    let nStatus = 'MEDIUM';
    if (nVal !== null) {
      if (nVal < 280) nStatus = 'LOW';
      else if (nVal <= 560) nStatus = 'OPTIMAL';
      else nStatus = 'HIGH';
    }

    // Phosphorus
    let pStatus = 'MEDIUM';
    if (pVal !== null) {
      if (pVal < 23) pStatus = 'LOW';
      else if (pVal <= 56) pStatus = 'OPTIMAL';
      else pStatus = 'HIGH';
    }

    // Potassium
    let kStatus = 'OPTIMAL';
    if (kVal !== null) {
      if (kVal < 145) kStatus = 'LOW';
      else if (kVal <= 335) kStatus = 'OPTIMAL';
      else kStatus = 'HIGH';
    }

    // pH
    let phStatus = 'OPTIMAL';
    if (phVal !== null) {
      if (phVal < 6.5) phStatus = 'ACIDIC';
      else if (phVal <= 7.5) phStatus = 'OPTIMAL';
      else phStatus = 'ALKALINE';
    }

    // EC
    let ecStatus = 'NORMAL';
    if (ecVal !== null) {
      if (ecVal < 1.0) ecStatus = 'NORMAL';
      else if (ecVal <= 2.0) ecStatus = 'ELEVATED';
      else ecStatus = 'HIGH';
    }

    // Organic Carbon
    let ocStatus = 'MEDIUM';
    if (ocVal !== null) {
      if (ocVal < 0.50) ocStatus = 'LOW';
      else if (ocVal <= 0.75) ocStatus = 'MEDIUM';
      else ocStatus = 'HIGH';
    }

    // Secondary & Micronutrients Summary
    const microNotes = [];
    if (params.zinc !== null && parseFloat(params.zinc) < 0.60) {
      microNotes.push(`Zinc is DEFICIENT (${params.zinc} ppm vs critical threshold 0.60 ppm).`);
    } else if (params.zinc !== null) {
      microNotes.push(`Zinc is adequate (${params.zinc} ppm).`);
    }

    if (params.sulfur !== null && parseFloat(params.sulfur) < 10.0) {
      microNotes.push(`Sulfur is DEFICIENT (${params.sulfur} ppm vs target 10-20 ppm).`);
    } else if (params.sulfur !== null) {
      microNotes.push(`Sulfur is adequate (${params.sulfur} ppm).`);
    }

    if (params.iron !== null && parseFloat(params.iron) < 4.5) {
      microNotes.push(`Iron is low (${params.iron} ppm).`);
    }
    if (params.boron !== null && parseFloat(params.boron) < 0.5) {
      microNotes.push(`Boron is low (${params.boron} ppm).`);
    }

    const microSummary = microNotes.length > 0 ? microNotes.join(' ') : 'Secondary nutrients and micronutrients within standard ranges or not tested.';

    // Farmer-friendly plain text analysis
    const attentionPoints = [];
    if (nStatus === 'LOW') attentionPoints.push('Available Nitrogen is LOW');
    if (pStatus === 'LOW') attentionPoints.push('Available Phosphorus is LOW');
    if (kStatus === 'LOW') attentionPoints.push('Available Potassium is LOW');
    if (ocStatus === 'LOW') attentionPoints.push('Soil Organic Carbon is LOW');
    if (phStatus !== 'OPTIMAL') attentionPoints.push(`Soil pH is ${phStatus}`);
    if (ecStatus !== 'NORMAL') attentionPoints.push(`Electrical Conductivity is ${ecStatus}`);

    let analysisText = '';
    if (attentionPoints.length > 0) {
      analysisText = `Your Soil Needs Attention: ${attentionPoints.join(', ')}. ` +
        `Target crop: ${field.current_crop || 'Field Crop'}. ` +
        `Specific interpretation should be validated using appropriate regional/crop/soil agronomic guidance.`;
    } else {
      analysisText = `Soil health indicators are in favorable balance. Available macro-nutrients and soil reaction are within recommended ranges for ${field.current_crop || 'planned cultivation'}.`;
    }

    // 4. Save or update soil_analysis table
    const existingAnalysis = await db.query('SELECT id FROM soil_analysis WHERE soil_test_id = ?', [soilTestId]);

    if (existingAnalysis && existingAnalysis.length > 0) {
      await db.query(
        `UPDATE soil_analysis SET
          nitrogen_status = ?, phosphorus_status = ?, potassium_status = ?,
          ph_status = ?, ec_status = ?, organic_carbon_status = ?,
          secondary_micronutrients_summary = ?, analysis_text = ?
         WHERE soil_test_id = ?`,
        [nStatus, pStatus, kStatus, phStatus, ecStatus, ocStatus, microSummary, analysisText, soilTestId]
      );
    } else {
      await db.query(
        `INSERT INTO soil_analysis (
          soil_test_id, nitrogen_status, phosphorus_status, potassium_status,
          ph_status, ec_status, organic_carbon_status, secondary_micronutrients_summary, analysis_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [soilTestId, nStatus, pStatus, kStatus, phStatus, ecStatus, ocStatus, microSummary, analysisText]
      );
    }

    // 5. Update soil test status to REVIEW_REQUIRED
    await db.query(
      "UPDATE soil_tests SET status = 'REVIEW_REQUIRED', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [soilTestId]
    );

    return {
      soilTestId,
      nitrogen_status: nStatus,
      phosphorus_status: pStatus,
      potassium_status: kStatus,
      ph_status: phStatus,
      ec_status: ecStatus,
      organic_carbon_status: ocStatus,
      secondary_micronutrients_summary: microSummary,
      analysis_text: analysisText
    };
  }
}

module.exports = new SoilAnalysisService();
