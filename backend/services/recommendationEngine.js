/**
 * AgriWise: Intelligent Rule-Based Recommendation Engine
 * Synthesizes soil test metrics, crop needs, soil type, and agronomic principles
 * to deliver explainable, multi-stage fertilizer and soil-health plans.
 */

const db = require('../config/db');

class RecommendationEngine {
  /**
   * Generate an explainable fertilizer recommendation for a soil test
   */
  async generateRecommendation(soilTestId, adminId = null) {
    // 1. Fetch soil test, farm, field, parameters, and analysis
    const testRows = await db.query(
      `SELECT st.*, f.state, f.district, f.village, f.irrigation, f.water_source,
              fd.field_name, fd.area as field_area, fd.soil_type, fd.drainage,
              fd.current_crop, fd.previous_crop, fd.sowing_date, fd.harvest_date, fd.farming_method
       FROM soil_tests st
       JOIN farms f ON st.farm_id = f.id
       JOIN fields fd ON st.field_id = fd.id
       WHERE st.id = ?`,
      [soilTestId]
    );

    if (!testRows || testRows.length === 0) {
      throw new Error('Soil test not found.');
    }
    const test = testRows[0];

    // Check analysis exists
    const analysisRows = await db.query('SELECT * FROM soil_analysis WHERE soil_test_id = ?', [soilTestId]);
    if (!analysisRows || analysisRows.length === 0) {
      throw new Error('Soil analysis must be completed before generating a recommendation.');
    }
    const analysis = analysisRows[0];

    const paramRows = await db.query('SELECT * FROM soil_parameters WHERE soil_test_id = ?', [soilTestId]);
    const params = paramRows && paramRows.length > 0 ? paramRows[0] : {};

    // Crop lookup
    let cropName = test.current_crop || 'Wheat';
    const cropRows = await db.query('SELECT * FROM crops WHERE name LIKE ?', [`%${cropName}%`]);
    const crop = cropRows && cropRows.length > 0 ? cropRows[0] : { id: 1, name: cropName, growth_duration: 120, season: 'Rabi' };

    // Fertilizer catalogue
    const fertilizers = await db.query('SELECT * FROM fertilizers');

    // 2. Determine Priority Nutrients & Selection
    const deficiencies = [];
    if (analysis.phosphorus_status === 'LOW') deficiencies.push('Phosphorus');
    if (analysis.nitrogen_status === 'LOW') deficiencies.push('Nitrogen');
    if (analysis.potassium_status === 'LOW') deficiencies.push('Potassium');
    if (analysis.organic_carbon_status === 'LOW') deficiencies.push('Organic Matter / Carbon');

    let priorityNutrient = 'Balanced NPK & Soil Conditioning';
    let chosenFertilizerId = 1; // Default Neem Coated Urea
    let chosenFertilizerName = 'Neem Coated Urea';
    let recommendationText = '';
    let applicationTiming = '';
    let applicationMethod = '';
    let warnings = '';
    let explanation = '';
    let soilImprovement = '';

    // Logic for fertilizer selection based on soil status & crop
    if (analysis.phosphorus_status === 'LOW' && analysis.nitrogen_status === 'LOW') {
      priorityNutrient = 'Phosphorus and Nitrogen';
      const dap = (fertilizers || []).find(f => f.name.includes('DAP')) || { id: 2, name: 'Di-Ammonium Phosphate (DAP)' };
      chosenFertilizerId = dap.id;
      chosenFertilizerName = `${dap.name} + Neem Coated Urea`;
      recommendationText = `Apply ${dap.name} as a concentrated basal starter to rectify severe phosphorus deficit, paired with split applications of Neem Coated Urea throughout vegetative tiller development.`;
      applicationTiming = 'Basal placement at sowing time, followed by top dress splits at active tillering / crown-root initiation.';
      applicationMethod = 'Band placement 4-5 cm below seed furrow for DAP; broadcast onto moist soil with light irrigation for urea splits.';
    } else if (analysis.phosphorus_status === 'LOW') {
      priorityNutrient = 'Phosphorus';
      const ssp = (fertilizers || []).find(f => f.name.includes('Single Super Phosphate') || f.name.includes('SSP')) || { id: 6, name: 'Single Super Phosphate (SSP)' };
      chosenFertilizerId = ssp.id;
      chosenFertilizerName = ssp.name;
      recommendationText = `Phosphorus requires priority attention. Utilize ${ssp.name} at field preparation or sowing to establish robust root architecture without overloading soil with excessive free nitrogen.`;
      applicationTiming = 'Basal application during final land preparation or at seed sowing.';
      applicationMethod = 'Incorporate into the active root zone prior to sowing.';
    } else if (analysis.potassium_status === 'LOW') {
      priorityNutrient = 'Potassium';
      const mop = (fertilizers || []).find(f => f.name.includes('MOP') || f.name.includes('Potash')) || { id: 3, name: 'Muriate of Potash (MOP)' };
      chosenFertilizerId = mop.id;
      chosenFertilizerName = mop.name;
      recommendationText = `Soil potassium is below optimum levels. Apply ${mop.name} in balanced doses to enhance stem strength, drought resilience, and grain/tuber filling.`;
      applicationTiming = '50% Basal at planting, 50% top-dressed at flowering / tuber bulking stage.';
      applicationMethod = 'Soil broadcast followed by weeding / intercultural hoeing and irrigation.';
    } else if (analysis.nitrogen_status === 'LOW') {
      priorityNutrient = 'Nitrogen';
      const urea = (fertilizers || []).find(f => f.name.includes('Urea')) || { id: 1, name: 'Neem Coated Urea' };
      chosenFertilizerId = urea.id;
      chosenFertilizerName = urea.name;
      recommendationText = `Nitrogen deficiency detected. Utilize slow-release ${urea.name} in multiple split applications synchronized with peak vegetative uptake.`;
      applicationTiming = 'Split applications: 1/3 at basal, 1/3 at vegetative tillering, 1/3 prior to flowering.';
      applicationMethod = 'Surface broadcast in standing crop under field-capacity moisture conditions.';
    } else {
      priorityNutrient = 'Nutrient Maintenance & Microbial Balance';
      const comp = (fertilizers || []).find(f => f.name.includes('10-26-26')) || { id: 4, name: 'NPK 10-26-26 Complex' };
      chosenFertilizerId = comp.id;
      chosenFertilizerName = comp.name;
      recommendationText = `Soil primary macronutrients are in adequate balance. Focus on maintenance fertilization using complex balanced grades to sustain soil fertility.`;
      applicationTiming = 'Basal application at sowing with organic top dressing.';
      applicationMethod = 'Drill-sown along with seed rows.';
    }

    // Explainability Block (The "WHY")
    const whyItems = [];
    if (params.nitrogen !== null) {
      whyItems.push(`Nitrogen: ${params.nitrogen} kg/ha (Status: ${analysis.nitrogen_status})`);
    }
    if (params.phosphorus !== null) {
      whyItems.push(`Phosphorus: ${params.phosphorus} kg/ha (Status: ${analysis.phosphorus_status})`);
    }
    if (params.potassium !== null) {
      whyItems.push(`Potassium: ${params.potassium} kg/ha (Status: ${analysis.potassium_status})`);
    }
    if (params.ph !== null) {
      whyItems.push(`Soil pH: ${params.ph} (${analysis.ph_status})`);
    }
    if (params.organic_carbon !== null) {
      whyItems.push(`Organic Carbon: ${params.organic_carbon}% (${analysis.organic_carbon_status})`);
    }

    explanation = `WHY THIS PLAN:
1. Soil Chemical Profile: ${whyItems.join(' | ')}.
2. Crop Demand: ${crop.name} requires substantial early-stage root stimulation and balanced nutrient intake throughout its ${crop.growth_duration || 120}-day cycle.
3. Soil Context: ${test.soil_type || 'Field soil'} with ${test.drainage || 'moderate'} drainage requires split applications to prevent leaching.`;

    // Soil health improvement recommendations
    const improvements = [];
    if (analysis.organic_carbon_status === 'LOW') {
      improvements.push('Incorporate 4-5 tonnes/acre of well-decomposed Farmyard Manure (FYM) or 1.5 tonnes/acre vermicompost 3 weeks prior to sowing to elevate soil organic carbon and nutrient exchange capacity.');
    }
    if (analysis.ph_status === 'ACIDIC') {
      improvements.push('Soil reaction is acidic. Apply agricultural lime (calcium carbonate) or dolomite as per regional agronomic recommendations to buffer soil pH toward 6.5.');
    } else if (analysis.ph_status === 'ALKALINE') {
      improvements.push('Soil reaction is alkaline. Incorporate agricultural gypsum or sulfur compost during field preparation to lower active alkalinity and unlock fixed phosphorus.');
    }
    if (params.zinc !== null && parseFloat(params.zinc) < 0.60) {
      improvements.push(`Soil is zinc-deficient (${params.zinc} ppm). Apply 10 kg/acre Zinc Sulfate (21% Zn) basally to prevent leaf bronzing and stunted growth.`);
    }
    if (test.previous_crop && test.previous_crop.toLowerCase().includes('rice') && crop.name.toLowerCase().includes('wheat')) {
      improvements.push('Following paddy cultivation, soil physical structure may be compacted. Deep disc ploughing and incorporation of crop residue is strongly recommended.');
    }
    soilImprovement = improvements.join(' ') || 'Maintain current organic matter additions and avoid burning stubble to sustain biological soil health.';

    // Warnings and Safety Disclaimers
    const warningList = [
      'Demo Rule / Simulated Recommendation: Specific fertilizer rate requires validated local agronomic guidance.'
    ];
    if (analysis.ph_status === 'ALKALINE') {
      warningList.push('Avoid broadcasting untreated urea on moist alkaline soil without immediate incorporation, as severe ammonia volatilization losses will occur.');
    }
    if (priorityNutrient.includes('Phosphorus')) {
      warningList.push('Do NOT mix phosphate fertilizers (like DAP or SSP) directly with zinc sulfate in the same tank or applicator to prevent irreversible insoluble chemical precipitation.');
    }
    warningList.push('Never apply nitrogenous fertilizers immediately before heavy predicted rainfall to mitigate runoff risk into local water bodies.');
    warnings = warningList.join(' ');

    // 3. Insert or update fertilizer_recommendations record
    const existingRec = await db.query(
      'SELECT id FROM fertilizer_recommendations WHERE soil_test_id = ?',
      [soilTestId]
    );

    let recId;
    if (existingRec && existingRec.length > 0) {
      recId = existingRec[0].id;
      await db.query(
        `UPDATE fertilizer_recommendations SET
          priority_nutrient = ?, fertilizer_id = ?, fertilizer_name = ?,
          recommendation_text = ?, application_timing = ?, application_method = ?,
          number_of_applications = ?, soil_improvement_suggestions = ?,
          warnings = ?, explanation = ?, admin_comments = ?, status = 'DRAFT',
          admin_id = ?, crop_id = ?
         WHERE id = ?`,
        [
          priorityNutrient, chosenFertilizerId, chosenFertilizerName,
          recommendationText, applicationTiming, applicationMethod,
          3, soilImprovement, warnings, explanation,
          'Draft recommendation generated by intelligent rule engine. Review required by agronomist before sending to farmer.',
          adminId, crop.id, recId
        ]
      );
      // Remove previous schedules for re-generation
      await db.query('DELETE FROM fertilizer_schedules WHERE recommendation_id = ?', [recId]);
    } else {
      const insResult = await db.query(
        `INSERT INTO fertilizer_recommendations (
          farmer_id, farm_id, field_id, soil_test_id, crop_id,
          priority_nutrient, fertilizer_id, fertilizer_name, recommendation_text,
          application_timing, application_method, number_of_applications,
          soil_improvement_suggestions, warnings, explanation, admin_comments,
          status, admin_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?)`,
        [
          test.farmer_id, test.farm_id, test.field_id, soilTestId, crop.id,
          priorityNutrient, chosenFertilizerId, chosenFertilizerName, recommendationText,
          applicationTiming, applicationMethod, 3,
          soilImprovement, warnings, explanation,
          'Draft recommendation generated by intelligent rule engine. Review required by agronomist before sending to farmer.',
          adminId
        ]
      );
      recId = insResult.insertId;
    }

    // 4. Generate visual 6-stage fertilizer schedule
    const scheduleStages = [
      {
        stage: 'PRE-SOWING',
        order: 1,
        nutrient: 'Soil Organic Carbon & Microbial Humus',
        category: 'Organic Amendment',
        timing: '15-20 days before sowing',
        method: 'Broadcast FYM or vermicompost followed by deep ploughing',
        status: 'Scheduled',
        notes: 'Enriches microbial biodiversity, enhances moisture retention, and buffers soil reaction.'
      },
      {
        stage: 'BASAL',
        order: 2,
        nutrient: `${priorityNutrient.includes('Phosphorus') ? 'Phosphorus + Starter Nitrogen' : 'Starter NPK'}`,
        category: priorityNutrient.includes('Phosphorus') ? 'Compound (DAP or SSP)' : 'Complex NPK Grade',
        timing: 'At sowing or planting (Day 0)',
        method: 'Band placement 4-5 cm below seed level',
        status: 'Scheduled',
        notes: 'Critical for rapid seminal root formation and early seedling vigor.'
      },
      {
        stage: 'VEGETATIVE',
        order: 3,
        nutrient: 'Nitrogen (Top Dress Split 1)',
        category: 'Nitrogen (Neem Coated Urea)',
        timing: 'Active tillering / Crown Root Initiation (20-25 days)',
        method: 'Top dressing followed immediately by irrigation',
        status: 'Scheduled',
        notes: 'Drives canopy development, tillering, and photosynthetic chlorophyll index.'
      },
      {
        stage: 'FLOWERING',
        order: 4,
        nutrient: 'Nitrogen (Top Dress Split 2) + Potassium',
        category: 'Nitrogen & Potash',
        timing: 'Panicle / Tassel / Flower Initiation (45-55 days)',
        method: 'Broadcasting onto damp soil during evening hours',
        status: 'Scheduled',
        notes: 'Supports reproductive transition, pollen viability, and spikelet count.'
      },
      {
        stage: 'FRUIT_GRAIN_DEVELOPMENT',
        order: 5,
        nutrient: 'Potassium & Micronutrients (Optional)',
        category: 'Water Soluble Foliar Fertilizer',
        timing: 'Grain filling / Tuber bulking stage',
        method: 'Foliar spray during cool morning or evening hours',
        status: 'Scheduled',
        notes: 'Optimizes starch translocation and test weight; prevents premature flag leaf senescence.'
      },
      {
        stage: 'HARVEST',
        order: 6,
        nutrient: 'Soil Nutrient Audit & Stubble Management',
        category: 'Residue Incorporation',
        timing: 'Post-harvest',
        method: 'Chop and incorporate crop residue into soil with stubble shredder',
        status: 'Scheduled',
        notes: 'Recycles potassium and organic carbon into soil bank; strictly avoids crop residue burning.'
      }
    ];

    for (const stg of scheduleStages) {
      await db.query(
        `INSERT INTO fertilizer_schedules (
          recommendation_id, stage, stage_order, nutrient, fertilizer_category,
          timing, method, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [recId, stg.stage, stg.order, stg.nutrient, stg.category, stg.timing, stg.method, stg.status, stg.notes]
      );
    }

    return {
      id: recId,
      recommendationId: recId,
      soilTestId,
      status: 'DRAFT',
      priority_nutrient: priorityNutrient,
      fertilizer_name: chosenFertilizerName,
      recommendation_text: recommendationText,
      explanation,
      warnings,
      soil_improvement_suggestions: soilImprovement
    };
  }
}

module.exports = new RecommendationEngine();
