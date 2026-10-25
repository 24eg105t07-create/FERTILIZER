const express = require('express');
const router = express.Router();
const farmerController = require('../controllers/farmerController');
const { authenticateToken } = require('../middleware/auth');
const { requireFarmer } = require('../middleware/roleMiddleware');
const upload = require('../middleware/upload');

// Protect all farmer routes
router.use(authenticateToken, requireFarmer);

// Dashboard
router.get('/dashboard', farmerController.getDashboardStats);

// Farms CRUD
router.get('/farms', farmerController.getFarms);
router.post('/farms', farmerController.createFarm);
router.get('/farms/:id', farmerController.getFarmById);
router.put('/farms/:id', farmerController.updateFarm);
router.delete('/farms/:id', farmerController.deleteFarm);

// Fields CRUD
router.get('/fields', farmerController.getFields);
router.post('/fields', farmerController.createField);
router.get('/fields/:id', farmerController.getFieldById);
router.put('/fields/:id', farmerController.updateField);
router.delete('/fields/:id', farmerController.deleteField);

// Soil Tests
router.post('/soil-tests', upload.single('report'), farmerController.submitSoilTest);
router.get('/soil-tests', farmerController.getSoilTests);
router.get('/soil-tests/:id', farmerController.getSoilTestById);

// Recommendations
router.get('/recommendations', farmerController.getRecommendations);
router.get('/recommendations/:id', farmerController.getRecommendationById);

// Messages
router.get('/messages', farmerController.getMessages);
router.put('/messages/:id/read', farmerController.markMessageRead);

// Notifications
router.get('/notifications', farmerController.getNotifications);
router.put('/notifications/:id/read', farmerController.markNotificationRead);

// Fertilizer History & Schedule
router.get('/fertilizer-history', farmerController.getFertilizerHistory);
router.post('/fertilizer-history', farmerController.addFertilizerApplication);
router.get('/fertilizer-applications', farmerController.getFertilizerHistory);
router.post('/fertilizer-applications', farmerController.addFertilizerApplication);

// Soil History
router.get('/soil-history', farmerController.getSoilHistory);

module.exports = router;
