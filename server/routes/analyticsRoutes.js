const express = require('express');
const router = express.Router();
const { getDashboardStats, getDistribution, getDailyTrend, getStudentSummary } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
router.get('/stats', protect, getDashboardStats);
router.get('/distribution', protect, getDistribution);
router.get('/trend', protect, getDailyTrend);
router.get('/students', protect, getStudentSummary);
module.exports = router;
