/**
 * Verification test for user registration, login, field management, and soil test workflow
 */

const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      if (typeof data === 'string') req.write(data);
      else req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting AgriWise Fix Verification Tests...\n');
  const timestamp = Date.now();

  try {
    // 1. Register as a new Farmer
    console.log('Test 1: Register as a new Farmer...');
    const farmerEmail = `newfarmer_${timestamp}@test.com`;
    const farmerPassword = 'Password@123';
    const regFarmer = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      role: 'farmer',
      name: 'Verif Farmer',
      email: farmerEmail,
      phone: '9988776655',
      password: farmerPassword,
      state: 'Telangana',
      district: 'Siddipet',
      village: 'Chinthamadaka',
      farmer_type: 'Medium Scale',
      total_farming_area: 7.5
    });

    if (!regFarmer.data.success || !regFarmer.data.token) {
      throw new Error(`Farmer registration failed: ${JSON.stringify(regFarmer.data)}`);
    }
    console.log('✓ Farmer registered successfully:', regFarmer.data.user);

    // 2. Login with the new Farmer credentials
    console.log('\nTest 2: Login with newly registered Farmer credentials...');
    const loginFarmer = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: farmerEmail,
      password: farmerPassword
    });

    if (!loginFarmer.data.success || !loginFarmer.data.token) {
      throw new Error(`Farmer login failed: ${JSON.stringify(loginFarmer.data)}`);
    }
    console.log('✓ Farmer login successful! Token issued. Redirect:', loginFarmer.data.redirectUrl);
    const farmerToken = loginFarmer.data.token;

    // 3. Register as a new Admin / Agronomist
    console.log('\nTest 3: Register as a new Admin / Agronomist...');
    const adminEmail = `newadmin_${timestamp}@test.com`;
    const adminPassword = 'AdminPassword@123';
    const regAdmin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      role: 'admin',
      name: 'Dr. Verif Agronomist',
      email: adminEmail,
      phone: '9123456780',
      password: adminPassword,
      state: 'New Delhi',
      district: 'Headquarters'
    });

    if (!regAdmin.data.success || !regAdmin.data.token || regAdmin.data.user.role !== 'admin') {
      throw new Error(`Admin registration failed: ${JSON.stringify(regAdmin.data)}`);
    }
    console.log('✓ Admin registered successfully with role:', regAdmin.data.user.role);

    // 4. Login with newly registered Admin credentials
    console.log('\nTest 4: Login with newly registered Admin credentials...');
    const loginAdmin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });

    if (!loginAdmin.data.success || !loginAdmin.data.token || loginAdmin.data.user.role !== 'admin') {
      throw new Error(`Admin login failed: ${JSON.stringify(loginAdmin.data)}`);
    }
    console.log('✓ Admin login successful! Token issued. Redirect:', loginAdmin.data.redirectUrl);
    const adminToken = loginAdmin.data.token;

    // 5. Farmer adds a Farm
    console.log('\nTest 5: Farmer creates a Farm...');
    const addFarm = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/farmer/farms',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${farmerToken}`
      }
    }, {
      farm_name: 'Verif Green Acres',
      country: 'India',
      state: 'Telangana',
      district: 'Siddipet',
      village: 'Chinthamadaka',
      area: 7.5,
      ownership_type: 'Owned',
      irrigation: 'Borewell & Drip',
      water_source: 'Groundwater',
      farming_type: 'Integrated Crop Management'
    });

    if (!addFarm.data.success || !addFarm.data.farmId) {
      throw new Error(`Add farm failed: ${JSON.stringify(addFarm.data)}`);
    }
    const farmId = addFarm.data.farmId;
    console.log('✓ Farm created with ID:', farmId);

    // 6. Farmer adds a Field to the Farm
    console.log('\nTest 6: Farmer creates a Field plot in that Farm...');
    const addField = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/farmer/fields',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${farmerToken}`
      }
    }, {
      farm_id: farmId,
      field_name: 'Plot North 01 - Paddy Sector',
      area: 4.0,
      soil_type: 'Black Clay Soil (Vertisol)',
      irrigation_type: 'Canal / Flood',
      drainage: 'Moderate',
      current_crop: 'Rice / Paddy',
      previous_crop: 'Wheat',
      sowing_date: '2026-10-15',
      harvest_date: '2027-02-28',
      farming_method: 'Conventional Tillage',
      topography: 'Flat / Plain'
    });

    if (!addField.data.success || !addField.data.fieldId) {
      throw new Error(`Add field failed: ${JSON.stringify(addField.data)}`);
    }
    const fieldId = addField.data.fieldId;
    console.log('✓ Field plot created with ID:', fieldId);

    // 7. Verify Farmer can retrieve fields and see the newly added field
    console.log('\nTest 7: Fetching Farmer fields to verify persistence...');
    const getFields = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/farmer/fields',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${farmerToken}` }
    });

    if (!getFields.data.success || !Array.isArray(getFields.data.fields)) {
      throw new Error(`Get fields failed: ${JSON.stringify(getFields.data)}`);
    }
    const myField = getFields.data.fields.find(f => f.id === fieldId || f.field_name === 'Plot North 01 - Paddy Sector');
    if (!myField) {
      throw new Error(`Field was NOT found in farmer's field list! Received: ${JSON.stringify(getFields.data.fields)}`);
    }
    console.log(`✓ Field verified in list! Farm Name: "${myField.farm_name}", Field: "${myField.field_name}"`);

    // 8. Submit a Soil Test request for the field
    console.log('\nTest 8: Farmer submits a Soil Test Request...');
    const submitTest = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/farmer/soil-tests',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${farmerToken}`
      }
    }, {
      farm_id: farmId,
      field_id: fieldId,
      sample_id: `VERIF-ST-${timestamp.toString().slice(-5)}`,
      test_date: '2026-10-25',
      lab_name: 'State Agricultural Soil Lab',
      notes: 'Soil sample taken after early monsoon ploughing.',
      nitrogen: 210,
      phosphorus: 12.5,
      potassium: 240,
      ph: 7.8,
      ec: 0.40,
      organic_carbon: 0.38,
      organic_matter: 0.65,
      zinc: 0.45,
      sulfur: 8.0
    });

    if (!submitTest.data.success || !submitTest.data.soilTestId) {
      throw new Error(`Soil test submission failed: ${JSON.stringify(submitTest.data)}`);
    }
    const soilTestId = submitTest.data.soilTestId;
    console.log('✓ Soil test submitted successfully with ID:', soilTestId);

    // 9. Verify Farmer sees the test in /api/farmer/soil-tests
    console.log('\nTest 9: Verifying Farmer test list...');
    const farmerTests = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/farmer/soil-tests',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${farmerToken}` }
    });
    const foundInFarmer = (farmerTests.data.tests || []).find(t => t.id === soilTestId);
    if (!foundInFarmer) {
      throw new Error(`Soil test not found in farmer test list! Received: ${JSON.stringify(farmerTests.data)}`);
    }
    console.log(`✓ Soil test ${soilTestId} verified in Farmer portal! Status: ${foundInFarmer.status}`);

    // 10. Verify Admin sees the test in /api/admin/soil-tests
    console.log('\nTest 10: Verifying Admin soil test queue...');
    const adminTests = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/soil-tests',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!adminTests.data.success || !Array.isArray(adminTests.data.tests) || adminTests.data.tests.length === 0) {
      throw new Error(`Admin soil tests query returned empty or failed: ${JSON.stringify(adminTests.data)}`);
    }
    const foundInAdmin = adminTests.data.tests.find(t => t.id === soilTestId);
    if (!foundInAdmin) {
      throw new Error(`Soil test ${soilTestId} not found in Admin queue! Tests returned: ${adminTests.data.tests.length}`);
    }
    console.log(`✓ Soil test ${soilTestId} successfully found in Admin queue! Total tests in DB: ${adminTests.data.tests.length}`);
    console.log(`   Sample ID: ${foundInAdmin.sample_id}, Farmer: ${foundInAdmin.farmer_name}, Farm: ${foundInAdmin.farm_name}`);

    // 11. Admin inspects and analyzes the soil test
    console.log('\nTest 11: Admin runs automated soil analysis...');
    const analyze = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/soil-tests/${soilTestId}/analyze`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!analyze.data.success || !analyze.data.analysis) {
      throw new Error(`Soil analysis failed: ${JSON.stringify(analyze.data)}`);
    }
    console.log('✓ Soil analysis complete:', {
      nitrogen: analyze.data.analysis.nitrogen_status,
      phosphorus: analyze.data.analysis.phosphorus_status,
      potassium: analyze.data.analysis.potassium_status,
      ph: analyze.data.analysis.ph_status
    });

    // 12. Admin generates recommendation draft
    console.log('\nTest 12: Admin generates recommendation draft...');
    const genRec = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/recommendations/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      soil_test_id: soilTestId
    });

    if (!genRec.data.success || !genRec.data.recommendation) {
      throw new Error(`Recommendation generation failed: ${JSON.stringify(genRec.data)}`);
    }
    const recId = genRec.data.recommendation.id;
    console.log('✓ Fertilizer recommendation generated with ID:', recId);

    // 13. Admin approves and dispatches to Farmer
    console.log('\nTest 13: Admin approves and sends recommendation to farmer...');
    const approve = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/recommendations/${recId}/approve`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      admin_comments: 'Approved with emphasis on split nitrogen dosing.'
    });

    if (!approve.data.success) {
      throw new Error(`Approve recommendation failed: ${JSON.stringify(approve.data)}`);
    }
    console.log('✓ Recommendation approved by admin!');

    const send = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/recommendations/${recId}/send`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!send.data.success) {
      throw new Error(`Sending recommendation failed: ${JSON.stringify(send.data)}`);
    }
    console.log('✓ Recommendation approved & sent to farmer!');

    // 14. Check Farmer receives recommendation & notification
    console.log('\nTest 14: Verifying Farmer receives recommendation and message...');
    const farmerRecs = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/farmer/recommendations',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${farmerToken}` }
    });

    if (!farmerRecs.data.success || farmerRecs.data.recommendations.length === 0) {
      throw new Error(`Farmer did not receive recommendation! Data: ${JSON.stringify(farmerRecs.data)}`);
    }
    console.log(`✓ Farmer received recommendation! Title: "${farmerRecs.data.recommendations[0].fertilizer_name}"`);

    console.log('\n🎉 ALL 14 TESTS PASSED PERFECTLY! ALL REPORTED ISSUES VERIFIED FIXED! 🎉\n');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
  }
}

runTests();
