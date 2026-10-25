/**
 * AgriWise: AI-Based Smart Fertilizer Recommendation System
 * Database Initialization Script (MySQL)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function executeSqlFile(connection, filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  // Strip comments
  const cleanSql = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '')
    .trim();

  const statements = cleanSql
    .split(';')
    .map(st => st.trim())
    .filter(st => st.length > 0);

  for (const statement of statements) {
    try {
      await connection.query(statement);
    } catch (err) {
      if (!err.message.includes('already exists') && !err.message.includes('Duplicate')) {
        console.warn(`SQL Notice on statement: ${statement.substring(0, 60)}... -> ${err.message}`);
      }
    }
  }
}

async function initializeDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'root';
  const databaseName = process.env.DB_NAME || 'agriwise_db';

  console.log('🌱 ============================================================');
  console.log('   AgriWise - AI-Based Smart Fertilizer Recommendation System');
  console.log('   Database Setup & Migration');
  console.log('============================================================');
  console.log(`Connecting to MySQL at ${host}:${port} as '${user}'...`);

  let connection;
  try {
    // 1. Connect without specific database to create DB if needed
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    console.log('✓ Successfully connected to MySQL server.');

    // 2. Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✓ Database '${databaseName}' confirmed.`);

    // 3. Select database
    await connection.changeUser({ database: databaseName });

    // 4. Run schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    await executeSqlFile(connection, schemaPath);
    console.log('✓ Tables initialized successfully (users, farmer_profiles, farms, fields, crops, fertilizers, soil_tests, soil_parameters, soil_analysis, fertilizer_recommendations, fertilizer_schedules, messages, notifications, fertilizer_applications, recommendation_rules).');

    // 5. Run seed.sql
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      await executeSqlFile(connection, seedPath);
      console.log('✓ Demo data seeded successfully (Farmers, Admin, Crops, Fertilizers, Sample Farm, Field 01 test & recommendations).');
    }

    console.log('============================================================');
    console.log('Database initialization completed successfully!');
    console.log('Ready to run: npm start');
    console.log('============================================================');
  } catch (err) {
    console.error('\n❌ Database Initialization Failed!');
    console.error('Error Code:', err.code);
    console.error('Message:', err.message);
    console.log('\n[Troubleshooting Tips for Windows]');
    console.log('1. Verify your MySQL service is running (e.g. "MySQL80" in Windows Services).');
    console.log('2. Check your .env file credentials:');
    console.log(`   DB_HOST=${host}`);
    console.log(`   DB_PORT=${port}`);
    console.log(`   DB_USER=${user}`);
    console.log(`   DB_PASSWORD=<ensure your local MySQL root password is set in .env>`);
    console.log(`   DB_NAME=${databaseName}`);
    console.log('3. Run "npm run db:init" again once credentials are set.\n');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase, executeSqlFile };
