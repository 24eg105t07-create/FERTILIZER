/**
 * AgriWise - Database Seeder Script
 */

require('dotenv').config();
const path = require('path');
const mysql = require('mysql2/promise');
const { executeSqlFile } = require('./init');

async function runSeed() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'root';
  const databaseName = process.env.DB_NAME || 'agriwise_db';

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database: databaseName,
      multipleStatements: true
    });

    console.log(`✓ Connected to ${databaseName}. Seeding demo records...`);
    const seedPath = path.join(__dirname, 'seed.sql');
    await executeSqlFile(connection, seedPath);
    console.log('✓ Seeding complete.');
  } catch (err) {
    console.error('Seeding error:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
