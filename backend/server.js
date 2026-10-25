/**
 * AgriWise: AI-Based Smart Fertilizer Recommendation System
 * Main Express Application Server Entrypoint
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger (Development)
app.use((req, res, next) => {
  if (!req.path.startsWith('/css') && !req.path.startsWith('/js') && !req.path.startsWith('/assets')) {
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.path}`);
  }
  next();
});

// Serve Uploaded Files
app.use('/uploads', express.static(uploadDir));

// Serve Frontend Static Assets
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'AgriWise AI-Based Smart Fertilizer Recommendation System',
    timestamp: new Date().toISOString(),
    database: db.isConnectedToMySQL ? 'MySQL 8.0' : 'Fallback Engine (Active)'
  });
});

// Single Page Fallback for direct browser URLs
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Global 404 handler for unmatched APIs
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.'
  });
});

// Start Server & Connect Database
async function startServer() {
  await db.testConnection();

  app.listen(PORT, () => {
    console.log('\n============================================================');
    console.log('🌱 AgriWise: AI-Based Smart Fertilizer Recommendation System');
    console.log('============================================================');
    console.log(`🚀 Server running on: http://localhost:${PORT}`);
    console.log(`🌿 Landing Page:      http://localhost:${PORT}/index.html`);
    console.log(`🧑‍🌾 Farmer Portal:    http://localhost:${PORT}/login.html`);
    console.log(`🛡️ Admin Portal:     http://localhost:${PORT}/admin/login.html`);
    console.log('------------------------------------------------------------');
    console.log('Demo Credentials:');
    console.log('  Farmer: farmer@example.com / Farmer@123');
    console.log('  Admin:  admin@example.com  / Admin@123');
    console.log('============================================================\n');
  });
}

startServer();

module.exports = app;
