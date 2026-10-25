const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Protect all admin routes
router.use(authenticateToken, requireAdmin);

// Dashboard & Analytics
router.get('/dashboard', adminController.getDashboardStats);

// Farmer Management
router.get('/farmers', adminController.getFarmers);
router.get('/farmers/:id', adminController.getFarmerById);

// Farms & Fields
router.get('/farms', adminController.getAllFarms);
router.get('/fields', adminController.getAllFields);

// Soil Tests Management
router.get('/soil-tests', adminController.getSoilTests);
router.get('/soil-tests/:id', adminController.getSoilTestById);
router.post('/soil-tests/:id/analyze', adminController.analyzeSoilTest);

// Recommendation Workflow
router.post('/recommendations/generate', adminController.generateRecommendation);
router.get('/recommendations', adminController.getRecommendations);
router.get('/recommendations/:id', adminController.getRecommendationById);
router.put('/recommendations/:id', adminController.updateRecommendation);
router.post('/recommendations/:id/approve', adminController.approveRecommendation);
router.put('/recommendations/:id/approve', adminController.approveRecommendation);
router.post('/recommendations/:id/send', adminController.sendRecommendation);
router.put('/recommendations/:id/send', adminController.sendRecommendation);

// Messages Log
router.get('/messages', adminController.getMessages);

// Catalogues CRUD
router.get('/crops', adminController.getCrops);
router.post('/crops', adminController.createCrop);
router.put('/crops/:id', adminController.updateCrop);
router.delete('/crops/:id', adminController.deleteCrop);

router.get('/fertilizers', adminController.getFertilizers);
router.post('/fertilizers', adminController.createFertilizer);
router.put('/fertilizers/:id', adminController.updateFertilizer);
router.delete('/fertilizers/:id', adminController.deleteFertilizer);

// Analytics & Reports
router.get('/analytics', adminController.getAnalytics);
router.get('/reports', adminController.getReports);

// Rules & Thresholds
router.get('/rules', adminController.getRules);
router.put('/rules/:id', adminController.updateRule);

module.exports = router;
