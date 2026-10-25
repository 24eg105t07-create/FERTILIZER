/**
 * AgriWise: Comprehensive End-to-End Workflow & Role Security Verification Script
 * Validates all 25 critical paths including Farmer & Admin flows, soil analysis,
 * recommendation generation, agronomist approval, dispatch, notifications, and strict RBAC isolation.
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
  });

  const status = res.status;
  let json = {};
  try {
    json = await res.json();
  } catch (e) {
    json = { text: await res.text() };
  }

  return { status, data: json };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTests() {
  console.log('\n============================================================');
  console.log('🧪 Starting AgriWise End-to-End Workflow & RBAC Tests');
  console.log('============================================================\n');

  try {
    // 1. Health Check
    console.log('--- Step 1: Server Health Check ---');
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.status === 'online', 'Health check returns online status');

    // 2. Farmer Registration
    console.log('\n--- Step 2: Farmer Registration ---');
    const uniqueEmail = `farmer_test_${Date.now()}@example.com`;
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Automated Test Farmer',
        email: uniqueEmail,
        password: 'Password@123',
        phone: '+91 98765 00000',
        country: 'India',
        state: 'Punjab',
        district: 'Ludhiana',
        village: 'Samrala',
        preferred_language: 'English',
        farmer_type: 'Commercial Grower',
        total_farming_area: 15.0
      }
    });
    assert(regRes.status === 201 && regRes.data.success === true, 'New farmer registered successfully with profile');

    // 3. Farmer Login (using standard demo account)
    console.log('\n--- Step 3: Farmer Login ---');
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'farmer@example.com', password: 'Farmer@123' }
    });
    assert(loginRes.status === 200 && loginRes.data.success === true, 'Farmer login successful');
    assert(loginRes.data.user.role === 'farmer', 'User role is correctly farmer');
    const farmerToken = loginRes.data.token;
    const farmerHeaders = { Authorization: `Bearer ${farmerToken}` };

    // 4. Farmer Dashboard
    console.log('\n--- Step 4: Farmer Dashboard Telemetry ---');
    const dashRes = await request('/api/farmer/dashboard', { headers: farmerHeaders });
    assert(dashRes.status === 200 && dashRes.data.success === true, 'Farmer dashboard loaded');
    assert(dashRes.data.stats.totalFarms >= 1, `Farmer has ${dashRes.data.stats.totalFarms} farm(s)`);

    // 5. Add a Farm
    console.log('\n--- Step 5: Add a Farm ---');
    const addFarmRes = await request('/api/farmer/farms', {
      method: 'POST',
      headers: farmerHeaders,
      body: {
        farm_name: 'Test Agro Valley Estate',
        country: 'India',
        state: 'Haryana',
        district: 'Karnal',
        village: 'Nilokheri',
        location: 'Plot 42, Canal West',
        area: 10.5,
        ownership_type: 'Owned',
        irrigation: 'Drip System',
        water_source: 'Canal',
        farming_type: 'Integrated Nutrient Management'
      }
    });
    assert(addFarmRes.status === 201 && addFarmRes.data.success === true, 'Farm created successfully');
    const newFarmId = addFarmRes.data.farmId;

    // 6. Add a Field
    console.log('\n--- Step 6: Add a Field to the Farm ---');
    const addFieldRes = await request('/api/farmer/fields', {
      method: 'POST',
      headers: farmerHeaders,
      body: {
        farm_id: newFarmId,
        field_name: 'Field Alpha - Test Wheat Sector',
        area: 5.0,
        soil_type: 'Sandy Loam',
        irrigation_type: 'Drip / Sprinkler',
        drainage: 'Good',
        current_crop: 'Wheat',
        previous_crop: 'Paddy',
        sowing_date: '2026-11-15',
        harvest_date: '2027-03-30',
        farming_method: 'Zero Tillage',
        topography: 'Flat Plain'
      }
    });
    assert(addFieldRes.status === 201 && addFieldRes.data.success === true, 'Field created successfully');
    const newFieldId = addFieldRes.data.fieldId;

    // 7. Submit Soil Test Request with full NPK, pH, EC, OC, Micronutrients
    console.log('\n--- Step 7: Submit Soil Test Request ---');
    const sampleId = `TEST-SAMPLE-${Date.now().toString().slice(-5)}`;
    const soilTestRes = await request('/api/farmer/soil-tests', {
      method: 'POST',
      headers: farmerHeaders,
      body: {
        farm_id: newFarmId,
        field_id: newFieldId,
        sample_id: sampleId,
        test_date: '2026-10-15',
        lab_name: 'Regional Soil Health Lab',
        notes: 'Pre-sowing test for Rabi Wheat crop',
        nitrogen: 210.0,      // Low (<280)
        phosphorus: 12.0,    // Low (<23)
        potassium: 310.0,     // Optimal (145-335)
        ph: 7.9,             // Alkaline (>7.8)
        ec: 0.5,             // Normal (<1.0)
        organic_carbon: 0.38,// Low (<0.50)
        zinc: 0.45,          // Deficient (<0.60)
        sulfur: 7.5          // Deficient (<10.0)
      }
    });
    assert(soilTestRes.status === 201 && soilTestRes.data.success === true, 'Soil test submitted successfully');
    const newTestId = soilTestRes.data.soilTestId;

    // 8. Verify Soil Test in Farmer List
    console.log('\n--- Step 8: Verify Soil Test in Database ---');
    const testsListRes = await request('/api/farmer/soil-tests', { headers: farmerHeaders });
    assert(testsListRes.status === 200 && testsListRes.data.success === true, 'Retrieved farmer soil tests');
    const foundTest = testsListRes.data.tests.find(t => t.id == newTestId);
    assert(foundTest !== undefined, `Found submitted test ID ${newTestId} in database`);

    // 9. Admin Login
    console.log('\n--- Step 9: Admin Login ---');
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@example.com', password: 'Admin@123' }
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data.success === true, 'Admin login successful');
    assert(adminLoginRes.data.user.role === 'admin', 'Admin user confirmed');
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 10. Admin Dashboard Telemetry
    console.log('\n--- Step 10: Admin Dashboard Telemetry ---');
    const adminDashRes = await request('/api/admin/dashboard', { headers: adminHeaders });
    assert(adminDashRes.status === 200 && adminDashRes.data.success === true, 'Admin dashboard loaded');
    assert(adminDashRes.data.stats.totalFarmers >= 1, 'Admin sees global farmers count');

    // 11. Admin inspects the Soil Test
    console.log('\n--- Step 11: Admin Inspects Soil Test ---');
    const inspectTestRes = await request(`/api/admin/soil-tests/${newTestId}`, { headers: adminHeaders });
    assert(inspectTestRes.status === 200 && inspectTestRes.data.success === true, 'Admin inspected soil test');
    assert(inspectTestRes.data.test.parameters.nitrogen == 210.0, 'Soil test parameter nitrogen matches 210 kg/ha');

    // 12. Run Soil Analysis (Rule-Based Classification)
    console.log('\n--- Step 12: Run Soil Parameter Analysis & Classification ---');
    const analysisRes = await request(`/api/admin/soil-tests/${newTestId}/analyze`, {
      method: 'POST',
      headers: adminHeaders
    });
    assert(analysisRes.status === 200 && analysisRes.data.success === true, 'Soil test analysis completed');
    assert(analysisRes.data.analysis.nitrogen_status === 'LOW', 'Nitrogen correctly classified as LOW');
    assert(analysisRes.data.analysis.phosphorus_status === 'LOW', 'Phosphorus correctly classified as LOW');
    assert(analysisRes.data.analysis.potassium_status === 'OPTIMAL', 'Potassium correctly classified as OPTIMAL');
    assert(analysisRes.data.analysis.ph_status === 'ALKALINE', 'pH correctly classified as ALKALINE');
    assert(analysisRes.data.analysis.organic_carbon_status === 'LOW', 'Organic Carbon correctly classified as LOW');

    // 13. Generate Recommendation (Intelligent Rule Engine)
    console.log('\n--- Step 13: Generate Fertilizer Recommendation Draft ---');
    const genRecRes = await request('/api/admin/recommendations/generate', {
      method: 'POST',
      headers: adminHeaders,
      body: { soil_test_id: newTestId }
    });
    assert(genRecRes.status === 201 && genRecRes.data.success === true, 'Recommendation generated successfully');
    const newRecId = genRecRes.data.recommendation.recommendationId;
    assert(newRecId !== undefined, `Generated recommendation ID: ${newRecId}`);

    // 14. Admin Reviews Recommendation Draft
    console.log('\n--- Step 14: Review Recommendation Draft ---');
    const recReviewRes = await request(`/api/admin/recommendations/${newRecId}`, { headers: adminHeaders });
    assert(recReviewRes.status === 200 && recReviewRes.data.success === true, 'Retrieved recommendation draft');
    const recData = recReviewRes.data.recommendation;
    assert(recData.status === 'DRAFT', 'Initial recommendation status is DRAFT');
    assert(recData.schedules.length === 6, 'Contains complete 6-stage fertilizer schedule timeline');

    // 15. Admin Updates Draft Comments
    console.log('\n--- Step 15: Admin Edits & Agronomist Review ---');
    const updateRecRes = await request(`/api/admin/recommendations/${newRecId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: {
        admin_comments: 'Verified by Lead Agronomist. Recommend strict incorporation of zinc sulfate separate from phosphate.'
      }
    });
    assert(updateRecRes.status === 200 && updateRecRes.data.success === true, 'Recommendation draft updated with agronomist comments');

    // 16. Admin Approves Recommendation
    console.log('\n--- Step 16: Agronomist Approves Recommendation ---');
    const approveRecRes = await request(`/api/admin/recommendations/${newRecId}/approve`, {
      method: 'POST',
      headers: adminHeaders
    });
    assert(approveRecRes.status === 200 && approveRecRes.data.success === true, 'Recommendation status changed to APPROVED');

    // 17. Admin Sends Recommendation to Farmer
    console.log('\n--- Step 17: Admin Sends Recommendation to Farmer ---');
    const sendRecRes = await request(`/api/admin/recommendations/${newRecId}/send`, {
      method: 'POST',
      headers: adminHeaders
    });
    assert(sendRecRes.status === 200 && sendRecRes.data.success === true, 'Recommendation dispatched to farmer');
    assert(sendRecRes.data.data.messageId !== undefined, 'Message created for farmer');
    assert(sendRecRes.data.data.notificationId !== undefined, 'Notification created for farmer');

    // 18. Farmer Receives Notification & Message
    console.log('\n--- Step 18: Farmer Checks Inbound Messages ---');
    const farmerMessagesRes = await request('/api/farmer/messages', { headers: farmerHeaders });
    assert(farmerMessagesRes.status === 200 && farmerMessagesRes.data.success === true, 'Farmer retrieved messages');
    const matchingMsg = farmerMessagesRes.data.messages.find(m => m.recommendation_id == newRecId);
    assert(matchingMsg !== undefined, 'Farmer received message for recommendation');

    // 19. Farmer Marks Message as Read
    console.log('\n--- Step 19: Farmer Reads Message ---');
    const markReadRes = await request(`/api/farmer/messages/${matchingMsg.id}/read`, {
      method: 'PUT',
      headers: farmerHeaders
    });
    assert(markReadRes.status === 200 && markReadRes.data.success === true, 'Message marked as read');

    // 20. Farmer Views Full Recommendation Details & Multi-stage Schedule
    console.log('\n--- Step 20: Farmer Views Complete Recommendation & 6-Stage Timeline ---');
    const farmerRecRes = await request(`/api/farmer/recommendations/${newRecId}`, { headers: farmerHeaders });
    assert(farmerRecRes.status === 200 && farmerRecRes.data.success === true, 'Farmer opened recommendation');
    assert(farmerRecRes.data.recommendation.schedules.length === 6, 'Farmer can see 6 scheduled crop stages');
    assert(farmerRecRes.data.recommendation.explanation.includes('WHY'), 'Farmer sees explainable WHY rationale');

    // 21. Farmer Records Fertilizer Application History
    console.log('\n--- Step 21: Farmer Logs Fertilizer Application ---');
    const appLogRes = await request('/api/farmer/fertilizer-applications', {
      method: 'POST',
      headers: farmerHeaders,
      body: {
        farm_id: newFarmId,
        field_id: newFieldId,
        fertilizer_id: 2,
        fertilizer_name: 'Di-Ammonium Phosphate (DAP)',
        nutrient_composition: '18-46-0',
        quantity: 50.0,
        unit: 'kg',
        application_date: '2026-10-15',
        application_method: 'Basal Band Placement',
        crop: 'Wheat',
        growth_stage: 'Basal / Sowing',
        cost: 1350.0,
        notes: 'Applied at sowing as recommended by AgriWise'
      }
    });
    assert(appLogRes.status === 201 && appLogRes.data.success === true, 'Fertilizer application recorded in historical audit log');

    // 22. Farmer Soil History & Trend Data
    console.log('\n--- Step 22: Farmer Soil History & Trend Telemetry ---');
    const soilHistRes = await request(`/api/farmer/soil-history?field_id=${newFieldId}`, { headers: farmerHeaders });
    assert(soilHistRes.status === 200 && soilHistRes.data.success === true, 'Soil history retrieved');
    assert(soilHistRes.data.history.length >= 1, 'Historical soil test timeline available');

    // 23. Catalogues: Crops and Fertilizers
    console.log('\n--- Step 23: Admin Agronomic Catalogues (Crops & Fertilizers) ---');
    const cropsRes = await request('/api/admin/crops', { headers: adminHeaders });
    assert(cropsRes.status === 200 && cropsRes.data.crops.length >= 5, 'Admin accessed crops catalog');
    const fertsRes = await request('/api/admin/fertilizers', { headers: adminHeaders });
    assert(fertsRes.status === 200 && fertsRes.data.fertilizers.length >= 5, 'Admin accessed fertilizers catalog');

    // 24. Recommendation Rules / Calibration Settings
    console.log('\n--- Step 24: Recommendation Rules & Thresholds ---');
    const rulesRes = await request('/api/admin/rules', { headers: adminHeaders });
    assert(rulesRes.status === 200 && rulesRes.data.rules.length >= 5, 'Admin accessed recommendation rules');

    // 25. Security & RBAC Isolation Enforcement
    console.log('\n--- Step 25: Security & Role-Based Access Control Isolation ---');
    // A: Farmer attempting to access Admin endpoint must get 403 Forbidden
    const illegalAdminAccess = await request('/api/admin/soil-tests', { headers: farmerHeaders });
    assert(illegalAdminAccess.status === 403, `Farmer accessing admin API correctly rejected with 403 Forbidden (Got ${illegalAdminAccess.status})`);

    // B: Unauthenticated request to protected route must get 401 Unauthorized
    const unauthAccess = await request('/api/farmer/dashboard');
    assert(unauthAccess.status === 401, `Unauthenticated request correctly rejected with 401 Unauthorized (Got ${unauthAccess.status})`);

    console.log('\n============================================================');
    console.log('🎉 ALL 25 END-TO-END WORKFLOW & RBAC TESTS PASSED SUCCESSFULLY!');
    console.log('============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST RUN ENCOUNTERED AN ERROR:', err.message);
    process.exit(1);
  }
}

runTests();
